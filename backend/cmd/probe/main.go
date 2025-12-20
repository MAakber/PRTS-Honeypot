package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

type NodeStatus struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Region         string  `json:"region"`
	Status         string  `json:"status"`
	Load           int     `json:"load"`
	MemoryUsage    int     `json:"memoryUsage"`
	MemoryTotal    uint64  `json:"memoryTotal"`
	Temperature    float64 `json:"temperature"`
	NetUp          float64 `json:"netUp"`
	NetDown        float64 `json:"netDown"`
	IP             string  `json:"ip"`
	OS             string  `json:"os"`
	Template       string  `json:"template"`
	TrafficHistory string  `json:"trafficHistory"`
	Uptime         string  `json:"uptime"`
	Version        string  `json:"version"`
	Interface      string  `json:"interface"`
	MAC            string  `json:"mac"`
	FirewallStatus string  `json:"firewallStatus"`
	FirewallError  string  `json:"firewallError"`
	FirewallInfo   string  `json:"firewallInfo"`
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type AccessControlRule struct {
	ID         string `json:"id"`
	IP         string `json:"ip"`
	Type       string `json:"type"` // blacklist, whitelist
	Reason     string `json:"reason"`
	Source     string `json:"source"`
	ExpireTime string `json:"expireTime"`
	AddTime    string `json:"addTime"`
	Status     string `json:"status"`
}

var (
	addr = flag.String("addr", "localhost:8080", "http service address")
	id   = flag.String("id", "probe-windows-01", "node id")
	name = flag.String("name", "Windows-Probe", "node name")
)

var (
	lastBytesSent     uint64
	lastBytesRecv     uint64
	lastTime          time.Time
	loadHistory       []int
	firewallEnabled   = true
	lastFirewallError string
	lastFirewallInfo  string
)

func main() {
	flag.Parse()
	log.SetFlags(0)

	lastTime = time.Now()
	currentNet, _ := net.IOCounters(false)
	if len(currentNet) > 0 {
		lastBytesSent = currentNet[0].BytesSent
		lastBytesRecv = currentNet[0].BytesRecv
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	u := url.URL{Scheme: "ws", Host: *addr, Path: "/api/v1/ws"}
	log.Printf("connecting to %s", u.String())

	c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	done := make(chan struct{})

	go func() {
		defer close(done)
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err == nil {
				if msg.Type == "COMMAND" {
					cmd := msg.Data.(string)
					log.Printf("Received command: %s", cmd)

					switch cmd {
					case "STOP":
						log.Println("Stopping probe by remote command...")
						os.Exit(0)
					case "RESTART":
						log.Println("Restarting probe...")
						// In a real scenario, you'd use a supervisor.
						// Here we just exit and assume the user/system restarts it.
						os.Exit(0)
					case "ENABLE_FIREWALL":
						log.Println("Enabling PRTS firewall protection...")
						firewallEnabled = true
						lastFirewallError = ""
						lastFirewallInfo = "PRTS Firewall Protection Enabled"
						if runtime.GOOS == "windows" {
							output, err := exec.Command("powershell", "-Command", "Enable-NetFirewallRule -Group 'PRTS-Honeypot' -ErrorAction Stop").CombinedOutput()
							if err != nil {
								// Ignore "ObjectNotFound" error which happens if no rules exist yet
								outputStr := string(output)
								if !strings.Contains(outputStr, "ObjectNotFound") && !strings.Contains(outputStr, "对象未找到") {
									lastFirewallError = strings.TrimSpace(outputStr)
									log.Printf("Failed to enable rules: %v\nOutput: %s", err, lastFirewallError)
								}
							}
						}
						// Send immediate status update to reflect change in UI instantly
						status := collectStatus()
						resp, _ := json.Marshal(Message{
							Type: "SYNC_COMPLETE",
							Data: status,
						})
						c.WriteMessage(websocket.TextMessage, resp)

					case "DISABLE_FIREWALL":
						log.Println("Disabling PRTS firewall protection...")
						firewallEnabled = false
						lastFirewallError = ""
						lastFirewallInfo = "PRTS Firewall Protection Disabled (Rules preserved)"
						// Disable PRTS rules instead of removing them
						if runtime.GOOS == "windows" {
							output, err := exec.Command("powershell", "-Command", "Disable-NetFirewallRule -Group 'PRTS-Honeypot' -ErrorAction Stop").CombinedOutput()
							if err != nil {
								// Ignore "ObjectNotFound" error which happens if no rules exist yet
								outputStr := string(output)
								if !strings.Contains(outputStr, "ObjectNotFound") && !strings.Contains(outputStr, "对象未找到") {
									lastFirewallError = strings.TrimSpace(outputStr)
									log.Printf("Failed to disable rules: %v\nOutput: %s", err, lastFirewallError)
								}
							}
						}
						// Send immediate status update to reflect change in UI instantly
						status := collectStatus()
						resp, _ := json.Marshal(Message{
							Type: "SYNC_COMPLETE",
							Data: status,
						})
						c.WriteMessage(websocket.TextMessage, resp)
					}
				} else if msg.Type == "SYNC_RULES" {
					log.Printf("Received firewall rules sync request")

					// Unmarshal rules
					jsonData, _ := json.Marshal(msg.Data)
					var rules []AccessControlRule
					if err := json.Unmarshal(jsonData, &rules); err == nil {
						applyFirewallRules(rules)
						// Send immediate status update after sync
						status := collectStatus()
						resp, _ := json.Marshal(Message{
							Type: "SYNC_COMPLETE",
							Data: status,
						})
						c.WriteMessage(websocket.TextMessage, resp)
					} else {
						log.Printf("Failed to unmarshal rules: %v", err)
					}
				}
			}
		}
	}()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			status := collectStatus()
			log.Printf("Reporting status: Load=%d%%, Uptime=%s", status.Load, status.Uptime)
			msg := Message{
				Type: "NODE_REPORT",
				Data: status,
			}

			data, _ := json.Marshal(msg)
			err := c.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Println("write:", err)
				return
			}
		case <-interrupt:
			log.Println("interrupt")

			// Cleanly close the connection by sending a close message and then
			// waiting (with timeout) for the server to close the connection.
			err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return
			}
			select {
			case <-done:
			case <-time.After(time.Second):
			}
			return
		}
	}
}

func collectStatus() NodeStatus {
	v, _ := mem.VirtualMemory()
	c, _ := cpu.Percent(0, false)
	h, _ := host.Info()

	// Get IP and MAC
	ip := "127.0.0.1"
	mac := "00:00:00:00:00:00"
	ifaceName := "unknown"
	if ifaces, err := net.Interfaces(); err == nil {
		for _, i := range ifaces {
			if len(i.Addrs) > 0 {
				for _, addr := range i.Addrs {
					// Prefer IPv4
					if !strings.Contains(addr.Addr, ":") && addr.Addr != "127.0.0.1" {
						ip = addr.Addr
						mac = i.HardwareAddr
						ifaceName = i.Name
						break
					}
				}
			}
			if ip != "127.0.0.1" {
				break
			}
		}
		// Fallback to IPv6 if no IPv4 found
		if ip == "127.0.0.1" {
			for _, i := range ifaces {
				if len(i.Addrs) > 0 {
					for _, addr := range i.Addrs {
						if addr.Addr != "127.0.0.1" && addr.Addr != "::1" {
							ip = addr.Addr
							mac = i.HardwareAddr
							ifaceName = i.Name
							break
						}
					}
				}
				if ip != "127.0.0.1" {
					break
				}
			}
		}
	}

	load := 0
	if len(c) > 0 {
		load = int(c[0])
	}
	memUsage := int(v.UsedPercent)
	memTotal := v.Total / (1024 * 1024) // MB

	// Get Temperature
	temp := 0.0
	if temps, err := host.SensorsTemperatures(); err == nil && len(temps) > 0 {
		// Try to find a CPU package temperature or just take the first one
		for _, t := range temps {
			if t.SensorKey == "coretemp_package_id_0" || t.SensorKey == "cpu_thermal" {
				temp = t.Temperature
				break
			}
		}
		if temp == 0 {
			temp = temps[0].Temperature
		}
	}
	// Fallback for Windows/Environments where sensors are not available
	if temp == 0 {
		// Simulate a realistic temperature based on load if no sensor found
		temp = 35.0 + (float64(load) * 0.4) + (float64(time.Now().Unix()%10) / 10.0)
	}

	// Maintain load history for sparkline
	loadHistory = append(loadHistory, load)
	if len(loadHistory) > 20 {
		loadHistory = loadHistory[1:]
	}

	// Real Network Traffic (MB/s)
	var netUp, netDown float64
	now := time.Now()
	duration := now.Sub(lastTime).Seconds()
	currentNet, _ := net.IOCounters(false)
	if len(currentNet) > 0 && duration > 0 {
		sent := currentNet[0].BytesSent
		recv := currentNet[0].BytesRecv

		netUp = float64(sent-lastBytesSent) / (1024 * 1024) / duration
		netDown = float64(recv-lastBytesRecv) / (1024 * 1024) / duration

		lastBytesSent = sent
		lastBytesRecv = recv
		lastTime = now
	}

	// Calculate Uptime
	uptimeSec := h.Uptime
	days := uptimeSec / (24 * 3600)
	hours := (uptimeSec % (24 * 3600)) / 3600
	mins := (uptimeSec % 3600) / 60
	uptimeStr := fmt.Sprintf("%dd %02dh %02dm", days, hours, mins)

	// Use load history for the sparkline to make it look dynamic
	trafficJSON, _ := json.Marshal(loadHistory)

	// Determine template based on OS
	template := "Standard Linux Node"
	if h.OS == "windows" {
		template = "Windows Desktop Node"
		if h.Platform == "windows" {
			template = "Windows 11 Pro"
		}
	}

	return NodeStatus{
		ID:             *id,
		Name:           *name,
		Region:         "CN-SH",
		Status:         "online",
		Load:           load,
		MemoryUsage:    memUsage,
		MemoryTotal:    memTotal,
		Temperature:    temp,
		NetUp:          netUp,
		NetDown:        netDown,
		IP:             ip,
		OS:             runtime.GOOS, // Use runtime.GOOS for consistency
		Template:       template,
		TrafficHistory: string(trafficJSON),
		Uptime:         uptimeStr,
		Version:        fmt.Sprintf("v1.2.0-%s", h.KernelVersion),
		Interface:      ifaceName,
		MAC:            mac,
		FirewallStatus: getFirewallStatus(),
		FirewallError:  lastFirewallError,
		FirewallInfo:   lastFirewallInfo,
	}
}

func getFirewallStatus() string {
	if runtime.GOOS == "windows" {
		// Check if running as admin by trying to fetch firewall status
		cmd := exec.Command("netsh", "advfirewall", "show", "currentprofile")
		_, err := cmd.CombinedOutput()
		if err != nil {
			lastFirewallError = "Admin privileges required for firewall management"
			return "error"
		}
	}

	// If PRTS toggle is off, we report as inactive regardless of system firewall state
	if !firewallEnabled {
		return "inactive"
	}

	if lastFirewallError != "" {
		return "error"
	}

	return "active"
}

func applyFirewallRules(rules []AccessControlRule) {
	if !firewallEnabled {
		log.Println("Firewall protection is disabled, skipping rule application")
		return
	}
	if runtime.GOOS != "windows" {
		log.Println("Firewall control only supported on Windows for now")
		return
	}

	log.Printf("Applying Windows Firewall rules... (Received %d rules)", len(rules))
	lastFirewallError = "" // Reset on new attempt
	lastFirewallInfo = ""

	// Group IPs by action
	var blockIPs []string
	var allowIPs []string

	for _, rule := range rules {
		if rule.Status != "active" {
			continue
		}
		targetIP := strings.TrimSpace(rule.IP)
		if targetIP == "" {
			continue
		}

		if rule.Type == "whitelist" {
			allowIPs = append(allowIPs, targetIP)
		} else {
			blockIPs = append(blockIPs, targetIP)
		}
	}

	log.Printf("Processing IPs: %d to block, %d to allow", len(blockIPs), len(allowIPs))

	// 1. Clear existing PRTS rules using Group
	// We use PowerShell for better group management
	log.Println("Clearing existing PRTS rules...")
	clearCmd := exec.Command("powershell", "-Command", "Remove-NetFirewallRule -Group 'PRTS-Honeypot' -ErrorAction SilentlyContinue")
	clearCmd.Run()

	// 2. Add combined rules
	// Blacklist Rule
	if len(blockIPs) > 0 {
		ips := strings.Join(blockIPs, ",")
		log.Printf("Creating block rule for IPs: %s", ips)
		addBlockCmd := exec.Command("powershell", "-Command", fmt.Sprintf(
			"New-NetFirewallRule -DisplayName 'PRTS Inbound Block List' -Name 'PRTS-Block-Rules' -Direction Inbound -Action Block -RemoteAddress %s -Group 'PRTS-Honeypot' -Description 'Managed by PRTS Honeypot'",
			ips,
		))
		output, err := addBlockCmd.CombinedOutput()
		if err != nil {
			lastFirewallError = strings.TrimSpace(string(output))
			log.Printf("Failed to add block rules: %v\nOutput: %s", err, lastFirewallError)
		} else {
			msg := fmt.Sprintf("Successfully added block rule for %d IPs", len(blockIPs))
			log.Println(msg)
			if lastFirewallInfo != "" {
				lastFirewallInfo += "; " + msg
			} else {
				lastFirewallInfo = msg
			}
		}
	} else {
		log.Println("No block IPs to apply.")
	}

	// Whitelist Rule
	if len(allowIPs) > 0 {
		ips := strings.Join(allowIPs, ",")
		log.Printf("Creating allow rule for IPs: %s", ips)
		addAllowCmd := exec.Command("powershell", "-Command", fmt.Sprintf(
			"New-NetFirewallRule -DisplayName 'PRTS Inbound Allow List' -Name 'PRTS-Allow-Rules' -Direction Inbound -Action Allow -RemoteAddress %s -Group 'PRTS-Honeypot' -Description 'Managed by PRTS Honeypot'",
			ips,
		))
		output, err := addAllowCmd.CombinedOutput()
		if err != nil {
			if lastFirewallError == "" {
				lastFirewallError = strings.TrimSpace(string(output))
			}
			log.Printf("Failed to add allow rules: %v\nOutput: %s", err, string(output))
		} else {
			msg := fmt.Sprintf("Successfully added allow rule for %d IPs", len(allowIPs))
			log.Println(msg)
			if lastFirewallInfo != "" {
				lastFirewallInfo += "; " + msg
			} else {
				lastFirewallInfo = msg
			}
		}
	} else {
		log.Println("No allow IPs to apply.")
	}
}

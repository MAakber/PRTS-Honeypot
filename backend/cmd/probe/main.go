package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

type NodeStatus struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Region         string `json:"region"`
	Status         string `json:"status"`
	Load           int    `json:"load"`
	IP             string `json:"ip"`
	OS             string `json:"os"`
	Template       string `json:"template"`
	TrafficHistory string `json:"trafficHistory"`
	Uptime         string `json:"uptime"`
	Version        string `json:"version"`
	Interface      string `json:"interface"`
	MAC            string `json:"mac"`
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

var (
	addr = flag.String("addr", "localhost:8080", "http service address")
	id   = flag.String("id", "probe-windows-01", "node id")
	name = flag.String("name", "Windows-Probe", "node name")
)

var (
	lastNetIO   uint64
	loadHistory []int
)

func main() {
	flag.Parse()
	log.SetFlags(0)

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
	_, _ = mem.VirtualMemory()
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

	load := 0
	if len(c) > 0 {
		load = int(c[0])
	}

	// Maintain load history for sparkline (using load as a proxy for traffic for now, or real traffic)
	loadHistory = append(loadHistory, load)
	if len(loadHistory) > 20 {
		loadHistory = loadHistory[1:]
	}

	// Real Network Traffic
	currentNet, _ := net.IOCounters(false)
	if len(currentNet) > 0 {
		total := currentNet[0].BytesSent + currentNet[0].BytesRecv
		lastNetIO = total
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
		IP:             ip,
		OS:             h.Platform,
		Template:       template,
		TrafficHistory: string(trafficJSON),
		Uptime:         uptimeStr,
		Version:        fmt.Sprintf("v1.2.0-%s", h.KernelVersion),
		Interface:      ifaceName,
		MAC:            mac,
	}
}

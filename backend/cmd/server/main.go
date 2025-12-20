package main

import (
	"log"
	"time"

	"backend/internal/api"
	"backend/internal/middleware"
	"backend/internal/model"
	"backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Initialize Database
	db, err := gorm.Open(sqlite.Open("prts.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// Auto Migrate
	log.Println("Running database migrations...")
	err = db.AutoMigrate(
		&model.User{},
		&model.AttackLog{},
		&model.NodeStatus{},
		&model.Message{},
		&model.SystemConfig{},
		&model.Template{},
		&model.Service{},
		&model.AttackSource{},
		&model.AccountCredential{},
		&model.ScanLog{},
		&model.DecoyLog{},
		&model.SampleLog{},
		&model.VulnRule{},
		&model.TrafficRule{},
		&model.DefenseStrategy{},
		&model.AccessControlRule{},
		&model.LoginLog{},
		&model.Report{},
		&model.LoginAttempt{},
		&model.LoginPolicy{},
	)
	if err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	// Reset all nodes to offline on startup
	db.Model(&model.NodeStatus{}).Where("1 = 1").Update("status", "offline")

	// Initialize WebSocket Hub
	// We need to initialize Handler first to use its method, but Handler needs Hub.
	// So we use a closure that captures the Handler variable.
	var h *api.Handler
	hub := websocket.NewHub(func(msg []byte, client *websocket.Client) {
		if h != nil {
			h.HandleWebSocketMessage(msg, client)
		}
	}, func(client *websocket.Client) {
		if h != nil {
			h.HandleWebSocketDisconnect(client)
		}
	})
	go hub.Run()

	h = &api.Handler{DB: db, Hub: hub}

	// Load persisted time offset
	h.LoadTimeOffset()

	// Seed Data
	seedData(db)

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/public/login-policy", h.GetPublicLoginPolicy)
		v1.POST("/login", h.LoginHandler)
		v1.POST("/ingest", h.IngestAttack)

		// WebSocket endpoint
		v1.GET("/ws", func(c *gin.Context) {
			websocket.ServeWs(hub, c.Writer, c.Request)
		})

		// Protected routes
		protected := v1.Group("/")
		protected.Use(middleware.AuthRequired(string(api.JwtSecret), db))
		{
			protected.GET("/attacks", h.GetAttacks)
			protected.GET("/nodes", h.GetNodes)
			protected.POST("/nodes/command", h.HandleNodeCommand)
			protected.GET("/stats/dashboard", h.GetDashboardStats)
			protected.GET("/stats/system", h.GetSystemStats)

			// Messages
			protected.GET("/messages", h.GetMessages)
			protected.POST("/messages/read-all", h.MarkAllMessagesRead)
			protected.DELETE("/messages/:id", h.DeleteMessage)

			// Config
			protected.GET("/config", h.GetConfig)
			protected.POST("/config", h.UpdateConfig)
			protected.POST("/system/ntp-sync", h.NtpSync)

			// Templates & Services
			protected.GET("/templates", h.GetTemplates)
			protected.GET("/services", h.GetServices)
			protected.GET("/attack-sources", h.GetAttackSources)
			protected.GET("/account-credentials", h.GetAccountCredentials)
			protected.GET("/scans", h.GetScans)
			protected.GET("/decoys", h.GetDecoys)
			protected.GET("/samples", h.GetSamples)
			protected.GET("/vuln-rules", h.GetVulnRules)
			protected.GET("/traffic-rules", h.GetTrafficRules)
			protected.GET("/defense-strategies", h.GetDefenseStrategies)
			protected.GET("/access-rules", h.GetAccessControlRules)
			protected.GET("/login-logs", h.GetLoginLogs)
			protected.GET("/reports", h.GetReports)

			// User Management
			protected.GET("/users", h.GetUsers)
			protected.POST("/users", h.CreateUser)
			protected.DELETE("/users/:id", h.DeleteUser)
			protected.POST("/user/password", h.UpdatePassword)
		}
	}

	log.Println("PRTS Backend starting on :8080...")
	r.Run(":8080")
}

func seedData(db *gorm.DB) {
	// Seed Users
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count == 0 {
		// Default admin: prts123456
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("prts123456"), 10)
		admin := model.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     "admin",
		}
		db.Create(&admin)
		log.Println("Default admin user created: admin / prts123456")
	}

	// Seed Messages
	db.Model(&model.Message{}).Count(&count)
	if count == 0 {
		messages := []model.Message{
			{ID: "msg-1", Title: "System Update Completed", Content: "PRTS Honeypot System has been updated to v3.3.7.", Time: api.GetNow(), Type: "system", Read: false},
			{ID: "msg-2", Title: "High Risk Attack Detected", Content: "Multiple failed login attempts detected from IP 192.168.1.105.", Time: api.GetNow().Add(-time.Hour), Type: "security", Read: false},
		}
		db.Create(&messages)
	}

	// Seed Config
	db.Model(&model.SystemConfig{}).Count(&count)
	if count == 0 {
		configs := []model.SystemConfig{
			{Key: "defense_level", Value: "1", Description: "Current defense level"},
			{Key: "auto_defense", Value: "true", Description: "Enable auto defense"},
			{Key: "cloud_plan_enabled", Value: "true", Description: "Enable cloud threat intel sharing"},
		}
		db.Create(&configs)
	}

	// Seed Nodes
	// Removed mock nodes to only show real probe data

	// Seed Attack Sources
	db.Model(&model.AttackSource{}).Count(&count)
	if count == 0 {
		sources := []model.AttackSource{
			{ID: "AS-001", IP: "3.84.203.101", Country: "US", Verdict: "high", AttackCount: 2704, ScanCount: 2695, Nodes: "Internal Node", FirstTime: "2025/11/23 23:19:27", Tags: "scan,dynamic_ip"},
			{ID: "AS-002", IP: "117.132.188.205", Country: "CN", Verdict: "medium", AttackCount: 300, ScanCount: 18, Nodes: "Internal Node", FirstTime: "2025/11/20 12:16:10", Tags: "trash_mail"},
		}
		db.Create(&sources)
	}

	// Seed Account Credentials
	db.Model(&model.AccountCredential{}).Count(&count)
	if count == 0 {
		creds := []model.AccountCredential{
			{ID: "AC-001", Service: "SSH", Username: "admin", Password: "password123", IP: "192.168.1.105", Count: 12, Time: "2025/12/01 10:00:00"},
			{ID: "AC-002", Service: "MySQL", Username: "root", Password: "root", IP: "192.168.1.106", Count: 5, Time: "2025/12/01 11:00:00"},
		}
		db.Create(&creds)
	}

	// Seed Services
	db.Model(&model.Service{}).Count(&count)
	if count == 0 {
		services := []model.Service{
			{ID: "svc-1", Name: "SSH Honeypot", Category: "Remote Access", InteractionType: "high", RefTemplateCount: 5, RefNodeCount: 12, DefaultPort: "22", Description: "Standard SSH honeypot with session logging.", IsCloud: false, Type: "ssh", AttackCount: 1250},
			{ID: "svc-2", Name: "HTTP Web Server", Category: "Web Service", InteractionType: "low", RefTemplateCount: 8, RefNodeCount: 24, DefaultPort: "80, 443", Description: "Generic HTTP server with common vulnerability simulations.", IsCloud: false, Type: "http", AttackCount: 3400},
		}
		db.Create(&services)
	}

	// Seed Scan Logs
	db.Model(&model.ScanLog{}).Count(&count)
	if count == 0 {
		scans := []model.ScanLog{
			{ID: "scan-1", IP: "192.168.1.105", Threat: "Malicious", Node: "Chernobog-A", Location: "Internal", Type: "TCP", Count: 150, Ports: "22, 80, 443", Start: "2025-11-06 10:00:00", Duration: "5m 12s"},
			{ID: "scan-2", IP: "10.0.0.50", Threat: "Suspicious", Node: "Lungmen-01", Location: "Internal", Type: "UDP", Count: 45, Ports: "53, 123", Start: "2025-11-06 11:30:00", Duration: "1m 45s"},
		}
		db.Create(&scans)
	}

	// Seed Decoy Logs
	db.Model(&model.DecoyLog{}).Count(&count)
	if count == 0 {
		decoys := []model.DecoyLog{
			{
				ID:         "DL-001",
				Type:       "File",
				Status:     "Compromised",
				Device:     "WIN-SRV-01",
				SourceIP:   "192.168.1.109",
				Time:       "2025/12/06 10:15:22",
				Result:     "Handled",
				DecoyName:  "passwords.txt",
				DeployTime: "2025/11/20 09:00:00",
				Node:       "Internal Node",
			},
			{
				ID:         "DL-002",
				Type:       "Process",
				Status:     "Compromised",
				Device:     "DB-MASTER",
				SourceIP:   "192.168.1.55",
				Time:       "2025/12/06 09:30:15",
				Result:     "Pending",
				DecoyName:  "backup_service.exe",
				DeployTime: "2025/11/22 14:30:00",
				Node:       "Internal Node",
			},
		}
		db.Create(&decoys)
	}

	// Seed Sample Logs
	db.Model(&model.SampleLog{}).Count(&count)
	if count == 0 {
		samples := []model.SampleLog{
			{
				ID:           "SMP-001",
				FileName:     "wannacry.exe",
				FileSize:     "4.2 MB",
				FileType:     "EXE",
				ThreatLevel:  "malicious",
				Status:       "completed",
				CaptureCount: 15,
				LastTime:     "2023-10-24 12:45:00",
				AttackerIP:   "192.168.1.55",
				SourceNode:   "Chernobog-A",
				SHA256:       "a1b2c3d4e5f6...",
			},
			{
				ID:           "SMP-002",
				FileName:     "invoice_scan.pdf.exe",
				FileSize:     "1.8 MB",
				FileType:     "EXE",
				ThreatLevel:  "malicious",
				Status:       "completed",
				CaptureCount: 3,
				LastTime:     "2023-10-24 13:02:15",
				AttackerIP:   "45.148.10.247",
				SourceNode:   "Lungmen-Gateway",
				SHA256:       "8877665544...",
			},
		}
		db.Create(&samples)
	}

	// Seed Vuln Rules
	db.Model(&model.VulnRule{}).Count(&count)
	if count == 0 {
		rules := []model.VulnRule{
			{
				ID:          "VUL-001",
				Name:        "Linux Command Execution",
				Type:        "Behavior - Internal",
				Severity:    "high",
				HitCount:    19,
				LastHitTime: "2025/12/06 15:52:25",
				Creator:     "admin",
				Status:      "active",
				UpdateTime:  "2025/11/18 01:47:28",
				Updater:     "admin",
			},
			{
				ID:          "VUL-002",
				Name:        "SQL Injection Attempt",
				Type:        "Web - External",
				Severity:    "medium",
				HitCount:    45,
				LastHitTime: "2025/12/06 16:00:00",
				Creator:     "admin",
				Status:      "active",
				UpdateTime:  "2025/11/20 10:00:00",
				Updater:     "admin",
			},
		}
		db.Create(&rules)
	}

	// Seed Traffic Rules
	db.Model(&model.TrafficRule{}).Count(&count)
	if count == 0 {
		rules := []model.TrafficRule{
			{
				ID:       "TR-001",
				Name:     "Malicious Scanner Block",
				Category: "Scanner",
				Pattern:  "Nmap/Masscan",
				Status:   "active",
				Hits:     1240,
			},
			{
				ID:       "TR-002",
				Name:     "SQL Injection Filter",
				Category: "Injection",
				Pattern:  "SELECT/UNION/INSERT",
				Status:   "active",
				Hits:     856,
			},
			{
				ID:       "TR-003",
				Name:     "Brute Force Protection",
				Category: "BruteForce",
				Pattern:  "Login Failure > 5/min",
				Status:   "active",
				Hits:     2103,
			},
		}
		db.Create(&rules)
	}

	// Seed Defense Strategies
	db.Model(&model.DefenseStrategy{}).Count(&count)
	if count == 0 {
		strategies := []model.DefenseStrategy{
			{
				ID:          "STR-001",
				Name:        "SSH Brute Force Protection",
				Description: "Automatically block IPs with more than 5 failed SSH logins",
				Trigger:     "SSH Login Fail > 5",
				Action:      "Block IP (24h)",
				Status:      "active",
			},
			{
				ID:          "STR-002",
				Name:        "Web Admin Honeypot",
				Description: "Alert when someone accesses /admin_backup",
				Trigger:     "Access /admin_backup",
				Action:      "Alert Only",
				Status:      "active",
			},
			{
				ID:          "STR-003",
				Name:        "DDoS Mitigation",
				Description: "Drop packets if SYN rate exceeds 1000/s",
				Trigger:     "SYN > 1000/s",
				Action:      "Drop Packet",
				Status:      "inactive",
			},
		}
		db.Create(&strategies)
	}

	// Seed Access Control Rules
	db.Model(&model.AccessControlRule{}).Count(&count)
	if count == 0 {
		rules := []model.AccessControlRule{
			{
				ID:         "AC-001",
				IP:         "192.168.1.100",
				Type:       "blacklist",
				Reason:     "Repeated SSH failures",
				Source:     "PRTS",
				ExpireTime: "2025-12-07 10:00:00",
				AddTime:    "2025-12-06 10:00:00",
				Status:     "active",
			},
			{
				ID:         "AC-002",
				IP:         "10.0.0.0/24",
				Type:       "whitelist",
				Reason:     "Internal management network",
				Source:     "SYSTEM",
				ExpireTime: "",
				AddTime:    "2025-12-01 08:00:00",
				Status:     "active",
			},
			{
				ID:         "AC-003",
				IP:         "45.148.10.247",
				Type:       "blacklist",
				Reason:     "Known malicious actor",
				Source:     "PRTS",
				ExpireTime: "",
				AddTime:    "2025-12-05 15:30:00",
				Status:     "active",
			},
		}
		db.Create(&rules)
	}

	// Seed Login Logs
	db.Model(&model.LoginLog{}).Count(&count)
	if count == 0 {
		logs := []model.LoginLog{
			{Username: "admin", Time: "2025-12-06 10:23:45", IP: "192.168.1.50", Status: "success", Device: "Chrome 118 / Windows 10"},
			{Username: "unknown", Time: "2025-12-05 18:12:11", IP: "192.168.1.55", Status: "failure", Device: "Firefox 115 / Linux"},
			{Username: "operator01", Time: "2025-12-05 09:30:00", IP: "10.0.0.5", Status: "success", Device: "Safari / macOS"},
		}
		db.Create(&logs)
	}

	// Seed Reports
	db.Model(&model.Report{}).Count(&count)
	if count == 0 {
		reports := []model.Report{
			{ID: "RPT-001", Name: "Daily Security Summary", Module: "Threat Perception", Type: "daily", Size: "1.2 MB", Status: "success", Creator: "SYSTEM", CreateTime: "2025-12-06 00:00:00"},
			{ID: "RPT-002", Name: "Weekly Attack Analysis", Module: "All Modules", Type: "weekly", Size: "4.5 MB", Status: "success", Creator: "admin", CreateTime: "2025-12-01 08:00:00"},
		}
		db.Create(&reports)
	}

	// Seed Login Policy
	db.Model(&model.LoginPolicy{}).Count(&count)
	if count == 0 {
		policy := model.LoginPolicy{
			ID:        1,
			MaxRetry:  5,
			Lockout:   15,
			Session:   1440, // 24h
			URL:       "",
			Whitelist: "",
		}
		db.Create(&policy)
	}
}

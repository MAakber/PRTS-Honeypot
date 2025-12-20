package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/websocket"

	"sync/atomic"

	"github.com/beevik/ntp"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var JwtSecret = []byte("PRTS_SYSTEM_SECRET_KEY_2025")
var globalTimeOffset int64 // nanoseconds, atomic

func GetNow() time.Time {
	offset := atomic.LoadInt64(&globalTimeOffset)
	return time.Now().Add(time.Duration(offset))
}

func (h *Handler) Now() time.Time {
	return GetNow()
}

func (h *Handler) LoadTimeOffset() {
	var cfg model.SystemConfig
	if err := h.DB.Where("key = ?", "time_offset").First(&cfg).Error; err == nil {
		offset, _ := strconv.ParseInt(cfg.Value, 10, 64)
		atomic.StoreInt64(&globalTimeOffset, offset)
	}
}

type Handler struct {
	DB  *gorm.DB
	Hub *websocket.Hub
}

func (h *Handler) getLoginPolicy() model.LoginPolicy {
	var policy model.LoginPolicy
	// Default values
	policy.MaxRetry = 5
	policy.Lockout = 30
	policy.Session = 120
	policy.URL = "login"

	if err := h.DB.Where("id = ?", 1).First(&policy).Error; err != nil {
		// If not found in table, try to migrate from SystemConfig if it exists
		var cfg model.SystemConfig
		if err := h.DB.Where("key = ?", "login_policy").First(&cfg).Error; err == nil {
			json.Unmarshal([]byte(cfg.Value), &policy)
			policy.ID = 1
			h.DB.Create(&policy)
		}
	}
	return policy
}

func (h *Handler) StartAutoCleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			var expiredRules []model.AccessControlRule
			now := h.Now()

			// Find rules that just expired
			h.DB.Where("status = ? AND expire_time != ? AND expire_time != ? AND expire_time != ?",
				"active", "", "永久", "Permanent").Find(&expiredRules)

			hasChanges := false
			for _, rule := range expiredRules {
				// Use ParseInLocation with time.Local to match the base of h.Now()
				expireTime, err := time.ParseInLocation("2006/01/02 15:04:05", rule.ExpireTime, time.Local)
				if err == nil && expireTime.Before(now) {
					h.DB.Model(&rule).Update("status", "expired")
					hasChanges = true
					log.Printf("Rule %s (%s) has expired automatically at %s (NTP Time: %s)",
						rule.ID, rule.IP, rule.ExpireTime, now.Format("2006/01/02 15:04:05"))
				}
			}

			// If any rule expired, broadcast sync to all nodes
			if hasChanges {
				var activeRules []model.AccessControlRule
				h.DB.Where("status = ?", "active").Find(&activeRules)
				msg, _ := json.Marshal(map[string]interface{}{
					"type": "SYNC_RULES",
					"data": activeRules,
				})
				h.Hub.Broadcast(msg)
			}
		}
	}()
}

func (h *Handler) GetPublicLoginPolicy(c *gin.Context) {
	policy := h.getLoginPolicy()
	// Don't return whitelist to public
	policy.Whitelist = ""
	c.JSON(http.StatusOK, policy)
}

func (h *Handler) LoginHandler(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	policy := h.getLoginPolicy()
	clientIP := c.ClientIP()

	// 1. Check IP Whitelist
	if policy.Whitelist != "" {
		whitelisted := false
		ips := strings.Split(policy.Whitelist, ",")
		for _, ip := range ips {
			if strings.TrimSpace(ip) == clientIP {
				whitelisted = true
				break
			}
		}
		if !whitelisted {
			c.JSON(http.StatusForbidden, gin.H{"error": "IP not in whitelist"})
			return
		}
	}

	// 2. Check Lockout
	var attempt model.LoginAttempt
	h.DB.Where("ip = ? OR username = ?", clientIP, req.Username).First(&attempt)
	if attempt.LockedUntil.After(h.Now()) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Account locked",
			"until": attempt.LockedUntil.Format("2006-01-02 15:04:05"),
		})
		return
	}

	var user model.User
	loginStatus := "failure"

	// Decode password from Base64 (Neural Link Decryption)
	decodedPassword, err := base64.StdEncoding.DecodeString(req.Password)
	passwordToVerify := req.Password
	if err == nil {
		passwordToVerify = string(decodedPassword)
	}

	authSuccess := false
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err == nil {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(passwordToVerify)); err == nil {
			authSuccess = true
			loginStatus = "success"
		}
	}

	if !authSuccess {
		// Update failed attempts
		if attempt.ID == 0 {
			attempt = model.LoginAttempt{IP: clientIP, Username: req.Username, Attempts: 1, LastTime: h.Now()}
			h.DB.Create(&attempt)
		} else {
			attempt.Attempts++
			attempt.LastTime = h.Now()
			if attempt.Attempts >= policy.MaxRetry {
				attempt.LockedUntil = h.Now().Add(time.Duration(policy.Lockout) * time.Minute)
			}
			h.DB.Save(&attempt)
		}

		h.recordLoginLog(req.Username, clientIP, "failure", c.GetHeader("User-Agent"))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
		return
	}

	// Reset attempts on success
	if attempt.ID != 0 {
		h.DB.Model(&attempt).Updates(map[string]interface{}{"attempts": 0, "locked_until": time.Time{}})
	}

	h.recordLoginLog(req.Username, clientIP, loginStatus, c.GetHeader("User-Agent"))

	// Use session timeout from policy
	sessionDuration := time.Duration(policy.Session) * time.Minute
	if sessionDuration == 0 {
		sessionDuration = time.Hour * 24 // Default 24h
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"role":     user.Role,
		"exp":      h.Now().Add(sessionDuration).Unix(),
	})

	tokenString, _ := token.SignedString(JwtSecret)

	c.JSON(http.StatusOK, model.LoginResponse{
		Token: tokenString,
		User:  user,
	})
}

func (h *Handler) GetAttacks(c *gin.Context) {
	var attacks []model.AttackLog
	h.DB.Find(&attacks)
	c.JSON(http.StatusOK, attacks)
}

func (h *Handler) GetNodes(c *gin.Context) {
	var nodes []model.NodeStatus
	h.DB.Find(&nodes)
	c.JSON(http.StatusOK, nodes)
}

func (h *Handler) GetDashboardStats(c *gin.Context) {
	var totalAttacks int64
	var activeNodes int64
	var totalNodes int64
	var activeServices int64
	var totalServices int64
	var totalSources int64
	var totalScans int64
	var totalCredentials int64

	h.DB.Model(&model.AttackLog{}).Count(&totalAttacks)
	h.DB.Model(&model.NodeStatus{}).Where("status = ?", "online").Count(&activeNodes)
	h.DB.Model(&model.NodeStatus{}).Count(&totalNodes)
	h.DB.Model(&model.Service{}).Where("status = ?", "running").Count(&activeServices)
	h.DB.Model(&model.Service{}).Count(&totalServices)
	h.DB.Model(&model.AttackSource{}).Count(&totalSources)
	h.DB.Model(&model.AccountCredential{}).Count(&totalCredentials)

	// Sum scan counts from sources
	h.DB.Model(&model.AttackSource{}).Select("sum(scan_count)").Row().Scan(&totalScans)

	// Get top sources
	var topSources []model.AttackSource
	h.DB.Order("attack_count desc").Limit(5).Find(&topSources)

	type SourceItem struct {
		IP    string `json:"ip"`
		Count int    `json:"count"`
		Loc   string `json:"loc"`
	}
	var topSourcesList []SourceItem
	for _, s := range topSources {
		topSourcesList = append(topSourcesList, SourceItem{
			IP:    s.IP,
			Count: s.AttackCount,
			Loc:   s.Country,
		})
	}

	// Get honeypot stats
	var services []model.Service
	h.DB.Find(&services)
	type HoneypotStat struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Type  string `json:"type"`
		Count int    `json:"count"`
	}
	var honeypotStats []HoneypotStat
	for _, s := range services {
		honeypotStats = append(honeypotStats, HoneypotStat{
			ID:    s.ID,
			Name:  s.Name,
			Type:  s.Type,
			Count: s.AttackCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"totalAttacks":     totalAttacks,
		"activeNodes":      activeNodes,
		"totalNodes":       totalNodes,
		"activeServices":   activeServices,
		"totalServices":    totalServices,
		"totalSources":     totalSources,
		"totalScans":       totalScans,
		"totalCredentials": totalCredentials,
		"topSources":       topSourcesList,
		"honeypotStats":    honeypotStats,
		"hackerProfiles":   topSources, // Use top sources as profiles for now
		"trendData": []gin.H{
			{"name": "00:00", "coremail": 400, "esxi": 240, "elastic": 240},
			{"name": "04:00", "coremail": 300, "esxi": 139, "elastic": 221},
			{"name": "08:00", "coremail": 200, "esxi": 980, "elastic": 229},
			{"name": "12:00", "coremail": 278, "esxi": 390, "elastic": 200},
			{"name": "16:00", "coremail": 189, "esxi": 480, "elastic": 218},
			{"name": "20:00", "coremail": 239, "esxi": 380, "elastic": 250},
			{"name": "23:59", "coremail": 349, "esxi": 430, "elastic": 210},
		},
	})
}

func (h *Handler) GetScans(c *gin.Context) {
	var scans []model.ScanLog
	h.DB.Order("start desc").Find(&scans)
	c.JSON(http.StatusOK, scans)
}

func (h *Handler) GetDecoys(c *gin.Context) {
	var decoys []model.DecoyLog
	h.DB.Order("time desc").Find(&decoys)
	c.JSON(http.StatusOK, decoys)
}

func (h *Handler) GetSamples(c *gin.Context) {
	var samples []model.SampleLog
	h.DB.Order("last_time desc").Find(&samples)
	c.JSON(http.StatusOK, samples)
}

func (h *Handler) GetVulnRules(c *gin.Context) {
	var rules []model.VulnRule
	h.DB.Find(&rules)
	c.JSON(http.StatusOK, rules)
}

func (h *Handler) GetSystemStats(c *gin.Context) {
	// Simulate system stats
	now := h.Now()
	history := []gin.H{}
	for i := 0; i < 20; i++ {
		history = append(history, gin.H{
			"time": now.Add(time.Duration(-i*5) * time.Second).Format("15:04:05"),
			"up":   10 + (i % 5),
			"down": 5 + (i % 3),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"cpu":     24,
		"memory":  42,
		"network": gin.H{"up": 12.5, "down": 8.2},
		"history": history,
	})
}

func (h *Handler) IngestAttack(c *gin.Context) {
	var attack model.AttackLog
	if err := c.ShouldBindJSON(&attack); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if attack.Timestamp.IsZero() {
		attack.Timestamp = h.Now()
	}

	// Save to DB
	if err := h.DB.Create(&attack).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save attack"})
		return
	}

	// Broadcast via WebSocket
	h.Hub.BroadcastAttack(attack)

	c.JSON(http.StatusOK, gin.H{"status": "success", "id": attack.ID})
}

func (h *Handler) GetMessages(c *gin.Context) {
	var messages []model.Message
	h.DB.Order("time desc").Find(&messages)
	c.JSON(http.StatusOK, messages)
}

func (h *Handler) MarkAllMessagesRead(c *gin.Context) {
	h.DB.Model(&model.Message{}).Where("read = ?", false).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *Handler) DeleteMessage(c *gin.Context) {
	id := c.Param("id")
	h.DB.Delete(&model.Message{}, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *Handler) GetConfig(c *gin.Context) {
	var configs []model.SystemConfig
	h.DB.Find(&configs)

	configMap := make(map[string]string)
	for _, cfg := range configs {
		configMap[cfg.Key] = cfg.Value
	}

	// 注入登录策略
	policy := h.getLoginPolicy()
	policyJSON, _ := json.Marshal(policy)
	configMap["login_policy"] = string(policyJSON)

	c.JSON(http.StatusOK, configMap)
}

func (h *Handler) UpdateConfig(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	for k, v := range req {
		if k == "login_policy" {
			var policy model.LoginPolicy
			if err := json.Unmarshal([]byte(v), &policy); err == nil {
				policy.ID = 1 // Always use ID 1
				h.DB.Save(&policy)
			}
			continue
		}
		var cfg model.SystemConfig
		h.DB.Where("key = ?", k).First(&cfg)
		if cfg.ID == 0 {
			cfg.Key = k
			cfg.Value = v
			h.DB.Create(&cfg)
		} else {
			h.DB.Model(&cfg).Update("value", v)
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *Handler) GetTemplates(c *gin.Context) {
	var templates []model.Template
	h.DB.Find(&templates)
	c.JSON(http.StatusOK, templates)
}

func (h *Handler) GetServices(c *gin.Context) {
	var services []model.Service
	h.DB.Find(&services)
	c.JSON(http.StatusOK, services)
}

func (h *Handler) GetAttackSources(c *gin.Context) {
	var sources []model.AttackSource
	h.DB.Find(&sources)
	c.JSON(http.StatusOK, sources)
}

func (h *Handler) GetAccountCredentials(c *gin.Context) {
	var creds []model.AccountCredential
	h.DB.Find(&creds)
	c.JSON(http.StatusOK, creds)
}

func (h *Handler) GetTrafficRules(c *gin.Context) {
	var rules []model.TrafficRule
	h.DB.Find(&rules)
	c.JSON(http.StatusOK, rules)
}

func (h *Handler) GetDefenseStrategies(c *gin.Context) {
	var strategies []model.DefenseStrategy
	h.DB.Find(&strategies)
	c.JSON(http.StatusOK, strategies)
}

func (h *Handler) GetAccessControlRules(c *gin.Context) {
	var rules []model.AccessControlRule
	h.DB.Find(&rules)
	c.JSON(http.StatusOK, rules)
}

func (h *Handler) CreateAccessControlRule(c *gin.Context) {
	var rule model.AccessControlRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if rule.ID == "" {
		rule.ID = fmt.Sprintf("AC-%d", time.Now().Unix())
	}
	if rule.AddTime == "" {
		rule.AddTime = time.Now().Format("2006/01/02 15:04:05")
	}
	if rule.Status == "" {
		rule.Status = "active"
	}
	h.DB.Create(&rule)
	c.JSON(http.StatusOK, rule)
}

func (h *Handler) DeleteAccessControlRule(c *gin.Context) {
	id := c.Param("id")
	h.DB.Delete(&model.AccessControlRule{}, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"message": "Rule deleted"})
}

func (h *Handler) SyncAccessRules(c *gin.Context) {
	// Fetch all active rules
	var allRules []model.AccessControlRule
	h.DB.Where("status = ?", "active").Find(&allRules)

	// Filter expired rules
	var rules []model.AccessControlRule
	now := h.Now()
	for _, rule := range allRules {
		if rule.ExpireTime != "" && rule.ExpireTime != "永久" && rule.ExpireTime != "Permanent" {
			// Use ParseInLocation with time.Local to match the base of h.Now()
			expireTime, err := time.ParseInLocation("2006/01/02 15:04:05", rule.ExpireTime, time.Local)
			if err == nil && expireTime.Before(now) {
				// Rule has expired, update its status in DB
				h.DB.Model(&rule).Update("status", "expired")
				continue
			}
		}
		rules = append(rules, rule)
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"type": "SYNC_RULES",
		"data": rules,
	})

	h.Hub.Broadcast(msg)
	c.JSON(http.StatusOK, gin.H{"message": "Sync command broadcasted", "count": len(rules)})
}

func (h *Handler) GetLoginLogs(c *gin.Context) {
	var logs []model.LoginLog
	h.DB.Order("time desc").Find(&logs)
	c.JSON(http.StatusOK, logs)
}

func (h *Handler) GetReports(c *gin.Context) {
	var reports []model.Report
	h.DB.Order("create_time desc").Find(&reports)
	c.JSON(http.StatusOK, reports)
}

func (h *Handler) recordLoginLog(username, ip, status, device string) {
	log := model.LoginLog{
		Username: username,
		IP:       ip,
		Status:   status,
		Device:   device,
		Time:     h.Now().Format("2006-01-02 15:04:05"),
	}
	h.DB.Create(&log)
}

func (h *Handler) GetUsers(c *gin.Context) {
	var users []model.User
	if err := h.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	// Don't return passwords
	for i := range users {
		users[i].Password = ""
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Default role to admin if not provided
	role := req.Role
	if role == "" {
		role = "admin"
	}

	// Decode password from Base64 (Neural Link Decryption)
	decodedPassword, err := base64.StdEncoding.DecodeString(req.Password)
	passwordToHash := req.Password
	if err == nil {
		passwordToHash = string(decodedPassword)
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(passwordToHash), bcrypt.DefaultCost)
	user := model.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Role:     role,
	}

	// Check if username already exists
	var count int64
	h.DB.Model(&model.User{}).Unscoped().Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func (h *Handler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	currentUsername, _ := c.Get("username")

	// Protect self-deletion
	var user model.User
	if err := h.DB.Unscoped().First(&user, id).Error; err == nil {
		if user.Username == currentUsername {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete yourself"})
			return
		}
	}

	// Use Unscoped().Delete to permanently remove the user
	// This prevents "UNIQUE constraint failed" when re-creating the same username
	if err := h.DB.Unscoped().Delete(&model.User{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *Handler) UpdatePassword(c *gin.Context) {
	var req model.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user model.User
	if err := h.DB.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Decode passwords from Base64 (Neural Link Decryption)
	decodedOld, errOld := base64.StdEncoding.DecodeString(req.OldPassword)
	decodedNew, errNew := base64.StdEncoding.DecodeString(req.NewPassword)

	oldPwd := req.OldPassword
	if errOld == nil {
		oldPwd = string(decodedOld)
	}

	newPwd := req.NewPassword
	if errNew == nil {
		newPwd = string(decodedNew)
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPwd)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect old password"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPwd), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	if err := h.DB.Model(&user).Update("password", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Password updated successfully"})
}

func (h *Handler) NtpSync(c *gin.Context) {
	var cfg model.SystemConfig
	// Use Find instead of First to avoid "record not found" error log when config doesn't exist
	h.DB.Where("key = ?", "ntp_config").Find(&cfg)

	var ntpCfg struct {
		Server string `json:"server"`
	}
	if cfg.Value != "" {
		json.Unmarshal([]byte(cfg.Value), &ntpCfg)
	} else {
		ntpCfg.Server = "pool.ntp.org"
	}

	// Perform real NTP sync
	response, err := ntp.Query(ntpCfg.Server)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to sync with NTP server: " + err.Error(),
		})
		return
	}

	err = response.Validate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "NTP response validation failed: " + err.Error(),
		})
		return
	}

	// Update global time offset
	atomic.StoreInt64(&globalTimeOffset, int64(response.ClockOffset))

	// Persist to DB
	var timeCfg model.SystemConfig
	h.DB.Where("key = ?", "time_offset").First(&timeCfg)
	timeCfg.Key = "time_offset"
	timeCfg.Value = fmt.Sprintf("%d", int64(response.ClockOffset))
	h.DB.Save(&timeCfg)

	remoteTime := h.Now()

	var syncTimeCfg model.SystemConfig
	h.DB.Where("key = ?", "last_sync_time").First(&syncTimeCfg)
	syncTimeCfg.Key = "last_sync_time"
	syncTimeCfg.Value = remoteTime.Format(time.RFC3339)
	h.DB.Save(&syncTimeCfg)

	c.JSON(http.StatusOK, gin.H{
		"status":     "success",
		"offset":     response.ClockOffset.Seconds(),
		"remoteTime": remoteTime.Format(time.RFC3339),
		"stratum":    response.Stratum,
		"precision":  response.Precision,
		"rootDelay":  response.RootDelay.Seconds(),
		"rootDisp":   response.RootDispersion.Seconds(),
		"leap":       response.Leap,
	})
}

func (h *Handler) HandleWebSocketMessage(msg []byte, client *websocket.Client) {
	var message struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(msg, &message); err != nil {
		return
	}

	if message.Type == "NODE_REPORT" || message.Type == "SYNC_COMPLETE" {
		var nodeStatus model.NodeStatus
		if err := json.Unmarshal(message.Data, &nodeStatus); err != nil {
			return
		}

		// Ensure status is online when reporting
		nodeStatus.Status = "online"

		// Bind NodeID to client for tracking
		h.Hub.BindNode(nodeStatus.ID, client)

		// Update DB
		var existing model.NodeStatus
		var previousStatus string
		if err := h.DB.Where("id = ?", nodeStatus.ID).First(&existing).Error; err != nil {
			h.DB.Create(&nodeStatus)
			previousStatus = "" // New node
		} else {
			previousStatus = existing.Status // Capture status BEFORE update
			// Use a map to ensure all fields are updated, including those that might be zero-valued
			updates := map[string]interface{}{
				"name":            nodeStatus.Name,
				"status":          "online",
				"load":            nodeStatus.Load,
				"memory_usage":    nodeStatus.MemoryUsage,
				"memory_total":    nodeStatus.MemoryTotal,
				"temperature":     nodeStatus.Temperature,
				"net_up":          nodeStatus.NetUp,
				"net_down":        nodeStatus.NetDown,
				"ip":              nodeStatus.IP,
				"os":              nodeStatus.OS,
				"template":        nodeStatus.Template,
				"traffic_history": nodeStatus.TrafficHistory,
				"uptime":          nodeStatus.Uptime,
				"version":         nodeStatus.Version,
				"interface":       nodeStatus.Interface,
				"mac":             nodeStatus.MAC,
				"firewall_status": nodeStatus.FirewallStatus,
				"firewall_error":  nodeStatus.FirewallError,
				"firewall_info":   nodeStatus.FirewallInfo,
			}
			h.DB.Model(&existing).Updates(updates)
			// Refresh existing object from DB to get the latest state
			h.DB.First(&nodeStatus, "id = ?", nodeStatus.ID)
		}

		// Broadcast to frontend
		// If it's a SYNC_COMPLETE message from probe, broadcast it as NODE_SYNC_COMPLETE to frontend
		broadcastType := "NODE_UPDATE"
		if message.Type == "SYNC_COMPLETE" {
			broadcastType = "NODE_SYNC_COMPLETE"
		}

		broadcastMsg, _ := json.Marshal(map[string]interface{}{
			"type": broadcastType,
			"data": nodeStatus,
		})
		log.Printf("Broadcasting %s for %s (Status: %s)", broadcastType, nodeStatus.ID, nodeStatus.Status)
		h.Hub.Broadcast(broadcastMsg)

		// Create system message for online status if it was offline or new
		if previousStatus == "" || previousStatus != "online" {
			msgID := fmt.Sprintf("msg-%d", time.Now().UnixNano())
			sysMsg := model.Message{
				ID:      msgID,
				Title:   "msg_node_online_title",
				Content: fmt.Sprintf("msg_node_online_content|name:%s,id:%s", nodeStatus.Name, nodeStatus.ID),
				Time:    h.Now(),
				Type:    "system",
				Read:    false,
			}
			h.DB.Create(&sysMsg)

			// Broadcast message to frontend
			msgNotify, _ := json.Marshal(map[string]interface{}{
				"type": "NEW_MESSAGE",
				"data": sysMsg,
			})
			h.Hub.Broadcast(msgNotify)
		}
	}
}

func (h *Handler) HandleWebSocketDisconnect(client *websocket.Client) {
	if client.NodeID == "" {
		return
	}

	log.Printf("Node disconnected: %s", client.NodeID)

	// Update status in DB
	h.DB.Model(&model.NodeStatus{}).Where("id = ?", client.NodeID).Update("status", "offline")

	// Broadcast update to frontend
	var node model.NodeStatus
	if err := h.DB.Where("id = ?", client.NodeID).First(&node).Error; err == nil {
		broadcastMsg, _ := json.Marshal(map[string]interface{}{
			"type": "NODE_UPDATE",
			"data": node,
		})
		h.Hub.Broadcast(broadcastMsg)

		// Create system message for offline status
		msgID := fmt.Sprintf("msg-%d", time.Now().UnixNano())
		sysMsg := model.Message{
			ID:      msgID,
			Title:   "msg_node_offline_title",
			Content: fmt.Sprintf("msg_node_offline_content|name:%s,id:%s", node.Name, node.ID),
			Time:    h.Now(),
			Type:    "security",
			Read:    false,
		}
		h.DB.Create(&sysMsg)

		// Broadcast message to frontend
		msgNotify, _ := json.Marshal(map[string]interface{}{
			"type": "NEW_MESSAGE",
			"data": sysMsg,
		})
		h.Hub.Broadcast(msgNotify)
	}
}

func (h *Handler) HandleNodeCommand(c *gin.Context) {
	var req struct {
		NodeID  string `json:"nodeId"`
		Command string `json:"command"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"type": "COMMAND",
		"data": req.Command,
	})

	if h.Hub.SendToNode(req.NodeID, msg) {
		// If command is ENABLE_FIREWALL, automatically trigger a sync for this node
		// to restore the rules immediately.
		if req.Command == "ENABLE_FIREWALL" {
			go func() {
				// Small delay to ensure probe has processed the ENABLE command
				time.Sleep(500 * time.Millisecond)
				h.syncRulesToNode(req.NodeID)
			}()
		}
		c.JSON(http.StatusOK, gin.H{"status": "command sent"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "node not connected"})
	}
}

func (h *Handler) syncRulesToNode(nodeID string) {
	var allRules []model.AccessControlRule
	h.DB.Where("status = ?", "active").Find(&allRules)

	var rules []model.AccessControlRule
	now := h.Now()
	for _, rule := range allRules {
		if rule.ExpireTime != "" && rule.ExpireTime != "永久" && rule.ExpireTime != "Permanent" {
			expireTime, err := time.Parse("2006/01/02 15:04:05", rule.ExpireTime)
			if err == nil && expireTime.Before(now) {
				h.DB.Model(&rule).Update("status", "expired")
				continue
			}
		}
		rules = append(rules, rule)
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"type": "SYNC_RULES",
		"data": rules,
	})

	h.Hub.SendToNode(nodeID, msg)
}

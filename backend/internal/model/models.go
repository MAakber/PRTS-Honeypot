package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Username  string         `gorm:"uniqueIndex;not null" json:"username"`
	Password  string         `gorm:"not null" json:"-"`
	Role      string         `gorm:"default:'user'" json:"role"`
}

type AttackLog struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Timestamp time.Time `json:"timestamp"`
	SourceIP  string    `json:"sourceIp"`
	Location  string    `json:"location"`
	Method    string    `json:"method"`
	Payload   string    `json:"payload"`
	Severity  string    `json:"severity"` // low, medium, high, critical
	Status    string    `json:"status"`   // blocked, monitored, compromised
}

type AttackSource struct {
	ID          string `json:"id" gorm:"primaryKey"`
	IP          string `json:"ip"`
	Country     string `json:"country"`
	Verdict     string `json:"verdict"` // unknown, low, medium, high
	AttackCount int    `json:"attackCount"`
	ScanCount   int    `json:"scanCount"`
	Nodes       string `json:"nodes"`     // Store as comma-separated or JSON
	FirstTime   string `json:"firstTime"` // Format: 2025/11/23 23:19:27
	Tags        string `json:"tags"`      // Store as comma-separated or JSON
}

type AccountCredential struct {
	ID       string `json:"id" gorm:"primaryKey"`
	Username string `json:"username"`
	Password string `json:"password"`
	Service  string `json:"service"`
	Count    int    `json:"count"`
	IP       string `json:"ip"`
	Time     string `json:"time"`
}

type NodeStatus struct {
	ID             string  `json:"id" gorm:"primaryKey"`
	Name           string  `json:"name"`
	Region         string  `json:"region"`
	Status         string  `json:"status"` // online, offline
	Load           int     `json:"load"`
	MemoryUsage    int     `json:"memoryUsage"`
	MemoryTotal    uint64  `json:"memoryTotal"`
	Temperature    float64 `json:"temperature"`
	NetUp          float64 `json:"netUp"`
	NetDown        float64 `json:"netDown"`
	IP             string  `json:"ip"`
	OS             string  `json:"os"`
	Template       string  `json:"template"`
	TrafficHistory string  `json:"trafficHistory"` // Store as JSON string for simplicity in SQLite
	Uptime         string  `json:"uptime"`
	Version        string  `json:"version"`
	Interface      string  `json:"interface"`
	MAC            string  `json:"mac"`
	FirewallStatus string  `json:"firewallStatus"` // active, inactive, error
	FirewallError  string  `json:"firewallError"`
	FirewallInfo   string  `json:"firewallInfo"`
}

type Message struct {
	ID      string    `json:"id" gorm:"primaryKey"`
	Title   string    `json:"title"`
	Content string    `json:"content"`
	Time    time.Time `json:"time"`
	Type    string    `json:"type"` // system, security, report
	Read    bool      `json:"read"`
}

type SystemConfig struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Key         string `gorm:"uniqueIndex" json:"key"`
	Value       string `json:"value" json:"value"`
	Description string `json:"description" json:"description"`
}

type Template struct {
	ID          string `json:"id" gorm:"primaryKey"`
	Name        string `json:"name"`
	Type        string `json:"type"` // web, database, ssh, etc.
	Description string `json:"description"`
	Config      string `json:"config"` // JSON string
}

type ModuleStatus struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	Name    string `gorm:"uniqueIndex" json:"name"`
	Enabled bool   `json:"enabled"`
}

type Service struct {
	ID               string `json:"id" gorm:"primaryKey"`
	Name             string `json:"name"`
	Category         string `json:"category"`
	InteractionType  string `json:"interactionType"` // low, high
	RefTemplateCount int    `json:"refTemplateCount"`
	RefNodeCount     int    `json:"refNodeCount"`
	DefaultPort      string `json:"defaultPort"`
	Description      string `json:"description"`
	IsCloud          bool   `json:"isCloud"`
	Type             string `json:"type"`  // tcp, redis, esxi, etc.
	AttackCount      int    `json:"count"` // Match frontend 'count' field
	Status           string `json:"status" gorm:"default:'running'"`
}

type LoginPolicy struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	MaxRetry  int    `json:"maxRetry"`
	Lockout   int    `json:"lockout"`
	Session   int    `json:"session"`
	URL       string `json:"url"`
	Whitelist string `json:"whitelist"`
}

type LoginAttempt struct {
	ID          uint   `gorm:"primaryKey"`
	IP          string `gorm:"index"`
	Username    string `gorm:"index"`
	Attempts    int    `gorm:"default:0"`
	LastTime    time.Time
	LockedUntil time.Time
}

type ScanLog struct {
	ID       string `json:"id" gorm:"primaryKey"`
	IP       string `json:"ip"`
	Threat   string `json:"threat"` // Malicious, High Risk, Suspicious, Low
	Node     string `json:"node"`
	Location string `json:"location"`
	Type     string `json:"type"` // TCP, UDP, ICMP, etc.
	Count    int    `json:"count"`
	Ports    string `json:"ports"`
	Start    string `json:"start"`
	Duration string `json:"duration"`
}

type DecoyLog struct {
	ID         string `json:"id" gorm:"primaryKey"`
	Type       string `json:"type"`
	Status     string `json:"status"`
	Device     string `json:"device"`
	SourceIP   string `json:"sourceIp"`
	Time       string `json:"time"`
	Result     string `json:"result"`
	DecoyName  string `json:"decoyName"`
	DeployTime string `json:"deployTime"`
	Node       string `json:"node"`
}

type SampleLog struct {
	ID           string `json:"id" gorm:"primaryKey"`
	FileName     string `json:"fileName"`
	FileSize     string `json:"fileSize"`
	FileType     string `json:"fileType"`
	ThreatLevel  string `json:"threatLevel"` // malicious, suspicious, safe, unknown
	Status       string `json:"status"`      // completed, analyzing, queued
	CaptureCount int    `json:"captureCount"`
	LastTime     string `json:"lastTime"`
	AttackerIP   string `json:"attackerIp"`
	SourceNode   string `json:"sourceNode"`
	SHA256       string `json:"sha256"`
}

type VulnRule struct {
	ID          string `json:"id" gorm:"primaryKey"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Severity    string `json:"severity"` // low, medium, high
	HitCount    int    `json:"hitCount"`
	LastHitTime string `json:"lastHitTime"`
	Creator     string `json:"creator"`
	Status      string `json:"status"` // active, inactive
	UpdateTime  string `json:"updateTime"`
	Updater     string `json:"updater"`
}

type TrafficRule struct {
	ID       string `json:"id" gorm:"primaryKey"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Pattern  string `json:"pattern"`
	Status   string `json:"status"` // active, inactive
	Hits     int    `json:"hits"`
}
type DefenseStrategy struct {
	ID          string `json:"id" gorm:"primaryKey"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Trigger     string `json:"trigger"`
	Action      string `json:"action"`
	Status      string `json:"status"`
	HitCount    int    `json:"hitCount"`
}

type AccessControlRule struct {
	ID         string `json:"id" gorm:"primaryKey"`
	IP         string `json:"ip"`
	Type       string `json:"type"` // blacklist, whitelist
	Reason     string `json:"reason"`
	Source     string `json:"source"`
	ExpireTime string `json:"expireTime"`
	AddTime    string `json:"addTime"`
	Status     string `json:"status"`
}

type LoginLog struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Username string `json:"username"`
	Time     string `json:"time"`
	IP       string `json:"ip"`
	Status   string `json:"status"` // success, failure
	Device   string `json:"device"`
}

type Report struct {
	ID         string `json:"id" gorm:"primaryKey"`
	Name       string `json:"name"`
	Module     string `json:"module"`
	Type       string `json:"type"` // daily, weekly, custom
	Size       string `json:"size"`
	Status     string `json:"status"` // success, generating, failed
	Creator    string `json:"creator"`
	CreateTime string `json:"createTime"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

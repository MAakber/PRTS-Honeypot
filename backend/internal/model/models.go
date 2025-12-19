package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	Role     string `gorm:"default:'user'" json:"role"`
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

type NodeStatus struct {
	ID             string    `json:"id" gorm:"primaryKey"`
	Name           string    `json:"name"`
	Region         string    `json:"region"`
	Status         string    `json:"status"` // online, offline, warning
	Load           int       `json:"load"`
	IP             string    `json:"ip"`
	OS             string    `json:"os"`
	Template       string    `json:"template"`
	TrafficHistory string    `json:"trafficHistory"` // Store as JSON string for simplicity in SQLite
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

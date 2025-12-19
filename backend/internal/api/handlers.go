package api

import (
	"net/http"
	"time"

	"backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var JwtSecret = []byte("PRTS_SYSTEM_SECRET_KEY_2025")

type Handler struct {
	DB *gorm.DB
}

func (h *Handler) LoginHandler(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user model.User
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		// For demo purposes, if user doesn't exist and it's admin, create it
		if req.Username == "admin" && req.Password == "prts123456" {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			user = model.User{
				Username: req.Username,
				Password: string(hashedPassword),
				Role:     "admin",
			}
			h.DB.Create(&user)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
			return
		}
	} else {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
			return
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
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
	// Mock stats for now
	c.JSON(http.StatusOK, gin.H{
		"totalAttacks": 12543,
		"activeNodes":  42,
		"threatLevel":  "Elevated",
		"todayAttacks": 842,
	})
}

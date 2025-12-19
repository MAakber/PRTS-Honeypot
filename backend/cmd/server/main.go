package main

import (
	"log"

	"backend/internal/api"
	"backend/internal/middleware"
	"backend/internal/model"
	"github.com/gin-gonic/gin"
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
	db.AutoMigrate(&model.User{}, &model.AttackLog{}, &model.NodeStatus{})

	h := &api.Handler{DB: db}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/login", h.LoginHandler)
		
		// Protected routes
		protected := v1.Group("/")
		protected.Use(middleware.AuthRequired(string(api.JwtSecret)))
		{
			protected.GET("/attacks", h.GetAttacks)
			protected.GET("/nodes", h.GetNodes)
			protected.GET("/stats/dashboard", h.GetDashboardStats)
		}
	}

	log.Println("PRTS Backend starting on :8080...")
	r.Run(":8080")
}

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type AttackLog struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	SourceIP  string    `json:"sourceIp"`
	Location  string    `json:"location"`
	Method    string    `json:"method"`
	Payload   string    `json:"payload"`
	Severity  string    `json:"severity"`
	Status    string    `json:"status"`
}

var methods = []string{"SSH", "HTTP", "SMB", "RDP", "FTP"}
var locations = []string{"Shanghai, CN", "Moscow, RU", "California, US", "London, UK", "Tokyo, JP"}
var severities = []string{"low", "medium", "high", "critical"}

func main() {
	rand.Seed(time.Now().UnixNano())
	url := "http://localhost:8080/api/v1/ingest"

	fmt.Println("PRTS Attack Simulator Started...")
	fmt.Printf("Target: %s\n", url)

	for {
		attack := AttackLog{
			ID:        fmt.Sprintf("SIM-%d", rand.Intn(9999)),
			Timestamp: time.Now(),
			SourceIP:  fmt.Sprintf("%d.%d.%d.%d", rand.Intn(255), rand.Intn(255), rand.Intn(255), rand.Intn(255)),
			Location:  locations[rand.Intn(len(locations))],
			Method:    methods[rand.Intn(len(methods))],
			Payload:   "Simulated attack payload for testing PRTS WebSocket",
			Severity:  severities[rand.Intn(len(severities))],
			Status:    "monitored",
		}

		jsonData, _ := json.Marshal(attack)
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))

		if err != nil {
			fmt.Printf("Error sending attack: %v\n", err)
		} else {
			fmt.Printf("Sent attack: %s from %s [%s]\n", attack.ID, attack.SourceIP, attack.Method)
			resp.Body.Close()
		}

		time.Sleep(time.Duration(rand.Intn(5)+2) * time.Second)
	}
}

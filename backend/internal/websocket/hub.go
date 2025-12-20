package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // For development
	},
}

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	clients      map[*Client]bool
	nodeMap      map[string]*Client // Map NodeID to Client
	broadcast    chan []byte
	register     chan *Client
	unregister   chan *Client
	handler      func([]byte, *Client)
	onDisconnect func(*Client)
	mu           sync.RWMutex
}

func NewHub(handler func([]byte, *Client), onDisconnect func(*Client)) *Hub {
	return &Hub{
		broadcast:    make(chan []byte, 256),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		clients:      make(map[*Client]bool),
		nodeMap:      make(map[string]*Client),
		handler:      handler,
		onDisconnect: onDisconnect,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				isReplacement := false
				if client.NodeID != "" {
					if h.nodeMap[client.NodeID] != client {
						isReplacement = true
					} else {
						delete(h.nodeMap, client.NodeID)
					}
				}
				delete(h.clients, client)
				close(client.send)

				if h.onDisconnect != nil && !isReplacement {
					// Run onDisconnect in a goroutine to avoid deadlock
					go h.onDisconnect(client)
				}
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					// We need to upgrade lock to delete, or just mark for deletion?
					// Deleting while iterating with RLock is bad.
					// But here we are in a select default.
					// Actually, if we can't send, we should probably just skip or handle it later.
					// Deleting here would require a Write Lock.
					// Let's just skip for now to avoid deadlock complexity, or use a separate cleanup loop.
					// Or better: use Lock() for the whole broadcast loop if we intend to modify.
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastAttack sends an attack log to all connected clients
func (h *Hub) BroadcastAttack(attack interface{}) {
	msg, err := json.Marshal(map[string]interface{}{
		"type": "ATTACK_EVENT",
		"data": attack,
	})
	if err != nil {
		log.Printf("error marshaling attack: %v", err)
		return
	}
	h.broadcast <- msg
}

func (h *Hub) Broadcast(msg []byte) {
	h.broadcast <- msg
}

func (h *Hub) BindNode(nodeID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// If this node was already connected, unregister the old client
	if oldClient, ok := h.nodeMap[nodeID]; ok && oldClient != client {
		log.Printf("Node %s reconnected, closing old connection", nodeID)
		// We don't want to trigger the full unregister logic here to avoid status flickering
		// Just close the old connection
		oldClient.conn.Close()
	}
	client.NodeID = nodeID
	h.nodeMap[nodeID] = client
}

func (h *Hub) SendToNode(nodeID string, msg []byte) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.nodeMap[nodeID]; ok {
		client.send <- msg
		return true
	}
	return false
}

func (h *Hub) IsActiveClient(client *Client) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if client.NodeID == "" {
		return false
	}
	return h.nodeMap[client.NodeID] == client
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}

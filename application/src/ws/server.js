import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = process.env.WS_PORT || 4001;

const server = http.createServer((req, res) => {
  // Add CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const msg = JSON.parse(body);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        console.log("[ws] broadcasted:", msg.type);
      } catch (err) {
        res.writeHead(400);
        res.end("invalid json");
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("local ws server ok");
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  const id = Math.random().toString(36).slice(2, 9);
  console.log(`[ws] client connected (${id})`);
  socket.send(JSON.stringify({ type: "WS_CONNECTED", payload: { id } }));

  socket.on("close", () => {
    console.log(`[ws] client disconnected (${id})`);
  });

  socket.on("message", (message) => {
    console.log(`[ws] received from client (${id}):`, message.toString());
  });
});

server.listen(PORT, () => {
  console.log(`[ws] server listening on http://localhost:${PORT}`);
});

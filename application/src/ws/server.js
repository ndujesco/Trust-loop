/**
 * src/ws/server.js
 *
 * Local mock WebSocket server + small HTTP /broadcast endpoint.
 * - Run with: npm run ws
 * - Broadcast format: { type: 'NEW_SUBMISSION', payload: {...} }
 *
 * NOTE: This is a local dev/mock server. Replace with production pub/sub in real deployments.
 */

const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.WS_PORT || 4001;
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const msg = JSON.parse(body);
        // Broadcast to all connected WS clients
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

  // basic health endpoint
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("local ws server ok");
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (socket, req) => {
  const id = Math.random().toString(36).slice(2, 9);
  console.log(`[ws] client connected (${id})`);
  socket.send(JSON.stringify({ type: "WS_CONNECTED", payload: { id } }));

  socket.on("close", () => {
    console.log(`[ws] client disconnected (${id})`);
  });

  socket.on("message", (message) => {
    // For debugging if browser client sends anything
    console.log(`[ws] received from client (${id}):`, message.toString());
  });
});

server.listen(PORT, () => {
  console.log(`[ws] server listening on http://localhost:${PORT}`);
});

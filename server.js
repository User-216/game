const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 2222 });

let players = {};

wss.on('connection', function connection(ws) {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { x: 0, y: 0, state: 'idle', palette: 1 };
  
  ws.send(JSON.stringify({ type: 'init', id: id }));
  
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        players[id] = { ...players[id], ...data.payload };
        
        // Broadcast to everyone else
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', id: id, payload: players[id] }));
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    delete players[id];
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'remove', id: id }));
      }
    });
  });
});

console.log("Online Multiplayer Server running on port 2222...");

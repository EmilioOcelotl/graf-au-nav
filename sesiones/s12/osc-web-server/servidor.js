const osc = require("osc");
const WebSocket = require("ws");

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// OSC UDP server en 57121
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 57121
});

udpPort.on("message", (oscMsg) => {
  const payload = JSON.stringify(oscMsg);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
});

udpPort.open();
console.log("Servidor listo: OSC 57121 → WS 8080");

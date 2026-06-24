const { io } = require("./node_modules/socket.io-client");
const origin = "https://mouse-contain-physical-drinks.trycloudflare.com";
console.log("Testing:", origin);

// Step 1: HTTP
const https = require("https");
https.get(origin + "/api/players", (r) => {
  let d = ""; r.on("data", c => d+=c); r.on("end", () => console.log("HTTP OK:", d.substring(0,60)));
}).on("error", e => console.log("HTTP Error:", e.message));

// Step 2: Socket.IO with polling only
const sock = io(origin, { transports: ["polling"], upgrade: false, timeout: 12000 });
sock.on("connect", () => {
  console.log("Socket connected:", sock.id);
  sock.emit("player:join", { nickname: "DiagTest", village: "TestVillage" }, (res) => {
    console.log("Join result:", JSON.stringify(res));
    sock.disconnect();
    process.exit(0);
  });
});
sock.on("connect_error", (e) => { console.log("connect_error:", e.message); });
setTimeout(() => { console.log("Final status - connected:", sock.connected); process.exit(0); }, 14000);

const login = require('fca-project-origen'); // Or 'fb-chat-api'
const fs = require('fs');
const config = require('./config.json');

// Read AppState
let appState;
try {
  appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
} catch (err) {
  console.error("Error loading appstate.json. Ensure the file exists and contains valid JSON.");
  process.exit(1);
}

// Start Session
login({ appState }, (err, api) => {
  if (err) return console.error("Login failed:", err);

  // Configure listener options
  api.setOptions({
    listenEvents: true,
    selfListen: false,
    logLevel: "silent"
  });

  console.log("Bot successfully logged in!");

  // Listen for incoming messages
  api.listenMqtt((err, event) => {
    if (err) return console.error("Listener error:", err);

    if (event.type === "message" || event.type === "message_reply") {
      const message = event.body ? event.body.trim() : "";
      const senderID = event.senderID;

      // Check for command prefix
      if (!message.startsWith(config.prefix)) return;

      const args = message.slice(config.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      // --- OWNER PROTECTION CHECK ---
      if (senderID !== config.ownerID) {
        api.sendMessage(" Access Denied: You are not authorized to use this bot.", event.threadID, event.messageID);
        return;
      }

      // --- COMMAND HANDLERS ---
      switch (command) {
        case "ping":
          api.sendMessage("Pong! Bot is active.", event.threadID, event.messageID);
          break;

        case "say":
          const textToSay = args.join(" ");
          if (!textToSay) {
            api.sendMessage("Please provide text to say.", event.threadID, event.messageID);
          } else {
            api.sendMessage(textToSay, event.threadID);
          }
          break;

        case "help":
          api.sendMessage("Available Owner Commands:\n!ping - Check bot response\n!say <text> - Make bot repeat text", event.threadID, event.messageID);
          break;

        default:
          api.sendMessage(`Unknown command: ${command}`, event.threadID, event.messageID);
          break;
      }
    }
  });
});

# Chat App 2 WebSocket Relay

The browser client no longer uses PeerJS for chat/file connections. It uses one persistent WebSocket connection to this relay.

## Run

```bash
npm install
npm start
```

The server listens on `PORT` or port 8787.

Set the browser client's relay URL to:

`ws://localhost:8787`

For a public HTTPS site, use a secure WebSocket URL such as `wss://your-server.example`.

The relay only keeps connections and forwards messages. Chat history remains in the browser's local storage.

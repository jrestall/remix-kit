import type { ViteNodeServer } from 'vite-node/server';
import { WebSocketServer, WebSocket } from 'ws';

export interface RemixWebSocketServer {
  wss: WebSocketServer;
  handleUpdates: (invalidates: Set<string>) => void;
}

export function createWebSocketServer(
  node: ViteNodeServer,
  serverEntryPoint: string
): RemixWebSocketServer {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', async (ws, _request) => {
    ws.on('message', (message) => {
      console.log(message);
    });
  });

  function handleUpdates(invalidates: Set<string>) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'invalidates', invalidates: [...invalidates] }));
      }
    });
  }

  return {
    wss,
    handleUpdates,
  };
}

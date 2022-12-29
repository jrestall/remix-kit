import { getPort } from 'get-port-please';
import { WebSocketServer, WebSocket } from 'ws';

export interface RemixWebSocketServer {
  wss: WebSocketServer;
  handleUpdates: (invalidates: Set<string>) => void;
  port: number;
}

export async function createWebSocketServer(): Promise<RemixWebSocketServer> {
  const serverPortDefault = 24688;
  const serverPort = await getPort({
    port: serverPortDefault,
    ports: Array.from({ length: 20 }, (_, i) => serverPortDefault + 1 + i),
  });
  
  const wss = new WebSocketServer({ port: serverPort });

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
    port: serverPort
  };
}

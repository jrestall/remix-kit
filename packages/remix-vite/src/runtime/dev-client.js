const WebSocket = require('ws');

class DevClient {
  runner;
  onInvalidate;
  constructor(runner, onInvalidate) {
    this.runner = runner;
    this.onInvalidate = onInvalidate;
  }

  async connect(port) {
    try {
      this.createWebSocketServer(`localhost:${port}`);
    } catch (err) {
      console.log(err);
    }
  }

  async createWebSocketServer(host) {
    let socket = new WebSocket(`ws://${host}`);

    const devClient = this;
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      if (message.type === 'invalidates') {
        const start = Date.now();
        const invalidated = new Set();
        const removed = devClient.runner.moduleCache.invalidateDepTree(
          message.invalidates,
          invalidated
        );
        devClient.runner.executeId('\0@remix-run/dev/server-build').then((build) => {
          if (devClient.onInvalidate) devClient.onInvalidate(build);
          const time = Date.now() - start;
          console.log(`Dev server hmr ${removed.size} file(s)`, time ? `in ${time}ms` : '');
        });
      }
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log(
          `[close] Dev server websocket connection closed cleanly, code=${event.code} reason=${event.reason}`
        );
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Dev server websocket connection died');
      }
    };

    socket.onerror = function (error) {
      console.error(`[error] ${error.message}`);
    };
  }
}

exports.DevClient = DevClient;

const WebSocket = require('ws');

class DevClient {
  runner;
  serverBuild;
  constructor(runner, serverBuild) {
    this.runner = runner;
    this.serverBuild = serverBuild;
  }

  async connect() {
    try {
      this.createWebSocketServer('localhost:8080');
    } catch (err) {
      console.log(err);
    }
  }

  async createWebSocketServer(host) {
    let socket = new WebSocket(`ws://${host}`);

    socket.onopen = function (e) {
      console.log('[open] Connection established');
    };

    const that = this;
    socket.onmessage = function (event) {
      console.log(`[message] Data received from server: ${event.data}`);
      const message = JSON.parse(event.data);
      if (message.type === 'invalidates') {
        const start = Date.now();
        const invalidated = new Set();
        const removed = that.runner.moduleCache.invalidateDepTree(message.invalidates, invalidated);
        console.log('invalidated: ' + message.invalidates);
        console.log(invalidated);
        that.runner.executeId('\0@remix-run/dev/server-build').then((build) => {
          Object.assign(that.serverBuild, build);
          const time = Date.now() - start;
          console.log(`Vite server hmr ${removed.size} file(s)`, time ? `in ${time}ms` : '');
        });
      }
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
      }
    };

    socket.onerror = function (error) {
      console.error(`[error] ${error.message}`);
    };
  }
}

exports.DevClient = DevClient;

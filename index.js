const uWebSocket = require('uWebSockets.js');

const server = uWebSocket.App()
server.any('/*', (res, req) => {
  res.writeStatus('200 OK')
    .writeHeader('IsExample', 'Yes')
    .end('Hello there!');
});

server.listen(process.env.PORT || 3000, '0.0.0.0', (token) => {
  if (token) {
    console.log('token on port ', token);
  }
});

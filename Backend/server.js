const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;

const server = http.createServer(app);

const { setupSocket } = require('./socket');
const io = setupSocket(server);

// Make socket.io instance available to app (for REST controllers)
app.set('io', io);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
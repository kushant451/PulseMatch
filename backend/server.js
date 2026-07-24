require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const { setIO } = require('./config/socket');
const createApp = require('./app');

// Connect to MongoDB Atlas
connectDB();

// Connect to Redis (non-blocking — app still works without it, just uncached)
connectRedis();

const app = createApp();

// Wrap Express in a plain HTTP server so Socket.io can share the same port
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Admin dashboard joins this room to receive live stock/request updates
  socket.on('join:admin', () => {
    socket.join('admin-room');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Make the io instance available to controllers via config/socket.js
setIO(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const { setupSocket } = require('./sockets/socket');
const notificationService = require('./modules/notifications/notification.service');
const cronService = require('./utils/cron.service');
const corsOptions = require('./config/cors');

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ───────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Make io accessible in app
app.set('io', io);

// Initialize socket
setupSocket(io);

// Give notificationService access to io
notificationService.setIo(io);

// ─── Connect DB & Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  
  // Start cron jobs
  cronService.init();

  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   Task Management System - Server Running     ║
║   Port: ${PORT}                                  ║
║   Mode: ${process.env.NODE_ENV || 'development'}                          ║
║   API:  http://localhost:${PORT}/api/v1          ║
╚═══════════════════════════════════════════════╝
    `);
  });
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed gracefully');
    process.exit(0);
  });
});

startServer();

const { verifyAccessToken } = require('../utils/helpers');
const User = require('../modules/users/user.model');

// Map: userId -> Set of socket IDs
const userSockets = new Map();

const setupSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${socket.id} (User: ${userId})`);

    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join project rooms
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${userId} joined project room: ${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Join task room
    socket.on('join:task', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leave:task', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    // Typing indicator for comments
    socket.on('typing:start', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('typing:update', {
        userId,
        userName: socket.userName,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('typing:update', {
        userId,
        userName: socket.userName,
        isTyping: false,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });
};

/**
 * Emit notification to specific user
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId.toString()}`).emit(event, data);
};

/**
 * Emit to all users in a project
 */
const emitToProject = (io, projectId, event, data) => {
  io.to(`project:${projectId.toString()}`).emit(event, data);
};

/**
 * Emit to task room
 */
const emitToTask = (io, taskId, event, data) => {
  io.to(`task:${taskId.toString()}`).emit(event, data);
};

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  const sockets = userSockets.get(userId.toString());
  return sockets && sockets.size > 0;
};

module.exports = { setupSocket, emitToUser, emitToProject, emitToTask, isUserOnline };

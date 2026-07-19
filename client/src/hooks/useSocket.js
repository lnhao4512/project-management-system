import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { SOCKET_URL } from '../constants';
import { addNotification } from '../redux/slices/notificationsSlice';
import { updateTaskInList, addTaskToList } from '../redux/slices/tasksSlice';
import toast from 'react-hot-toast';

let socketInstance = null;

export const useSocket = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Create socket connection
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Notification events
    socket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
      toast.success(`${notification.title}: ${notification.message}`, {
        duration: 5000,
      });
    });

    // Task events
    socket.on('task:created', (task) => {
      dispatch(addTaskToList(task));
    });

    socket.on('task:updated', (task) => {
      dispatch(updateTaskInList(task));
    });

    socket.on('task:status_changed', (task) => {
      dispatch(updateTaskInList(task));
    });

    return () => {
      socket.off('notification:new');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:status_changed');
    };
  }, [isAuthenticated, token, dispatch]);

  const joinProject = (projectId) => {
    socketRef.current?.emit('join:project', projectId);
  };

  const leaveProject = (projectId) => {
    socketRef.current?.emit('leave:project', projectId);
  };

  const joinTask = (taskId) => {
    socketRef.current?.emit('join:task', taskId);
  };

  const leaveTask = (taskId) => {
    socketRef.current?.emit('leave:task', taskId);
  };

  return { socket: socketRef.current, joinProject, leaveProject, joinTask, leaveTask };
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

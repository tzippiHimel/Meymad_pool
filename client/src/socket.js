import { io } from "socket.io-client";

// Dynamic URL based on environment
const getSocketUrl = () => {
  // תמיד נתחבר לשרת ב-Render
  return 'https://meymad-pool.onrender.com';
};

const socketUrl = getSocketUrl();
console.log('Socket connecting to:', socketUrl);

const socket = io(socketUrl, { 
  withCredentials: true,
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket;
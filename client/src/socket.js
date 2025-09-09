import { io } from "socket.io-client";

// Dynamic URL based on environment
const getSocketUrl = () => {
  // If we're in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // If we're in production, use the current domain with socket.io path
  return window.location.origin;
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
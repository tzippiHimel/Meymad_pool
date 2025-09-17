import { io } from "socket.io-client";

// Dynamic URL based on environment
// const getSocketUrl = () => {
//   // Always connect directly to Render server for Socket.IO
//   // Socket.IO doesn't work well with Netlify redirects
//   return 'https://meymad-pool.onrender.com';
// };
const baseUrl = import.meta.env.VITE_API_URL;
const socketUrl = baseUrl.includes("localhost")
    ? baseUrl
    : `${baseUrl}.onrender.com`;

console.log('Socket connecting   to:', socketUrl);


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
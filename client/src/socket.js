import { io } from "socket.io-client";
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
console.log('Socket URL:', socketUrl);
console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
console.log('All env vars:', Object.keys(import.meta.env));
console.log('Environment variables:', import.meta.env);
const socket = io(socketUrl, { withCredentials: true });
export default socket;
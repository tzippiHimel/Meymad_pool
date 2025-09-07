import { io } from "socket.io-client";
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
console.log('Socket URL:', socketUrl);
console.log('Environment variables:', import.meta.env);
const socket = io(socketUrl, { withCredentials: true });
export default socket;
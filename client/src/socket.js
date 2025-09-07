import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://meymad-pool.onrender.com";
console.log('Socket URL:', socketUrl);
console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);

const socket = io(socketUrl, { withCredentials: true });
export default socket;
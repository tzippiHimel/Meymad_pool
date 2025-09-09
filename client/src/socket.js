import { io } from "socket.io-client";

// Use hardcoded URL until Netlify env vars are fixed
const socketUrl = "https://meymad-pool.onrender.com";

const socket = io(socketUrl, { withCredentials: true });
export default socket;
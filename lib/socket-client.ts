import { io } from "socket.io-client"

// Use relative path for socket connection to support both local and deployed environments
// If deployed on Vercel/Netlify, this will need a separate socket server URL
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ""

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    path: "/socket.io",
    transports: ["websocket", "polling"],
})

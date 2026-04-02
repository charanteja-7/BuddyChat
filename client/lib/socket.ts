import { io } from "socket.io-client";

const URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
});

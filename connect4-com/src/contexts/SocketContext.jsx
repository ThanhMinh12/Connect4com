import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const s = io(import.meta.env.VITE_API_URL, {
      // Send token to backend
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ["polling", "websocket"],
    });
    s.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      if (error.message === "Authentication error") {
        localStorage.removeItem("token");
        navigate("/login");
      }
    });
    s.on("needLogin", () => {
      console.log("Login required");
      navigate("/login");
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  const value = {
    socket,
    isConnected: socket?.connected || false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
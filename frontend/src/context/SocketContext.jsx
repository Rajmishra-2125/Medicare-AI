import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { addNotification } from "../features/notifications/notificationSlice";
import { getAccessToken } from "../services/api";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      const token = getAccessToken();
      
      // Connect to the backend
      const socketInstance = io(
        import.meta.env.VITE_API_BASE_URL ||
          "https://medicare-healthcare-app.onrender.com",
        {
          query: {
            userId: userId,
            userName: user.name || user.fullname || "there",
          },
          auth: {
            token: token,
          },
        }
      );

      setSocket(socketInstance);

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on("notification", (data) => {
        // Prevent welcome spam on page refresh
        if (data.type === "welcome") {
          const hasSeen = sessionStorage.getItem(
            `hasSeenWelcome_${userId}`
          );
          if (hasSeen) return;
          sessionStorage.setItem(
            `hasSeenWelcome_${userId}`,
            "true"
          );
        }

        // Display toast popup for real-time wait alerts
        if (data.type === "ALERT" || (data.message && data.message.includes("waiting for Session"))) {
          toast.success(data.message, {
            duration: 8000,
            style: {
              border: "1px solid #10B981",
              padding: "16px",
              color: "#065F46",
              background: "#ECFDF5",
            },
          });
        }

        // Send Notification to Global Redux State (Bell Icon) instead of generic toaster popups
        dispatch(addNotification(data));
      });

      return () => {
        socketInstance.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user?._id || user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  return useContext(SocketContext);
};

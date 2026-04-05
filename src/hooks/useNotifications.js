// src/hooks/useNotifications.js
// ─── Global notifications state with realtime updates ────────────────────────
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  getUnreadCount,
  subscribeToNotifications,
} from "../services/notificationService";

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotif, setLatestNotif] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    // Load initial unread count
    getUnreadCount(user.id).then(({ count }) => setUnreadCount(count));

    // Subscribe to new notifications in realtime
    const channel = subscribeToNotifications(user.id, (newNotif) => {
      setUnreadCount(prev => prev + 1);
      setLatestNotif(newNotif); // triggers toast if needed
    });

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  function decrementUnread(by = 1) {
    setUnreadCount(prev => Math.max(0, prev - by));
  }

  function clearUnread() {
    setUnreadCount(0);
  }

  return { unreadCount, latestNotif, decrementUnread, clearUnread };
}
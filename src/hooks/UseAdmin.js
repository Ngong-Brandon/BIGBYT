// src/hooks/useAdmin.js
// ─── Hook to check admin status and protect admin routes ─────────────────────
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) { setIsAdmin(false); setLoading(false); return; }

      // !! Add your admin emails here !!
      // Option 1 — hardcoded admin emails (simple, fine for small team)
      const ADMIN_EMAILS = [
        "ngongfonchang115@gmail.com",    // admin email !!
        "admin@bigbyt.com",      // !! Add more admin emails as needed !!
      ];
  
   
      if (ADMIN_EMAILS.includes(user.email)) {
        
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Option 2 — check a role column in profiles table (more scalable)
      // Uncomment this when you add a `role` column to profiles:
      //
     
      
    //   const { data } = await supabase
    //     .from("profiles")
    //     .select("role")
    //     .eq("id", user.id)
    //     .single();
    //   setIsAdmin(data?.role === "admin");

      

      setIsAdmin(false);
      setLoading(false);
    }
    check();
  }, [user]);

  return { isAdmin, loading };
}
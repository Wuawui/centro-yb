"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    // Obtener sesión actual
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile as Profile | null,
          loading: false,
        });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    };

    getInitialSession();

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile as Profile | null,
          loading: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return {
    ...state,
    signOut,
    isAdmin:
      state.profile?.role === "super_admin" ||
      state.profile?.role === "director" ||
      state.profile?.role === "admin",
    isTherapist: state.profile?.role === "terapeuta",
    isCoordinator: state.profile?.role === "coordinador",
  };
}
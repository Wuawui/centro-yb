"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";

// ============================================================
// Root page: Client-side redirect based on session role.
// Previously this was a Server Component doing await getUser()
// which blocked HTML rendering when Supabase was slow/unreachable.
// The middleware already handles auth guard for protected routes.
// ============================================================

export default function Home() {
  const { user, role, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "padre") {
      router.replace("/parent");
    } else if (role === "terapeuta") {
      router.replace("/therapist");
    } else {
      // super_admin, director, coordinador, admin → dashboard
      router.replace("/dashboard");
    }
  }, [user, role, loading, router]);

  // Show nothing while redirecting (SessionProvider already shows loading spinner)
  return null;
}
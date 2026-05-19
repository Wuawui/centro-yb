"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook to get the current user's tenant_id.
 * Used for explicit tenant filtering in all Supabase queries.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTenantId(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      setTenantId(profile?.tenant_id || null);
      setLoading(false);
    }
    load();
  }, []);

  return { tenantId, loading };
}
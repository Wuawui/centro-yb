-- ============================================================
-- MIGRACIÓN 007: Fix parent portal issues
-- 1. RLS: Padres pueden actualizar su propio perfil
-- 2. RLS: Padres pueden leer su propio perfil
-- 3. RPC: update_parent_profile (SECURITY DEFINER para evitar RLS issues)
-- ============================================================

-- 1. Allow padres to update their own profile
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Allow padres to read their own profile (already covered by existing policies, but explicit)
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
CREATE POLICY "profiles_select_self" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR tenant_id = public.get_tenant_id());

-- 3. RPC for parent to update their own profile (avoids RLS issues)
CREATE OR REPLACE FUNCTION public.update_parent_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT
)
RETURNS TABLE(success BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE profiles
  SET first_name = p_first_name,
      last_name = p_last_name,
      phone = p_phone,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING true AS success;
$$;

-- 4. Add RLS policy for padres to read parent_patients (their own links)
DROP POLICY IF EXISTS "parent_patients_select_self" ON parent_patients;
CREATE POLICY "parent_patients_select_self" ON parent_patients FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR tenant_id = public.get_tenant_id());
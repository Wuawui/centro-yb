-- RLS policies for notifications
DROP POLICY IF EXISTS "notifications_select_self" ON notifications;
CREATE POLICY "notifications_select_self" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tenant_id = public.get_tenant_id());

DROP POLICY IF EXISTS "notifications_insert_tenant" ON notifications;
CREATE POLICY "notifications_insert_tenant" ON notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

DROP POLICY IF EXISTS "notifications_update_self" ON notifications;
CREATE POLICY "notifications_update_self" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_self" ON notifications;
CREATE POLICY "notifications_delete_self" ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
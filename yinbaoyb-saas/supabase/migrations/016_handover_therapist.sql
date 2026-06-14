-- ── FUNCIÓN DE CAMBIO DE PERSONAL / TRASPASO DE PACIENTES ──
CREATE OR REPLACE FUNCTION public.handover_therapist(
  p_old_therapist_id UUID,
  p_new_therapist_id UUID,
  p_deactivate BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patient_count INT;
  v_appointment_count INT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Verificar autorización del llamador (auth.uid()) en el mismo tenant
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND role IN ('super_admin', 'director', 'admin', 'coordinador')
      AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = p_old_therapist_id)
  ) THEN
    RAISE EXCEPTION 'No autorizado para realizar esta acción';
  END IF;

  -- 2. Verificar que el nuevo terapeuta esté en el mismo tenant y esté activo
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_new_therapist_id 
      AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = p_old_therapist_id)
      AND active = true
  ) THEN
    RAISE EXCEPTION 'El terapeuta receptor no existe, no está activo o pertenece a otro centro';
  END IF;

  -- 3. Reasignar pacientes principales
  UPDATE patients
  SET therapist_id = p_new_therapist_id,
      updated_at = NOW()
  WHERE therapist_id = p_old_therapist_id;
  GET DIAGNOSTICS v_patient_count = ROW_COUNT;

  -- 4. Remover del array de terapeutas secundarios
  UPDATE patients
  SET secondary_therapist_ids = array_remove(secondary_therapist_ids, p_old_therapist_id),
      updated_at = NOW()
  WHERE p_old_therapist_id = ANY(secondary_therapist_ids);

  -- 5. Reasignar citas futuras (de hoy en adelante) en estado activo (programada, confirmada, reprogramada)
  UPDATE appointments
  SET therapist_id = p_new_therapist_id,
      updated_at = NOW()
  WHERE therapist_id = p_old_therapist_id
    AND date >= v_today
    AND status IN ('programada', 'confirmada', 'reprogramada');
  GET DIAGNOSTICS v_appointment_count = ROW_COUNT;

  -- 6. Desactivar terapeuta anterior
  IF p_deactivate THEN
    UPDATE profiles
    SET active = false,
        updated_at = NOW()
    WHERE id = p_old_therapist_id;
    
    UPDATE therapists
    SET active = false,
        updated_at = NOW()
    WHERE id = p_old_therapist_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'patients_transferred', v_patient_count,
    'appointments_transferred', v_appointment_count
  );
END;
$$;

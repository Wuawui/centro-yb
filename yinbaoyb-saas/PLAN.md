# PLAN.md — CentroYB SaaS

## Estado actual del proyecto

**Stack:** Next.js 16.2.3 + Tailwind CSS + Supabase (PostgreSQL + Auth + RLS)
**Build:** ✅ Compila sin errores
**Migraciones:** 7 migraciones SQL (001-007)
**Dependencias:** @supabase/ssr, @supabase/supabase-js, lucide-react, next, react, tailwindcss

### Módulos implementados
- ✅ Auth (login, signup, password reset, callback)
- ✅ Dashboard (datos reales de Supabase)
- ✅ Pacientes (CRUD completo: lista, nuevo, detalle, editar, eliminar, toggle activo)
- ✅ Terapeutas (lista, nuevo, detalle con horario, toggle activo, editar perfil)
- ✅ Agenda (vista día/semana/mes, crear cita, conflicto horario, cambiar estado)
- ✅ Clínico (notas SOAP/BIRP/DAP/Libre/Progreso, escalas con preguntas, timeline)
- ✅ Portal de Padres (dashboard, notas, escalas, citas, perfil hijo, perfil propio)
- ✅ ParentLinking (vincular/desvincular padres, permisos granulares)
- ✅ Usuarios (lista, crear usuario con roles)
- ✅ Settings (funcional: guardar datos del tenant, color, plan)
- ✅ Sidebar filtrado por rol
- ✅ API: /api/admin/create-user (con service_role)
- ✅ Middleware (auth + role-based routing + cookie cache de rol)
- ✅ Toast system (componente reutilizable)
- ✅ useParentAuth hook (auth singleton, evita lock contention)
- ✅ useParentData hook (datos del padre en paralelo, sin duplicación)

## Errores encontrados y resueltos

### ✅ RESUELTOS (Sprint 1)
1-12. Ver historial en commits anteriores

### ✅ RESUELTOS (Sprint 2 - Portal de Padres)
13. **Lock auth contention** — Múltiples `createClient()` + `onAuthStateChange()` competían por el lock del token → Creado `useParentAuth` singleton + `useParentData` con carga paralela
14. **tenant_id hardcodeado en ParentLinking** — `"00000000-..."` → Ahora obtiene tenant_id del profile del usuario actual
15. **Falta ToastProvider en parent layout** → Agregado `<ToastProvider>` envolviendo el layout
16. **profiles UPDATE bloqueado por RLS para padres** → Creada política `profiles_update_self` + RPC `update_parent_profile` con SECURITY DEFINER
17. **Middleware hace query a profiles en CADA request** → Agregado cache de rol en cookie `sb-role` (1h), solo consulta DB si no hay cookie
18. **Sin manejo de errores en páginas del padre** → Agregado `error` state + UI de error en todas las páginas
19. **ParentDashboard usaba setTimeout(500ms)** como workaround del lock → Eliminado, ahora usa `useParentData` hook
20. **Fechas en appointments** podían dar wrong timezone → Agregado `"T12:00:00"` para evitar offset de timezone

## Backlog priorizado

### PRIORIDAD ALTA — Siguiente
- [x] Ejecutar migración 006 Y 007 en Supabase (ambas pendientes)
- [x] Crear usuario padre de prueba para verificar flujo completo
- [x] Patients: filtrar explícitamente por tenant_id en todas las queries
- [x] Toast notifications integrado en lugar de `alert()` en dashboard

### PRIORIDAD MEDIA — Funcionalidad terapéutica
- [ ] Dashboard del terapeuta: sus citas del día, pacientes, alertas
- [ ] Escalas PHQ-9 y GAD-7 precargadas con preguntas (seed migration)
- [ ] Notas clínicas: firma digital más robusta

### PRIORIDAD MEDIA — Portal de padres
- [ ] Notificaciones de cambios de cita
- [ ] Perfil de padre editable (ya funciona con RPC update_parent_profile)

### PRIORIDAD BAJA — Pulido
- [ ] Responsive tables
- [ ] Animaciones suaves
- [ ] Estados de carga consistentes
- [ ] Middleware: migrar de `middleware.ts` a `proxy` (Next.js 16)
- [ ] Modo oscuro
- [ ] Reportes en PDF

## Ideas evaluadas

1. ✅ **Indicador de conflicto de horario al agendar** — Implementado
2. ✅ **Campo "motivo de consulta" en creación de paciente** — Existe en schema
3. ✅ **Badge visual en agenda para tipo de terapia** — Implementado
4. ✅ **Resumen automático de última sesión en perfil del paciente** — Implementado
5. ⏸️ **Integración con WhatsApp** — Requiere API key
6. ⏸️ **Reportes en PDF** — Baja prioridad
7. ⏸️ **Modo oscuro** — Cosmético

## Log de progreso

### Sprint 1 — 2026-04-11
- Setup completo del proyecto, auth, módulos principales
- Migraciones 001-005, build exitoso

### Sprint 1.5 — 2026-04-11
- Migración 006, toast system, fixes varios
- Dashboard con datos reales, sidebar por rol, settings

### Sprint 2 — 2026-04-13
- **Fix completo del Portal de Padres:**
  - Lock auth contention resuelto (useParentAuth singleton)
  - tenant_id hardcodeado eliminado
  - ToastProvider agregado
  - RLS para padres + RPC update_parent_profile
  - Middleware optimizado con cookie cache
  - Error handling en todas las páginas
  - Migración 007 creada
  - Build exitoso

### Para ejecutar el proyecto:
```bash
cd C:\Users\Osito\yinbaoyb-saas
npm run dev
```

### Para aplicar migraciones:
Ejecutar `006_add_patient_active_and_policies.sql` y `007_fix_parent_portal.sql` en el SQL Editor de Supabase.
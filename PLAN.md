# 🏢 CentroYB — SaaS para Centros Terapéuticos
## WhatsApp Bot + Gestión Integral para Centros Terapéuticos

> **Nombre:** CentroYB
> **Fecha creación:** 2026-04-13
> **Estado:** Fase 1 — Bot funcional, pendiente deployment
> **Cliente validación:** Centro Terapéutico Integral Logros (Guayaquil)

---

## 1. RESUMEN EJECUTIVO

**Qué es:** SaaS de bot de WhatsApp + gestión integral para centros terapéuticos. Responde consultas 24/7, agenda citas, gestiona pacientes, cobra, hace seguimiento de leads, y notifica automáticamente.

**Cliente piloto:** Centro Terapéutico Integral Logros — validación en vivo.

**Modelo:** SaaS mensual + setup fee, vendido como servicio YinbaoYB.

---

## 2. PROBLEMA QUE RESUELVE

| Dolor | Frecuencia |
|-------|-----------|
| Atienden WhatsApp manualmente — cada consulta = tiempo del terapeuta | Constante |
| Citas se pierden o superponen — sin sistema | Diario |
| Cobros desorganizados — no saben quién pagó, quién debe | Semanal |
| Leads se enfrían — alguien pregunta y nunca le dan seguimiento | Frecuente |
| Sin recordatorios — pacientes olvidan sus citas (no show) | Diario |
| Sin reportes — no saben pacientes activos, ingresos, etc. | Mensual |
| Agenda en papel o en la cabeza del terapeuta | Constante |
| Comunicación ineficiente — confirmar, recordar, re-agendar = todo manual | Diario |

---

## 3. FUNCIONALIDADES IMPLEMENTADAS ✅

| # | Funcionalidad | Archivo | Detalle |
|---|--------------|---------|---------|
| 1 | Motor del bot | bot.py | Flujos de conversación completos |
| 2 | Motor de mensajes | mensajes.py | 12 mensajes + calendario inteligente |
| 3 | Base de datos | database.py | SQLite (pacientes, citas, pagos, leads) |
| 4 | Calendario inteligente | mensajes.py | Disponibilidad automática, sábados solo mañana |
| 5 | Seguimiento de leads | scheduler.py | 24h y 3 días post-consulta |
| 6 | Evolution API | evolution.py | Cliente WhatsApp GRATIS |
| 7 | Webhook | webhook.py | Recepción de mensajes |
| 8 | Comandos admin | bot.py | /cambio, /cobros, /pacientes, /help, /citas, /reporte |
| 9 | Reportes diarios | scheduler.py | Resumen automático |
| 10 | Google Sheets sync | sheets.py | Estructura lista |
| 11 | Scheduler | scheduler.py | Tareas programadas |
| 12 | API Flask alternativa | app.py | WhatsApp Business API Meta |
| 13 | Flujo nuevo paciente | bot.py | Bienvenida → datos → cita |
| 14 | Flujo paciente existente | bot.py | Escalamiento a humano |
| 15 | Config JSON | config.json | Precios, horarios, terapias, mensajes |

### 🟡 Pendiente para deployment

- [ ] Instalar Docker Desktop en laptop del cliente
- [ ] Instalar Evolution API (docker-compose up -d)
- [ ] Escanear QR con WhatsApp Business del centro
- [ ] Probar conexión enviando mensaje de prueba
- [ ] Deploy 24/7 (VPS o Raspberry Pi)

---

## 4. CONFIGURACIÓN DEL PRODUCTO

### Terapias soportadas
1. 🗣️ Terapia de Lenguaje
2. 🤲 Terapia Ocupacional
3. 🧠 Terapia Conductual
4. 💡 Psicología Infantil
5. 🔬 Neuropsicología
6. 👶 Estimulación Temprana

*Configurable en config.json para adaptar a cualquier centro terapéutico*

### Precios (ejemplo Centro Logros)
| Plan | Precio/semana |
|------|--------------|
| 1 sesión/semana | $15 |
| 2 sesiones/semana | $28 |
| 3 sesiones/semana | $40 |

*Configurable por centro en config.json*

### Horarios (ejemplo Centro Logros)
- **Lun-Vie:** 9:00 AM - 12:30 PM / 2:10 PM - 6:20 PM
- **Sábados:** 9:00 AM - 12:30 PM
- **Domingos:** CERRADO
- **Duración sesión:** 50 minutos

*Configurable por centro en config.json*

---

## 5. ARQUITECTURA TÉCNICA

### Stack
```
Lenguaje:      Python 3.10+
Framework:     Flask (API + Webhook)
Base de datos: SQLite (escálable a PostgreSQL)
WhatsApp:      Evolution API (Baileys) — GRATIS
Alternativa:   WhatsApp Business API de Meta (pago)
Hosting:       Local → VPS/Raspberry Pi
```

### Estructura del Código
```
centro-logros-bot/              ← Repo: github.com/Wuawui/centro-logros-bot
├── start.bat                  ← Doble click para iniciar
├── setup.bat                  ← Instalación automática
├── requirements.txt
├── .env / .env.example        ← Configuración
├── config.json                ← Config completa del centro
├── evolution.py               ← Cliente Evolution API
├── webhook.py                 ← Webhook principal
├── bot.py                     ← Motor del bot
├── mensajes.py                ← Mensajes + calendario
├── database.py                ← Base de datos SQLite
├── sheets.py                  ← Google Sheets sync
├── admin.py                   ← Administración
├── scheduler.py               ← Tareas programadas
├── app.py                     ← Alternativa WhatsApp Meta
├── docker-compose.yml         ← Evolution API + PostgreSQL
├── admin.html                 ← Panel admin web
├── tarjeta-profesional.html   ← Tarjeta digital
├── logros.db                  ← SQLite (auto-generada)
└── INSTALL.md                 ← Guía de instalación
```

### Flujo de Arquitectura
```
WhatsApp Business ──► Evolution API ──► Webhook (Flask) ──► Bot Engine
       │                    │                    │                │
       │                    │                    │                ├── mensajes.py
       │                    │                    │                ├── database.py
       │                    │                    │                └── scheduler.py
       │                    │                    │
       │                    ├── PostgreSQL (Evolution)
       │                    └── Cache local (sesiones)
       │
       └──── Admin ──► Comandos: /cobros, /pacientes, /cambio, etc.
```

---

## 6. BUGS ARREGLADOS (Sprint 2 — 13 abril 2026)

1. UnicodeEncodeError en Windows (emojis) → Fix: reconfigure encoding
2. Calendario: tarde en sábado → Fix: condicional
3. Días sin acentos no reconocidos → Fix: DIA_MAP
4. Opción "3" no iniciaba agendamiento → Fix: paso directo
5. "hola" no reseteaba flujo → Fix: palabras clave
6. Hora sin validación → Fix: HH:MM
7. Slots de mañana mostraba solo 2 → Fix: correcto según duración

---

## 7. MARKETING DEL PRODUCTO (Plan para clientes)

### Cómo se vende CentroYB
- Incluido en plan YinbaoYB Avanzado ($33/mes) como valor agregado
- Standalone: $20-30/mes por centro
- Setup fee: $50-100 (configuración + capacitación)

### Diferenciadores vs competencia
- WhatsApp nativo (canal #1 en Ecuador)
- Sin permanencia
- Setup en 30 minutos
- Customizable por centro (config.json)
- Soporte directo por DarKey

---

## 8. PENDIENTES DEL PRODUCTO

- [ ] Deploy piloto con Centro Logros (primer cliente)
- [ ] Documentar caso de éxito una vez en producción
- [ ] Landing page del SaaS
- [ ] Sistema de onboarding automático para nuevos centros
- [ ] Multi-centro (una instancia, múltiples centros)
- [ ] Dashboard web para administración
- [ ] API REST para integraciones externas

---

## 9. LINKS

| Recurso | URL |
|---------|-----|
| Repo Bot | https://github.com/Wuawui/centro-logros-bot |
| Web Centro Logros | https://centro-logros-guayaquil-sur.web.app |

---

*Documento vivo — solo producto, no datos de clientes.*
*Última actualización: 2026-04-17 por DarKey 🦞*
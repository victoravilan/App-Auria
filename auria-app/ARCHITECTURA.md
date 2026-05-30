# Auria App - arquitectura funcional

## Objetivo

Auria App es una PWA móvil personal para una profesional de Kobido, bienestar facial y nutrición integrativa. No replica la web: funciona como espacio privado de relación con pacientes.

## Módulos

- Inicio: resumen personal, próxima sesión, accesos rápidos y estado del plan de cuidado.
- Agenda: disponibilidad, reserva de sesiones y sincronización con Google Calendar.
- Chat: conversación paciente-terapeuta, seguimiento post sesión y dudas de rutina.
- Cuidado: plan semanal, hábitos, hidratación, masaje facial y nutrición.
- Juego: módulo reservado para integrar el puzzle de músculos faciales cuando se entregue la carpeta.

## Integraciones previstas

- Google Calendar: OAuth con Google Identity Services, creación de eventos con `events.insert()` y alternativa por enlace oficial de Calendar si no hay credenciales.
- Chat: backend con usuarios autenticados, historial por paciente y notificaciones push.
- OpenRouter: asistente de apoyo para preguntas frecuentes, rutinas guiadas y generación de respuestas revisables por la terapeuta.
- Webviews: acceso controlado a contenido externo como la web de Auria, política de privacidad o reservas externas si se decide no usar agenda nativa.

## Enfoque sanitario y de confianza

- La IA no diagnostica ni sustituye a la profesional.
- El chat debe mostrar límites claros: urgencias, datos sensibles y consentimiento.
- Los planes de cuidado se presentan como acompañamiento educativo y bienestar, no como prescripción médica.
- La accesibilidad prioriza texto grande, contrastes suaves pero legibles y botones táctiles amplios.

## Preparación para Android

La PWA ya incluye `manifest.json`, `service-worker.js`, icono instalable, caché offline básica y módulos separados por archivo. Para Google Play se puede empaquetar después como Trusted Web Activity o WebView nativa en Android Studio.

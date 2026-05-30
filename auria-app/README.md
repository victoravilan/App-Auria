# Auria App

PWA móvil inicial para Auria Bellesa i Benestar.

## Abrir la app

Servidor local activo:

```text
http://127.0.0.1:5179/index.html
```

También puede abrirse directamente `index.html`, aunque para probar instalación PWA y service worker conviene usar servidor local.

## Estado actual

- App móvil por pestañas con Inicio, Agenda, Chat, Cuidado, Servicios, Juego y Perfil.
- Agenda funcional con selección de horarios, reserva local y enlace directo para añadir a Google Calendar.
- Integración OAuth de Google Calendar preparada en `config.js`.
- Plan de cuidado editable con progreso persistente en el dispositivo.
- Chat local funcional con persistencia en el dispositivo.
- Servicios activos con ficha de detalle y acceso a reserva.
- Manifest e icono instalable.
- Service worker con caché básica.
- Imágenes reales de Auria y asset educativo de músculos faciales.

## Activar Google Calendar real

1. Crear proyecto en Google Cloud.
2. Activar Google Calendar API.
3. Crear credenciales OAuth 2.0 para aplicación web.
4. Autorizar el origen donde se publicará la PWA.
5. Rellenar `clientId` y `apiKey` en `config.js`.

La app usa Google Identity Services y Calendar API. Si no hay credenciales, mantiene un modo útil mediante enlaces oficiales de Google Calendar.

## Pendiente de producción

- Backend de pacientes y autenticación.
- Chat persistente con notificaciones.
- OpenRouter para asistente de apoyo y respuestas revisables.
- Integración del juego cuando se entregue la carpeta final.

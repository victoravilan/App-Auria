window.AuriaCalendar = (() => {
  const config = window.AURIA_CONFIG.googleCalendar;
  let tokenClient = null;
  let accessToken = "";

  function hasGoogleCredentials() {
    return Boolean(config.clientId && config.apiKey);
  }

  function toDateTime(slot, field) {
    return `${slot.date}T${slot[field]}:00`;
  }

  function googleDateValue(value) {
    return value.replace(/[-:]/g, "");
  }

  function buildCalendarUrl(slot, service) {
    const start = googleDateValue(toDateTime(slot, "start"));
    const end = googleDateValue(toDateTime(slot, "end"));
    const text = encodeURIComponent(`Auria - ${service.title}`);
    const details = encodeURIComponent(`${service.summary}\n\nReserva creada desde Auria App.`);
    const location = encodeURIComponent(window.AURIA_CONFIG.clinic.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&ctz=Europe/Madrid&details=${details}&location=${location}`;
  }

  async function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function connect() {
    if (!hasGoogleCredentials()) {
      return { ok: false, mode: "missing-config", message: "Falta configurar Client ID y API Key de Google Cloud." };
    }

    await Promise.all([
      loadScript("https://apis.google.com/js/api.js"),
      loadScript("https://accounts.google.com/gsi/client")
    ]);

    await new Promise((resolve) => window.gapi.load("client", resolve));
    await window.gapi.client.init({
      apiKey: config.apiKey,
      discoveryDocs: [config.discoveryDoc]
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: (response) => {
        accessToken = response.access_token || "";
      }
    });

    await new Promise((resolve) => {
      tokenClient.callback = (response) => {
        accessToken = response.access_token || "";
        resolve();
      };
      tokenClient.requestAccessToken({ prompt: "consent" });
    });

    return { ok: Boolean(accessToken), mode: "oauth", message: "Google Calendar conectado." };
  }

  async function createEvent(slot, service) {
    if (!accessToken || !window.gapi?.client?.calendar) {
      return { ok: false, mode: "fallback", url: buildCalendarUrl(slot, service) };
    }

    const event = {
      summary: `Auria - ${service.title}`,
      location: window.AURIA_CONFIG.clinic.location,
      description: `${service.summary}\n\nReserva creada desde Auria App.`,
      start: { dateTime: toDateTime(slot, "start"), timeZone: window.AURIA_CONFIG.clinic.timeZone },
      end: { dateTime: toDateTime(slot, "end"), timeZone: window.AURIA_CONFIG.clinic.timeZone },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 60 }
        ]
      }
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "none"
    });

    return { ok: true, mode: "oauth", url: response.result.htmlLink };
  }

  return { connect, createEvent, buildCalendarUrl, hasGoogleCredentials };
})();

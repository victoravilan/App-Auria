const storageKey = "auria-app-state-v2";
const tokenKey = "auria-auth-token";
const initialData = window.AURIA_DATA;

const state = loadState();
let selectedSlotId = state.selectedSlotId || initialData.slots[0].id;
let installPromptEvent = null;
let authToken = localStorage.getItem(tokenKey) || "";
let currentUser = null;

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Error de servidor");
  return data;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      tasks: saved.tasks || initialData.careTasks,
      messages: saved.messages || initialData.messages,
      booking: saved.booking || null,
      selectedSlotId: saved.selectedSlotId || initialData.slots[0].id,
      googleConnected: Boolean(saved.googleConnected)
    };
  } catch {
    return {
      tasks: initialData.careTasks,
      messages: initialData.messages,
      booking: null,
      selectedSlotId: initialData.slots[0].id,
      googleConnected: false
    };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({ ...state, selectedSlotId }));
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function requireAuth(actionText = "Necesitas iniciar sesion.") {
  if (currentUser) return true;
  showToast(actionText);
  navigate("profile");
  return false;
}

function renderProfile() {
  $("#authCard").hidden = Boolean(currentUser);
  $("#logoutButton").hidden = !currentUser;
  $("#profileName").textContent = currentUser ? currentUser.name : "Invitada";
  $("#profileEmail").textContent = currentUser ? `${currentUser.email} - ${currentUser.role}` : "Inicia sesion para activar tu espacio privado.";

  const isLogged = Boolean(currentUser);
  if ($("#guestWelcome")) $("#guestWelcome").style.display = isLogged ? "none" : "block";
  if ($("#userGreeting")) $("#userGreeting").style.display = isLogged ? "block" : "none";
  if ($("#homeAppointment")) $("#homeAppointment").style.display = isLogged ? "grid" : "none";
  if ($("#homeCareSection")) $("#homeCareSection").style.display = isLogged ? "block" : "none";
  if ($("#homeChatPreview")) $("#homeChatPreview").style.display = isLogged ? "grid" : "none";

  if (isLogged && $("#home-title")) {
    $("#home-title").textContent = `Hola, ${currentUser.name}`;
  }
}

function navigate(route) {
  $all(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === route));
  $all(".bottom-nav button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  window.history.replaceState(null, "", `#${route}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentSlot() {
  return initialData.slots.find((slot) => slot.id === selectedSlotId) || initialData.slots[0];
}

function serviceById(id) {
  return initialData.services.find((service) => service.id === id) || initialData.services[0];
}

function careProgress() {
  const done = state.tasks.filter((task) => task.done).length;
  return Math.round((done / state.tasks.length) * 100);
}

function renderCare() {
  const progress = careProgress();
  $("#homeProgressBar").style.width = `${progress}%`;
  $("#careProgressBar").style.width = `${progress}%`;
  $("#homeProgressText").textContent = `${progress}%`;
  $("#careProgressText").textContent = `${progress}%`;

  $("#homeCareGrid").innerHTML = state.tasks.slice(0, 4).map((task) => `
    <button class="care-item ${task.done ? "is-done" : ""}" type="button" data-task="${task.id}">
      <span>${task.done ? "OK" : ""}</span>${task.label}
    </button>
  `).join("");

  $("#taskList").innerHTML = state.tasks.map((task) => `
    <button class="task-row ${task.done ? "is-done" : ""}" type="button" data-task="${task.id}">
      <span class="task-check">${task.done ? "OK" : ""}</span>
      <span><strong>${task.label}</strong><small>${task.detail}</small></span>
    </button>
  `).join("");

  $all("[data-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      const task = state.tasks.find((item) => item.id === button.dataset.task);
      if (!task) return;
      task.done = !task.done;
      saveState();
      renderCare();
      if (currentUser) {
        api("/api/care", {
          method: "PATCH",
          body: JSON.stringify({ id: task.id, done: task.done })
        }).catch(() => showToast("No se pudo sincronizar el plan."));
      }
    });
  });
}

function renderServices() {
  const compact = initialData.services.map((service) => `
    <button class="service-card" type="button" data-service="${service.id}">
      <span>${service.icon}</span><strong>${service.title.split(" ")[0]}</strong><small>${service.short}</small>
    </button>
  `).join("");
  $("#homeServices").innerHTML = compact;

  $("#serviceList").innerHTML = initialData.services.map((service) => `
    <article class="panel service-detail">
      <div class="service-mark">${service.icon}</div>
      <div>
        <h2>${service.title}</h2>
        <p>${service.summary}</p>
      <small>${service.duration} min - ${service.price}</small>
      </div>
      <button class="outline-action" type="button" data-service="${service.id}">Ver servicio</button>
    </article>
  `).join("");

  $all("[data-service]").forEach((button) => {
    button.addEventListener("click", () => openService(button.dataset.service));
  });
}

function openService(id) {
  const service = serviceById(id);
  $("#serviceDialogTitle").textContent = service.title;
  $("#serviceDialogBody").textContent = service.summary;
  $("#serviceDialogList").innerHTML = service.benefits.map((item) => `<li>${item}</li>`).join("");
  $("#serviceDialog").showModal();
}

function renderCalendar() {
  $("#googleStatus").textContent = state.googleConnected
    ? "Google Calendar conectado para crear eventos reales."
    : window.AuriaCalendar.hasGoogleCredentials()
      ? "Credenciales detectadas. Pulsa Conectar para autorizar Calendar."
      : "Modo demo activo. Anade Client ID y API Key en config.js para crear eventos reales.";

  const selected = currentSlot();
  $("#dateStrip").innerHTML = initialData.slots.map((slot) => `
    <button class="${slot.id === selectedSlotId ? "is-selected" : ""}" type="button" data-slot="${slot.id}">
      <strong>${slot.label.split(" ")[0]}</strong>
      <span>${slot.label.replace(slot.label.split(" ")[0], "").trim()}</span>
    </button>
  `).join("");

  $("#slotList").innerHTML = initialData.slots.map((slot) => {
    const service = serviceById(slot.serviceId);
    return `
      <button class="slot-card ${slot.id === selectedSlotId ? "is-selected" : ""}" type="button" data-slot="${slot.id}">
        <span><strong>${slot.start} - ${slot.end}</strong><small>${slot.label}</small></span>
        <span>${service.title}</span>
      </button>
    `;
  }).join("");

  $all("[data-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSlotId = button.dataset.slot;
      saveState();
      renderCalendar();
      renderBookingSummary();
    });
  });

  renderBookingSummary();
}

function renderBookingSummary() {
  const slot = currentSlot();
  const service = serviceById(slot.serviceId);
  $("#bookingSummary").hidden = false;
  $("#selectedSlotText").textContent = `${service.title}: ${slot.label}, de ${slot.start} a ${slot.end}.`;
  $("#googleCalendarLink").href = window.AuriaCalendar.buildCalendarUrl(slot, service);
}

async function connectGoogle() {
  const result = await window.AuriaCalendar.connect();
  state.googleConnected = result.ok;
  saveState();
  renderCalendar();
  showToast(result.message);
}

async function confirmBooking() {
  if (!requireAuth("Inicia sesion para guardar tu reserva.")) return;
  const slot = currentSlot();
  const service = serviceById(slot.serviceId);
  const result = await window.AuriaCalendar.createEvent(slot, service);
  state.booking = { slotId: slot.id, serviceId: service.id, calendarUrl: result.url };
  await api("/api/bookings", {
    method: "POST",
    body: JSON.stringify(state.booking)
  });
  saveState();
  showToast(result.ok ? "Reserva creada en Google Calendar." : "Reserva guardada. Usa el boton para anadirla a Google Calendar.");
  if (result.url) $("#googleCalendarLink").href = result.url;
}

function renderMessages() {
  $("#messages").innerHTML = state.messages.map((message) => `
    <p class="bubble ${message.from === "patient" ? "patient" : "therapist"}">
      ${message.text}<small>${message.time}</small>
    </p>
  `).join("");

  const last = state.messages[state.messages.length - 1];
  $("#lastMessagePreview").textContent = last.text;
  $("#lastMessageTime").textContent = last.time;
}

function sendMessage(event) {
  event.preventDefault();
  if (!requireAuth("Inicia sesion para enviar mensajes.")) return;
  const input = $("#messageInput");
  const text = input.value.trim();
  if (!text) return;
  api("/api/messages", {
    method: "POST",
    body: JSON.stringify({ text })
  }).then((data) => {
    state.messages.push({ from: data.message.from, text: data.message.text, time: formatTime(data.message.time) });
    input.value = "";
    saveState();
    renderMessages();
    showToast("Mensaje enviado.");
  }).catch((error) => showToast(error.message));
}

function bindEvents() {
  $all("[data-route]").forEach((control) => {
    control.addEventListener("click", (event) => {
      const route = control.dataset.route;
      if (route) {
        event.preventDefault();
        if ((route === "chat" || route === "care") && !currentUser) {
          requireAuth("Inicia sesion para activar este modulo.");
          return;
        }
        const dialog = control.closest("dialog");
        if (dialog) dialog.close();
        navigate(route);
      }
    });
  });

  $("#connectGoogleButton").addEventListener("click", () => {
    connectGoogle().catch(() => showToast("No se pudo conectar Google Calendar. Revisa config.js y el dominio autorizado."));
  });

  $("#confirmBookingButton").addEventListener("click", () => {
    confirmBooking().catch(() => showToast("No se pudo crear el evento. Usa el enlace de Google Calendar."));
  });

  $("#messageForm").addEventListener("submit", sendMessage);
  $("#authForm").addEventListener("submit", (event) => {
    event.preventDefault();
    login().catch((error) => showToast(error.message));
  });
  $("#registerButton").addEventListener("click", () => {
    register().catch((error) => showToast(error.message));
  });
  $("#logoutButton").addEventListener("click", logout);

  $("#installAppButton")?.addEventListener("click", async () => {
    if (!installPromptEvent) {
      showToast("Si no aparece el instalador, usa Compartir o menu del navegador y elige Instalar app.");
      return;
    }
    installPromptEvent.prompt();
    const result = await installPromptEvent.userChoice;
    installPromptEvent = null;
    $("#installCard").hidden = true;
    showToast(result.outcome === "accepted" ? "Auria App instalada." : "Instalacion cancelada.");
  });
}

async function login() {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: $("#authEmail").value,
      password: $("#authPassword").value
    })
  });
  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem(tokenKey, authToken);
  await loadBackendState();
  renderAll();
  showToast("Sesion iniciada.");
}

async function register() {
  const data = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: $("#authName").value,
      email: $("#authEmail").value,
      password: $("#authPassword").value
    })
  });
  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem(tokenKey, authToken);
  await loadBackendState();
  renderAll();
  showToast("Cuenta creada.");
}

function logout() {
  authToken = "";
  currentUser = null;
  localStorage.removeItem(tokenKey);
  renderAll();
  navigate("profile");
  showToast("Sesion cerrada.");
}

async function loadBackendState() {
  if (!authToken) return;
  try {
    const me = await api("/api/me");
    currentUser = me.user;
    const [messages, care] = await Promise.all([
      api("/api/messages"),
      api("/api/care")
    ]);
    if (messages.messages?.length) state.messages = messages.messages.map((message) => ({
      from: message.from,
      text: message.text,
      time: formatTime(message.time)
    }));
    if (care.tasks?.length) state.tasks = care.tasks;
    saveState();
  } catch {
    authToken = "";
    currentUser = null;
    localStorage.removeItem(tokenKey);
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Ahora";
  return date.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function renderAll() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  document.body.classList.toggle("is-standalone", Boolean(standalone));
  $("#installCard").hidden = Boolean(standalone);

  renderCare();
  renderServices();
  renderCalendar();
  renderMessages();
  renderProfile();
}

async function init() {
  await loadBackendState();
  renderAll();
  bindEvents();

  const route = window.location.hash.replace("#", "");
  if (route && $(`[data-view="${route}"]`)) navigate(route);
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  if (!document.body.classList.contains("is-standalone")) {
    $("#installCard").hidden = false;
  }
});

window.addEventListener("appinstalled", () => {
  installPromptEvent = null;
  document.body.classList.add("is-standalone");
  $("#installCard").hidden = true;
  showToast("Auria App instalada.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("service-worker.js?v=4").catch(() => null);
    registration?.update?.();
  });
}

init();

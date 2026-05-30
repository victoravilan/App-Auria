const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 5179);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "server-data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".PNG": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".md": "text/markdown; charset=utf-8"
};

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) return;
  const therapist = createUserRecord({
    name: "Angels",
    email: "angels@auria.local",
    password: "auria-demo",
    role: "therapist"
  });
  const patient = createUserRecord({
    name: "Marta",
    email: "marta@auria.local",
    password: "auria-demo",
    role: "patient"
  });
  fs.writeFileSync(DB_PATH, JSON.stringify({
    users: [therapist, patient],
    sessions: [],
    messages: [
      { id: id(), fromUserId: therapist.id, toUserId: patient.id, text: "Hola Marta, como esta tu piel hoy?", createdAt: new Date().toISOString() },
      { id: id(), fromUserId: patient.id, toUserId: therapist.id, text: "Mas relajada. Tengo una duda sobre la rutina de noche.", createdAt: new Date().toISOString() },
      { id: id(), fromUserId: therapist.id, toUserId: patient.id, text: "Perfecto, revisamos hidratacion y presion del masaje.", createdAt: new Date().toISOString() }
    ],
    bookings: [],
    care: {
      [patient.id]: [
        { id: "routine", label: "Rutina diaria", detail: "Limpieza suave y respiracion consciente.", done: true },
        { id: "massage", label: "Masaje", detail: "5 minutos de automasaje sin presion excesiva.", done: true },
        { id: "nutrition", label: "Nutricion", detail: "Registrar energia, digestion y piel.", done: true },
        { id: "hydration", label: "Hidratacion", detail: "Aumentar agua e infusiones suaves.", done: false },
        { id: "rest", label: "Descanso", detail: "Dormir con mandibula relajada.", done: false }
      ]
    }
  }, null, 2));
}

function id() {
  return crypto.randomBytes(12).toString("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function createUserRecord({ name, email, password, role = "patient" }) {
  const credentials = hashPassword(password);
  return {
    id: id(),
    name,
    email: email.toLowerCase(),
    role,
    passwordSalt: credentials.salt,
    passwordHash: credentials.hash,
    createdAt: new Date().toISOString()
  };
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function getSessionUser(req, db) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt) > new Date());
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function therapistUser(db) {
  return db.users.find((user) => user.role === "therapist") || db.users[0];
}

async function handleApi(req, res, pathname) {
  const db = readDb();

  if (req.method === "POST" && pathname === "/api/auth/register") {
    const body = await parseBody(req);
    if (!body.name || !body.email || !body.password) return sendJson(res, 400, { error: "Faltan datos." });
    if (db.users.some((user) => user.email === body.email.toLowerCase())) return sendJson(res, 409, { error: "El email ya existe." });
    const user = createUserRecord({ name: body.name, email: body.email, password: body.password, role: "patient" });
    db.users.push(user);
    db.care[user.id] = readDb().care[Object.keys(readDb().care)[0]] || [];
    const token = id();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() });
    writeDb(db);
    return sendJson(res, 201, { token, user: publicUser(user) });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const user = db.users.find((item) => item.email === String(body.email || "").toLowerCase());
    if (!user) return sendJson(res, 401, { error: "Credenciales incorrectas." });
    const credentials = hashPassword(String(body.password || ""), user.passwordSalt);
    if (credentials.hash !== user.passwordHash) return sendJson(res, 401, { error: "Credenciales incorrectas." });
    const token = id();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() });
    writeDb(db);
    return sendJson(res, 200, { token, user: publicUser(user) });
  }

  const user = getSessionUser(req, db);
  if (!user) return sendJson(res, 401, { error: "Necesitas iniciar sesion." });

  if (req.method === "GET" && pathname === "/api/me") return sendJson(res, 200, { user: publicUser(user) });

  if (req.method === "GET" && pathname === "/api/messages") {
    const therapist = therapistUser(db);
    const messages = db.messages
      .filter((message) => [message.fromUserId, message.toUserId].includes(user.id))
      .filter((message) => [message.fromUserId, message.toUserId].includes(therapist.id))
      .map((message) => ({
        id: message.id,
        from: message.fromUserId === user.id ? "patient" : "therapist",
        text: message.text,
        time: message.createdAt
      }));
    return sendJson(res, 200, { messages });
  }

  if (req.method === "POST" && pathname === "/api/messages") {
    const body = await parseBody(req);
    const text = String(body.text || "").trim();
    if (!text) return sendJson(res, 400, { error: "Mensaje vacio." });
    const therapist = therapistUser(db);
    const message = { id: id(), fromUserId: user.id, toUserId: therapist.id, text, createdAt: new Date().toISOString() };
    db.messages.push(message);
    writeDb(db);
    return sendJson(res, 201, { message: { id: message.id, from: "patient", text: message.text, time: message.createdAt } });
  }

  if (req.method === "GET" && pathname === "/api/care") return sendJson(res, 200, { tasks: db.care[user.id] || [] });

  if (req.method === "PATCH" && pathname === "/api/care") {
    const body = await parseBody(req);
    const tasks = db.care[user.id] || [];
    const task = tasks.find((item) => item.id === body.id);
    if (!task) return sendJson(res, 404, { error: "Tarea no encontrada." });
    task.done = Boolean(body.done);
    db.care[user.id] = tasks;
    writeDb(db);
    return sendJson(res, 200, { tasks });
  }

  if (req.method === "GET" && pathname === "/api/bookings") {
    return sendJson(res, 200, { bookings: db.bookings.filter((booking) => booking.userId === user.id) });
  }

  if (req.method === "POST" && pathname === "/api/bookings") {
    const body = await parseBody(req);
    const booking = {
      id: id(),
      userId: user.id,
      serviceId: body.serviceId,
      slotId: body.slotId,
      calendarUrl: body.calendarUrl || "",
      createdAt: new Date().toISOString()
    };
    db.bookings.push(booking);
    writeDb(db);
    return sendJson(res, 201, { booking });
  }

  return sendJson(res, 404, { error: "Ruta API no encontrada." });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const fullPath = path.normalize(path.join(ROOT, requested));


  fs.readFile(fullPath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found: " + pathname);
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(fullPath)] || "application/octet-stream" });
    res.end(data);
  });
}

ensureDb();

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname).catch((error) => sendJson(res, 500, { error: error.message }));
    return;
  }
  serveStatic(req, res, url.pathname);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Auria App running at http://127.0.0.1:${PORT}`);
});

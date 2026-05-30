window.AURIA_DATA = {
  services: [
    {
      id: "kobido",
      title: "Kobido integral",
      short: "Masaje facial",
      icon: "Ko",
      duration: 90,
      price: "Sesión personalizada",
      summary: "Masaje facial japones con enfoque de relajacion, drenaje, tono muscular y bienestar.",
      benefits: ["Relajacion profunda", "Trabajo manual del rostro", "Acompanamiento post sesion"]
    },
    {
      id: "diagnostico",
      title: "Diagnostico facial",
      short: "Primera consulta",
      icon: "Di",
      duration: 60,
      price: "Valoración inicial",
      summary: "Observacion de habitos, piel, tension facial y objetivos para disenar un plan realista.",
      benefits: ["Mapa de necesidades", "Rutina inicial", "Recomendaciones personalizadas"]
    },
    {
      id: "nutricion",
      title: "Nutricion integrativa",
      short: "Habitos y piel",
      icon: "Nu",
      duration: 75,
      price: "Seguimiento",
      summary: "Acompanamiento de habitos alimentarios orientado a bienestar, energia y cuidado de la piel.",
      benefits: ["Habitos sostenibles", "Registro semanal", "Plan sencillo de continuidad"]
    },
    {
      id: "talleres",
      title: "Talleres",
      short: "Eventos",
      icon: "Ta",
      duration: 120,
      price: "Según convocatoria",
      summary: "Encuentros de autocuidado facial, masaje consciente, cosmética natural y bienestar.",
      benefits: ["Aprendizaje guiado", "Material practico", "Experiencia grupal"]
    }
  ],
  careTasks: [
    { id: "routine", label: "Rutina diaria", detail: "Limpieza suave y respiracion consciente.", done: true },
    { id: "massage", label: "Masaje", detail: "5 minutos de automasaje sin presión excesiva.", done: true },
    { id: "nutrition", label: "Nutricion", detail: "Registrar energia, digestion y piel.", done: true },
    { id: "hydration", label: "Hidratacion", detail: "Aumentar agua e infusiones suaves.", done: false },
    { id: "rest", label: "Descanso", detail: "Dormir con mandibula relajada.", done: false }
  ],
  slots: [
    { id: "s1", date: "2026-05-29", label: "Viernes 29 mayo", start: "11:00", end: "12:30", serviceId: "kobido" },
    { id: "s2", date: "2026-05-30", label: "Sábado 30 mayo", start: "10:00", end: "11:30", serviceId: "diagnostico" },
    { id: "s3", date: "2026-06-02", label: "Martes 2 junio", start: "16:30", end: "18:00", serviceId: "nutricion" },
    { id: "s4", date: "2026-06-05", label: "Viernes 5 junio", start: "12:00", end: "13:30", serviceId: "kobido" }
  ],
  messages: [
    { from: "therapist", text: "Hola Marta, como esta tu piel hoy?", time: "Ayer, 18:22" },
    { from: "patient", text: "Más relajada. Tengo una duda sobre la rutina de noche.", time: "Ayer, 18:30" },
    { from: "therapist", text: "Perfecto, revisamos hidratacion y presion del masaje.", time: "Ayer, 18:36" }
  ]
};

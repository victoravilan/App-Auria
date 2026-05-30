# Integración del juego facial

Cuando entregues la carpeta del juego, la revisión debe hacerse en este orden:

1. Identificar tecnología: HTML/CSS/JS, React, canvas, assets, datos JSON o librerías.
2. Separar assets del juego en `assets/game`.
3. Separar datos educativos en `data/game`.
4. Encapsular la lógica en una pantalla interna de Auria App, no como sitio aparte.
5. Unificar navegación: el botón `Juego` abre el módulo dentro de la PWA.
6. Revisar rendimiento móvil, táctil, orientación vertical y accesibilidad.
7. Ajustar estética al sistema Auria: colores, tipografía, radios, botones y tono terapéutico.

La integración recomendada dependerá de cómo esté construido el juego:

- Si es HTML/CSS/JS simple: se migra directo a módulos internos.
- Si es React: se decide si conviene convertir toda Auria App a React/Vite o aislar el juego.
- Si es canvas puro: se encapsula como componente con controles táctiles y estado.
- Si trae muchos assets: se optimizan imágenes y carga progresiva.

No conviene integrarlo antes de auditarlo, porque puede duplicar estilos, romper la PWA o cargar librerías innecesarias.

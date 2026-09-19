# 🤖 TEOS - Plataforma Autónoma para la Prevención, Monitoreo y Educación frente a Riesgos Naturales

> **Proyecto Académico / Instituto de Educación Superior**  
> **Área:** Desarrollo de Software / Robótica e IoT / Seguridad Comunitaria  

---

## 📌 Descripción del Proyecto

**TEOS (Sistema Preventivo)** es una plataforma web interactiva y centro de operaciones diseñado como parte de una iniciativa académica y formativa. Su propósito es integrar **inteligencia artificial, simulación robótica terrestre y sensores IoT** para la detección temprana de riesgos naturales (sismos, intrusiones, incidentes) y el fortalecimiento de la resiliencia ciudadana a través de módulos educativos STEAM.

La plataforma permite a operadores y estudiantes interactuar tanto en un entorno de **simulación local** como mediante enlace directo con microcontroladores físicos (**ESP32**), facilitando el aprendizaje práctico en telemetría, cartografía digital y protocolos de respuesta ante emergencias.

---

## 🚀 Características Principales

1. **Centro de Operaciones y Telemetría IoT:**
   - Visualización y simulación de giroscopio/acelerómetro 3D (**MPU-6050**) para análisis sismológico y estabilización.
   - Monitoreo perimétrico con sensor **PIR** y servomotor visual de 180°.
   - Conexión de video en vivo mediante **WebRTC** para cámaras de inspección.
   - Alternancia en tiempo real entre **Modo Simulación** y **Enlace ESP32 Real**.

2. **Cartografía Vectorial y Despliegue de Flotas:**
   - Mapa interactivo con **Leaflet** y enrutamiento dinámico (**Leaflet Routing Machine**) para el despliegue y simulación de hasta 3 unidades autónomas en campo (Unidades A1, B2, C4).

3. **Red Comunitaria y Datos Sísmicos en Vivo:**
   - Mapa coroplético 3D por departamentos del Perú implementado con **Mapbox GL JS**.
   - Gráficos estadísticos regionales con **Chart.js**.
   - Monitoreo en tiempo real de sismos recientes mediante consumo de datos del **IGP (Instituto Geofísico del Perú)** con respaldo automatizado de la API global del **USGS**.

4. **Aula Virtual y Gamificación:**
   - **Explorador de Arquitectura Hardware (Rayos X):** Inspección interactiva de los componentes del robot (ESP32, MPU6050, motores, sensores).
   - **Terminal Arcade:** Minijuegos didácticos como *Trivia de Reacción Rápida* y *Sopa de Letras de Emergencia*.
   - Módulo teórico sobre protocolos comunitarios e inclusión para personas con discapacidad visual y auditiva.

5. **Control de Acceso y Roles:**
   - Sistema de autenticación con perfiles diferenciados (**Administrador** y **Usuario Estándar**) para el control de accesos al panel operativo.

---

## 📂 Estructura del Repositorio

```plaintext
web-teos-main/
│
├── assets/
│   └── models/
│       └── Robot.glb               # Modelo tridimensional del robot TEOS (glTF/GLB)
│
├── css/
│   └── styles.css                  # Estilos generales, tema Cyberpunk/Glassmorphism y animaciones
│
├── js/
│   ├── app.js                      # Lógica principal, conexión IoT, mapas, APIs y minijuegos
│   └── peru_departamentos.geojson  # Datos geoespaciales de los departamentos del Perú
│
├── index.html                      # Estructura principal y vistas del dashboard
└── README.md                       # Documentación del proyecto para GitHub
```

---

## 🛠️ Tecnologías y Librerías Utilizadas

- **Frontend:** HTML5 semántico, CSS3 moderno (Glassmorphism, Flexbox, CSS Grid), JavaScript Vanilla (ES6+).
- **Renderizado 3D:** Google `<model-viewer>` para modelos glTF/GLB, CSS 3D Transforms para telemetría inercial.
- **Cartografía y Mapas:** [Mapbox GL JS](https://www.mapbox.com/) y [Leaflet](https://leafletjs.com/) + Leaflet Routing Machine.
- **Gráficos:** [Chart.js](https://www.chartjs.org/) con plugin de datalabels.
- **Hardware & Protocolos Simulados:** ESP32, MPU-6050 (I2C), HC-SR501 (PIR), PWM Servos, WebRTC.
- **Iconografía & Tipografía:** [FontAwesome 6](https://fontawesome.com/) y Google Fonts ([Outfit](https://fonts.google.com/specimen/Outfit)).

---

## 💻 Instrucciones de Instalación y Ejecución

Al ser una aplicación frontend basada en estándares web modernos (con módulos y consumo de recursos 3D y GeoJSON), se recomienda ejecutarla a través de un servidor web local:

### Opción 1: Extensión Live Server (Visual Studio Code)
1. Abrir la carpeta del proyecto en **VS Code**.
2. Hacer clic derecho sobre `index.html` y seleccionar **"Open with Live Server"**.
3. La aplicación se abrirá automáticamente en `http://127.0.0.1:5500`.

### Opción 2: Python HTTP Server
Si tienes Python instalado, ejecuta en la terminal dentro de la carpeta del proyecto:
```bash
python -m http.server 8000
```
Luego abre tu navegador en `http://localhost:8000`.

---

## 🎓 Información Académica

- **Institución:** [Nombre del Instituto Superior / Universidad]
- **Carrera / Especialidad:** [Ej: Desarrollo de Sistemas / Computación e Informática / Mecatrónica]
- **Curso / Asignatura:** [Ej: Taller de Proyectos / Desarrollo Web / Sistemas Embebidos e IoT]
- **Ciclo / Semestre:** [Ej: 2024-II / Ciclo VI]
- **Autor(es):**
  - [Nombre del Estudiante] - *Desarrollador / Investigador*
- **Docente / Asesor:** [Nombre del Docente]

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de investigación académica.

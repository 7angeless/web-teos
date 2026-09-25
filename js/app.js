    /* ================= CONFIGURACIÓN MAPAS / CREDENCIALES ================= */
    const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibHVpczExMSIsImEiOiJjbXJuMWJqaWUxczczNDhvcm52MTJwYWVhIn0.xg-dCcY25lhedOHP3Ye_ow';

    /**
     * Retorna una capa de teselas oscuras de alta definición usando Mapbox Dark-v11 (@2x)
     * Resuelve de forma definitiva el aviso "API KEY REQUIRED" de proveedores de teselas obsoletos.
     */
    function crearCapaMapaOscuro() {
        return L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`,
            {
                tileSize: 512,
                zoomOffset: -1,
                maxZoom: 19,
                attribution: '© <a href="https://www.mapbox.com/" target="_blank">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            }
        );
    }

    /* ================= PARTÍCULAS EN CANVAS ================= */
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let resizeTimeout;
    window.addEventListener('resize', function(){
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }, 200); 
    });

    class Particle {
        constructor(){
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() * 0.5) - 0.25;
            this.speedY = (Math.random() * 0.5) - 0.25;
            this.color = Math.random() > 0.5 ? 'rgba(6, 177, 203, 0.6)' : 'rgba(126, 219, 232, 0.4)';
        }
        update(){
            this.x += this.speedX;
            this.y += this.speedY;
            if(this.x > canvas.width) this.x = 0;
            else if(this.x < 0) this.x = canvas.width;
            if(this.y > canvas.height) this.y = 0;
            else if(this.y < 0) this.y = canvas.height;
        }
        draw(){
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles(){
        particlesArray = [];
        // OPTIMIZACIÓN: Límite máximo de 100 partículas para no saturar la CPU
        let numberOfParticles = Math.min((canvas.width * canvas.height) / 9000, 100); 
        for(let i=0; i<numberOfParticles; i++){
            particlesArray.push(new Particle());
        }
    }

    function animateParticles(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let i=0; i<particlesArray.length; i++){
            particlesArray[i].update();
            particlesArray[i].draw();
            
            for(let j=i; j<particlesArray.length; j++){
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if(distance < 100){
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(6, 177, 203, ${0.1 - distance/1000})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    initParticles();
    animateParticles();

    /* ================= PARALLAX MOUSE MOVE ================= */
    document.addEventListener('mousemove', function(e) {
        const layers = document.querySelectorAll('.parallax-layer');
        const x = (e.clientX - window.innerWidth / 2) / 100;
        const y = (e.clientY - window.innerHeight / 2) / 100;
        
        layers.forEach(layer => {
            const speed = layer.getAttribute('data-speed');
            layer.style.transform = `translateX(${x * speed}px) translateY(${y * speed}px)`;
        });
    });

    /* ================= NAVEGACIÓN VISTAS ================= */
    function switchView(viewId) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // Mostrar la vista seleccionada
        const vistaActiva = document.getElementById(viewId);
        if(vistaActiva) vistaActiva.classList.add('active');

        // Disparadores específicos por vista
        if (viewId === 'view-education') {
            // Inicializamos o redimensionamos los mapas de la base de conocimiento
            setTimeout(() => {
                inicializarMapaDepartamentos();
                inicializarMapaSismico();
            }, 300); // Pequeño retraso para que la animación CSS de la vista termine
        }

        if (viewId === 'view-control') {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        }
    }

    function switchTab(tabId, element) {
        document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        element.classList.add('active');
        
        if (tabId === 'tab-gps') {
            if (!map) {
                iniciarRastreoGPS();
            } else {
                setTimeout(() => { map.invalidateSize(); }, 200);
            }
        }
        if (tabId === 'tab-sismos') {
            if (!mapSismico) {
                inicializarMapaSismico();
            } else {
                setTimeout(() => { mapSismico.invalidateSize(); }, 200);
            }
        }
    }

    /* ================= LÓGICA ESP32 / SIMULACIÓN ================= */
    let simInterval;
    function toggleESP32Mode() {
        const isReal = document.getElementById('esp32-toggle').checked;
        const controls = document.querySelectorAll('.sim-control');
        const statusBadge = document.getElementById('conn-status');

        if (isReal) {
            document.getElementById('label-sim').style.color = 'var(--text-dark)';
            document.getElementById('label-real').style.color = 'var(--accent)';
            document.getElementById('label-real').style.textShadow = '0 0 10px var(--accent)';
            statusBadge.className = 'status-badge connected';
            statusBadge.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Buscando Nodo ESP32...';
            
            controls.forEach(c => { c.disabled = true; });
            showTempHint("Enlace físico iniciado. Aguardando telemetría...");
            
            setTimeout(() => {
                if(document.getElementById('esp32-toggle').checked) {
                    statusBadge.innerHTML = '<i class="fa-solid fa-link"></i> Enlace Seguro Activo';
                    showTempHint("Telemetría encriptada recibiendo...");
                    simInterval = setInterval(() => {
                        if(!document.getElementById('esp32-toggle').checked) { clearInterval(simInterval); return; }
                        const rx = Math.floor(Math.random() * 30) - 15;
                        const ry = Math.floor(Math.random() * 30) - 15;
                        aplicarRotacionMPU(rx, ry);
                    }, 600);
                }
            }, 1500);

        } else {
            document.getElementById('label-real').style.color = 'var(--light-2)';
            document.getElementById('label-real').style.textShadow = 'none';
            document.getElementById('label-sim').style.color = 'var(--text-main)';
            statusBadge.className = 'status-badge';
            statusBadge.innerHTML = '<i class="fa-solid fa-wifi"></i> Nodo Aislado (Local)';
            
            controls.forEach(c => { c.disabled = false; });
            clearInterval(simInterval);
            showTempHint("Modo simulación restaurado.");
        }
    }

    function aplicarRotacionMPU(x, y) {
        document.getElementById('ui-mpu-x').innerText = x;
        document.getElementById('ui-mpu-y').innerText = y;
        document.getElementById('cube-3d').style.transform = `rotateX(${-x}deg) rotateY(${y}deg)`;
        document.getElementById('slider-x').value = x;
        document.getElementById('slider-y').value = y;
    }

    function updateMPU() { 
        const x = document.getElementById('slider-x').value;
        const y = document.getElementById('slider-y').value;
        aplicarRotacionMPU(x, y);
    }

    let isObstacle = false;
    function togglePIR() {
        isObstacle = !isObstacle;
        const uiStatus = document.getElementById('ui-pir-status');
        if(isObstacle) {
            uiStatus.className = 'pir-status alerta';
            uiStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ¡ALERTA: Objeto en Perímetro!';
        } else {
            uiStatus.className = 'pir-status libre';
            uiStatus.innerHTML = '<i class="fa-solid fa-shield-check"></i> Perímetro Seguro';
        }
    }

    let servoAngle = 90;
    function moveServo(amount) {
        servoAngle += amount;
        if(servoAngle > 180) servoAngle = 180;
        if(servoAngle < 0) servoAngle = 0;
        document.getElementById('ui-servo-angle').innerText = servoAngle;
    }

    function toggleAutopilot() {
        const btn = document.getElementById('btn-autopilot');
        btn.classList.toggle('btn-outline');
        if(!btn.classList.contains('btn-outline')) {
            btn.style.background = 'rgba(46, 196, 182, 0.2)'; btn.style.color = 'var(--accent)'; btn.style.borderColor = 'var(--accent)'; btn.style.boxShadow = '0 0 15px rgba(46, 196, 182, 0.4)';
            btn.innerHTML = '<i class="fa-solid fa-microchip"></i> Rutina Automática Ejecutando';
        } else {
            btn.style = '';
            btn.innerHTML = '<i class="fa-solid fa-brain"></i> IA Piloto Autónomo';
        }
    }

    /* ================= EDU Y CHAT ================= */
    function toggleEduCard(btn) {
        const card = btn.parentElement;
        const isExpanded = card.classList.contains('active-card');
        document.querySelectorAll('.edu-card').forEach(c => {
            c.classList.remove('active-card');
            c.querySelector('.btn-expand').innerHTML = 'Desencriptar Datos <i class="fa-solid fa-chevron-down" style="margin-left: 5px;"></i>';
        });
        if (!isExpanded) {
            card.classList.add('active-card');
            btn.innerHTML = 'Ocultar Datos <i class="fa-solid fa-chevron-up" style="margin-left: 5px;"></i>';
        }
    }

    function toggleChat() {
        document.getElementById('chat-window').classList.toggle('open');
        document.getElementById('bubble-hint').classList.remove('show');
    }

    function showTempHint(text) {
        const hint = document.getElementById('bubble-hint');
        hint.innerText = text;
        hint.classList.add('show');
        setTimeout(() => { hint.classList.remove('show'); }, 4000);
    }

    function sendMessage() {
        const input = document.getElementById('chat-input-text');
        const text = input.value.trim();
        if(!text) return;
        addMsgToChat('user', text);
        input.value = '';
        setTimeout(() => {
            addMsgToChat('bot', "Comando recibido. Analizando petición a través de los nodos de datos de TEOS...");
        }, 600);
    }

    function addMsgToChat(sender, text) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}`;
        msgDiv.innerText = text;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    // Escuchamos el enter para el chat si el elemento existe
    document.addEventListener('DOMContentLoaded', () => {
        const chatInputText = document.getElementById('chat-input-text');
        if (chatInputText) {
            chatInputText.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') sendMessage();
            });
        }
    });

    /* ================= MAPA Y GPS ================= */
    let map;
    let robotMarker;
    let flotasActivas = []; 
    const coloresUnidad = ['#06B1CB', '#f59e0b', '#7d2ae8']; 
    const nombresUnidad = ['A1', 'B2', 'C4'];

    function iniciarRastreoGPS() {
        document.getElementById('gps-coords').innerText = "Estableciendo enlace...";
        
        let lat = -5.0911322; 
        let lng = -81.0928731;
        
        document.getElementById('gps-coords').innerText = `Coord Base: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        if (!map) {
            map = L.map('map').setView([lat, lng], 14);
            crearCapaMapaOscuro().addTo(map);

            const robotIcon = L.divIcon({ 
                className: 'custom-div-icon', 
                html: "<div style='background:var(--accent);width:18px;height:18px;border-radius:50%;box-shadow:0 0 20px var(--accent); border:2px solid white;'></div>", 
                iconSize: [18, 18], 
                iconAnchor: [9, 9] 
            });
            
            robotMarker = L.marker([lat, lng], {icon: robotIcon}).addTo(map)
                .bindPopup('<b style="color:#ffffff">Nodo Central (Origen)</b>').openPopup();

            map.on('click', async function(e) {
                if (!robotMarker) {
                    robotMarker = L.marker([lat, lng], {icon: robotIcon}).addTo(map)
                        .bindPopup('<b style="color:#ffffff">Nodo Central (Origen)</b>');
                }
                if (flotasActivas.length >= 3) {
                    showTempHint("Límite máximo de 3 unidades en campo.");
                    return;
                }

                const idActual = flotasActivas.length; 
                const color = coloresUnidad[idActual];
                const nombre = nombresUnidad[idActual];

                showTempHint(`Calculando vector para Unidad ${nombre}...`);

                // Registro inicial de la unidad
                const flotaItem = {
                    id: idActual,
                    color: color,
                    nombre: nombre,
                    lineaRuta: null,
                    destMarker: null,
                    markerAnimado: null,
                    timer: null
                };
                flotasActivas.push(flotaItem);

                const origenLatLng = robotMarker.getLatLng();
                const destLatLng = e.latlng;

                // 1. Marcador del objetivo en el mapa
                const destIcon = L.divIcon({ 
                    className: 'custom-div-icon', 
                    html: `<div style='background:${color};width:14px;height:14px;border-radius:0%;box-shadow:0 0 15px ${color}; border:2px solid white; transform: rotate(45deg);'></div>`, 
                    iconSize: [14, 14], 
                    iconAnchor: [7, 7] 
                });
                const destMarker = L.marker(destLatLng, {icon: destIcon}).addTo(map)
                    .bindPopup(`<b style='color:#ffffff'>Destino Unidad ${nombre}</b>`); 
                flotaItem.destMarker = destMarker;

                // 2. Consulta de ruta real por carreteras con Mapbox Directions API
                let coordenadasRuta = [];
                let distanciaKm = "0.00";
                let tiempoMin = 1;

                try {
                    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origenLatLng.lng},${origenLatLng.lat};${destLatLng.lng},${destLatLng.lat}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;
                    const res = await fetch(directionsUrl);
                    const data = await res.json();

                    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                        const r = data.routes[0];
                        distanciaKm = (r.distance / 1000).toFixed(2);
                        tiempoMin = Math.max(1, Math.round(r.duration / 60));
                        // Convertir formato [lng, lat] de Mapbox a [lat, lng] de Leaflet
                        coordenadasRuta = r.geometry.coordinates.map(pt => [pt[1], pt[0]]);
                    } else {
                        throw new Error("Sin carreteras disponibles en la coordenada");
                    }
                } catch (errRouting) {
                    console.warn(`Mapbox no pudo calcular ruta vial para Unidad ${nombre}. Activando vector directo de emergencia.`, errRouting);
                    const distMetros = origenLatLng.distanceTo(destLatLng);
                    distanciaKm = (distMetros / 1000).toFixed(2);
                    tiempoMin = Math.max(1, Math.round((distMetros / 1000) / 45 * 60)); // ~45 km/h
                    const steps = 60;
                    coordenadasRuta = [];
                    for (let s = 0; s <= steps; s++) {
                        const ratio = s / steps;
                        coordenadasRuta.push([
                            origenLatLng.lat + (destLatLng.lat - origenLatLng.lat) * ratio,
                            origenLatLng.lng + (destLatLng.lng - origenLatLng.lng) * ratio
                        ]);
                    }
                }

                // 3. Trazar línea de trayectoria en el mapa
                const lineaRuta = L.polyline(coordenadasRuta, {
                    color: color,
                    weight: 4,
                    opacity: 0.85
                }).addTo(map);
                flotaItem.lineaRuta = lineaRuta;

                // 4. Actualizar tarjeta UI correspondiente
                const uiPanel = document.getElementById(`ruta-${idActual + 1}`);
                if (uiPanel) {
                    uiPanel.classList.add('activa');
                    uiPanel.classList.remove('libre');
                    uiPanel.innerHTML = `
                        <strong style="color:${color}">Unidad ${nombre}</strong>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <span><i class="fa-solid fa-route"></i> Distancia: ${distanciaKm} km</span>
                            <span><i class="fa-solid fa-stopwatch"></i> ETA: <span id="eta-${idActual}">${tiempoMin} min</span></span>
                            <span style="color:var(--accent); font-weight:500;"><i class="fa-solid fa-truck-fast"></i> En tránsito...</span>
                        </div>
                    `;
                }

                // 5. Iniciar animación de avance del vehículo
                simularVehiculo(coordenadasRuta, idActual, color, nombre, uiPanel);
            });
        } else {
            map.setView([lat, lng], 14);
        }
        showTempHint("Centro de Operaciones en línea.");
        setTimeout(() => { map.invalidateSize(); }, 200);
    }

    function simularVehiculo(coordenadas, id, color, nombre, uiPanel) {
        if (!coordenadas || coordenadas.length === 0) return;
        let index = 0;
        const paso = Math.max(1, Math.round(coordenadas.length / 70));

        const vehiculoIcon = L.divIcon({
            className: 'bot-marker',
            html: `<i class="fa-solid fa-location-crosshairs" style="color:${color}; font-size: 1.5rem;"></i>`,
            iconSize: [20, 20], 
            iconAnchor: [10, 10]
        });

        const vehiculo = L.marker(coordenadas[0], {icon: vehiculoIcon}).addTo(map);
        if (flotasActivas[id]) {
            flotasActivas[id].markerAnimado = vehiculo;
        }

        const timer = setInterval(() => {
            index += paso; 
            if (index >= coordenadas.length) {
                clearInterval(timer);
                vehiculo.setLatLng(coordenadas[coordenadas.length - 1]);
                
                if (uiPanel) {
                    uiPanel.classList.remove('activa');
                    uiPanel.classList.add('completada');
                    uiPanel.innerHTML = `
                        <strong style="color:${color}">Unidad ${nombre}</strong>
                        <span style="color:var(--accent); font-weight:500;"><i class="fa-solid fa-circle-check"></i> Ruta completada</span>
                    `;
                }
            } else {
                vehiculo.setLatLng(coordenadas[index]);
            }
        }, 80);

        if (flotasActivas[id]) {
            flotasActivas[id].timer = timer;
        }
    }

    function limpiarRutas() {
        flotasActivas.forEach(flota => {
            if (flota.lineaRuta) {
                try { map.removeLayer(flota.lineaRuta); } catch(e){}
            }
            if (flota.destMarker) {
                try { map.removeLayer(flota.destMarker); } catch(e){}
            }
            if (flota.markerAnimado) {
                try { map.removeLayer(flota.markerAnimado); } catch(e){}
            }
            if (flota.control) {
                try { map.removeControl(flota.control); } catch(e){}
            }
            if (flota.timer) clearInterval(flota.timer);
        });
        flotasActivas = [];
        
        for (let i = 1; i <= 3; i++) {
            const panel = document.getElementById(`ruta-${i}`);
            if (panel) {
                panel.className = 'ruta-info libre';
                panel.innerHTML = `<strong>Unidad ${nombresUnidad[i-1]}</strong> <span class="status">Esperando coordenadas...</span>`;
            }
        }
        showTempHint("Rutas canceladas. Mapa limpio.");
    }

    /* ================= GRÁFICO CIRCULAR DOUGHNUT (CHART.JS) ================= */
    let miGraficoDona; 

    const datosPorRegion = {
        "Lima": [62.5, 23.0, 14.5], "Amazonas": [35.0, 20.0, 45.0], "Ancash": [40.0, 45.5, 14.5],
        "Apurimac": [30.0, 50.0, 20.0], "Arequipa": [55.0, 30.0, 15.0], "Ayacucho": [42.0, 38.0, 20.0],
        "Cajamarca": [38.0, 22.0, 40.0], "Callao": [80.0, 10.0, 10.0], "Cusco": [30.0, 40.0, 30.0],
        "Huancavelica": [25.0, 55.0, 20.0], "Huanuco": [45.0, 35.0, 20.0], "Ica": [50.0, 35.0, 15.0],
        "Junin": [48.0, 32.0, 20.0], "La Libertad": [70.0, 15.0, 15.0], "Lambayeque": [65.0, 15.0, 20.0],
        "Loreto": [40.0, 10.0, 50.0], "Madre de Dios": [55.0, 15.0, 30.0], "Moquegua": [30.0, 50.0, 20.0],
        "Pasco": [35.0, 45.0, 20.0], "Piura": [60.0, 20.0, 20.0], "Puno": [45.0, 25.0, 30.0],
        "San Martin": [38.0, 12.0, 50.0], "Tacna": [48.0, 32.0, 20.0], "Tumbes": [72.0, 10.0, 18.0],
        "Ucayali": [50.0, 15.0, 35.0]
    };

    window.addEventListener('load', function() {
        if(typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
            const elCanvas = document.getElementById('apiDoughnutChart');
            if(elCanvas) {
                const ctxDoughnut = elCanvas.getContext('2d');
                miGraficoDona = new Chart(ctxDoughnut, {
                    type: 'doughnut',
                    data: {
                        labels: ['Inseguridad Ciudadana', 'Alerta Sismológica', 'Espectros Visuales'],
                        datasets: [{
                            data: [...datosPorRegion["Lima"]], 
                            backgroundColor: ['#ef4444', '#06B1CB', '#2EC4B6'],
                            borderColor: 'rgba(30, 58, 95, 0.8)',
                            borderWidth: 2,
                            hoverOffset: 12
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, cutout: '65%',
                        plugins: {
                            legend: { display: false },
                            datalabels: {
                                color: '#FFFFFF', font: { family: 'Outfit', size: 14, weight: '600' },
                                formatter: (value) => value.toFixed(1) + '%',
                                textShadowBlur: 5, textShadowColor: 'rgba(0,0,0,0.8)'
                            },
                            tooltip: {
                                backgroundColor: 'rgba(30, 58, 95, 0.9)', titleFont: { family: 'Outfit', size: 14 },
                                bodyFont: { family: 'Outfit', size: 13 }, padding: 12,
                                borderColor: 'rgba(6, 177, 203, 0.5)', borderWidth: 1,
                                callbacks: {
                                    label: function(context) { return ' ' + context.label + ': ' + context.parsed + '%'; }
                                }
                            }
                        }
                    }
                });
            }
        }
    });

    function actualizarGraficoPorRegion() {
    const regionSeleccionada = document.getElementById('region-selector').value;
    const nuevosDatos = datosPorRegion[regionSeleccionada];

    if (nuevosDatos) {
        // 1. Actualizar los textos de las tarjetas
        document.getElementById('pct-inseguridad').innerText = nuevosDatos[0].toFixed(1) + '%';
        document.getElementById('pct-sismologica').innerText = nuevosDatos[1].toFixed(1) + '%';
        document.getElementById('pct-visuales').innerText = nuevosDatos[2].toFixed(1) + '%';
        
        // 2. Refrescar el mapa de calor por si los datos cambiaron
        if (typeof actualizarColoresMapa === "function") {
            actualizarColoresMapa();
        }
        
        if (typeof showTempHint === "function") {
            showTempHint(`Cargando métricas NLP para la región: ${regionSeleccionada}`);
        }
    }
}

    /* ================= WEB SCRAPING IGP / FALLBACK ================= */
    let mapSismico = null;
    let capasIGP = [];

    function inicializarMapaSismico() {
        if (!mapSismico) {
            mapSismico = L.map('mapa-sismico').setView([-9.19, -75.01], 5);
            crearCapaMapaOscuro().addTo(mapSismico);
            hacerWebScrapingIGP(); 
        }
        setTimeout(() => { mapSismico.invalidateSize(); }, 300);
    }

    async function hacerWebScrapingIGP() {
        try {
            const proxy = 'https://api.allorigins.win/get?url=';
            const igpJSONUrl = encodeURIComponent('https://ultimosismo.igp.gob.pe/api/sismos-recientes');
            let sismosExtraidos = [];

            // Agregamos un controlador de tiempo para evitar que la página se quede colgada
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5 segundos de espera máxima para el proxy

            try {
                // Intentamos obtener los datos del IGP con el límite de tiempo
                const resAPI = await fetch(proxy + igpJSONUrl, { signal: controller.signal });
                clearTimeout(timeoutId); // Si responde a tiempo, cancelamos el cronómetro
                const dataAPI = await resAPI.json();
                
                if (dataAPI.contents && dataAPI.contents.includes('<html')) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(dataAPI.contents, "text/html");
                    
                    const filas = doc.querySelectorAll('table tr');
                    if (filas.length < 2) throw new Error("Estructura de tabla IGP no encontrada.");
                    
                    filas.forEach((fila, i) => {
                        if(i === 0) return; 
                        const celdas = fila.querySelectorAll('td');
                        if(celdas.length >= 6) {
                            sismosExtraidos.push({
                                fecha: celdas[0].innerText.trim(),
                                hora: celdas[1].innerText.trim(),
                                mag: parseFloat(celdas[2].innerText),
                                profundidad: celdas[3].innerText.trim(),
                                referencia: celdas[5].innerText.trim(),
                                lat: parseFloat(celdas[4].innerText.split(',')[0]) || null,
                                lng: parseFloat(celdas[4].innerText.split(',')[1]) || null
                            });
                        }
                    });
                    
                    if(sismosExtraidos.length > 0 && sismosExtraidos[0].lat == null) {
                        throw new Error("HTML parseado pero sin coordenadas visibles.");
                    }

                } else if (dataAPI.contents) {
                    const obj = JSON.parse(dataAPI.contents);
                    if(Array.isArray(obj)) {
                        sismosExtraidos = obj.map(s => ({
                            fecha: s.fecha, hora: s.hora, mag: parseFloat(s.magnitud), 
                            profundidad: s.profundidad + ' km', referencia: s.referencia,
                            lat: parseFloat(s.latitud), lng: parseFloat(s.longitud)
                        }));
                    } else {
                        throw new Error("JSON del IGP desconocido.");
                    }
                } else {
                    throw new Error("Respuesta vacía del proxy.");
                }

            } catch(scrapeError) {
                // Si el proxy falla o se acaba el tiempo de 3.5 segundos, entramos al Fallback instantáneo
                console.warn("Proxy de IGP demoró demasiado o falló. Activando conexión directa con USGS para Perú.", scrapeError);
                
                // API de USGS buscando eventos recientes en la zona geográfica de Perú
                const usgsURL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-19.0&maxlatitude=0.0&minlongitude=-82.0&maxlongitude=-68.0&orderby=time&limit=15';
                
                const resUSGS = await fetch(usgsURL);
                const usgsData = await resUSGS.json();
                
                sismosExtraidos = usgsData.features.map(f => {
                    const dateObj = new Date(f.properties.time);
                    return {
                        fecha: dateObj.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' }),
                        hora: dateObj.toLocaleTimeString('es-PE', { hour12: false }),
                        mag: parseFloat(f.properties.mag),
                        profundidad: Math.round(f.geometry.coordinates[2]) + ' km',
                        referencia: f.properties.place.replace(' of ', ' de ').replace('Peru', 'Perú'),
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0]
                    };
                });
            }

            if(sismosExtraidos.length > 0) {
                renderizarUI(sismosExtraidos);
            } else {
                document.getElementById('ultimo-sismo-card').innerHTML = '<div style="color:#ef4444;text-align:center;">No hay datos sísmicos disponibles.</div>';
            }

        } catch (errorFatal) {
            console.error("Error fatal en conectividad:", errorFatal);
            document.getElementById('ultimo-sismo-card').innerHTML = '<div style="color:#ef4444;text-align:center;"><i class="fa-solid fa-wifi" style="font-size:2rem;margin-bottom:10px;"></i><br>Error de red al consultar APIs.</div>';
        }
    }

    function renderizarUI(listaSismos) {
    const tablaBody = document.getElementById('tabla-igp-body');
    const tarjetaUltimo = document.getElementById('ultimo-sismo-card');
    
    tablaBody.innerHTML = "";
    capasIGP.forEach(m => mapSismico.removeLayer(m));
    capasIGP = [];

    const u = listaSismos[0];
    const esCritico = u.mag >= 5.0;
    const colorAlerta = esCritico ? '#ef4444' : 'var(--accent)';
    
    const tsunamiHtml = u.mag >= 7.0 
        ? `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; padding: 12px; border-radius: 8px; font-weight: 600; text-align: center; margin-top: 15px; animation: pulseGlow 1.5s infinite;">
            <i class="fa-solid fa-water"></i> ALERTA DE TSUNAMI ACTIVA
        </div>`
        : `<div style="color: var(--light-2); font-size: 0.85rem; text-align: center; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
            <i class="fa-solid fa-check"></i> Sin anomalías en el nivel del mar.
        </div>`;

    tarjetaUltimo.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; padding: 10px;">
            <div style="min-width: 85px; height: 85px; border-radius: 50%; border: 3px solid ${colorAlerta}; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 700; color: ${colorAlerta}; box-shadow: 0 0 20px ${colorAlerta}40; text-shadow: 0 0 10px ${colorAlerta};">
                ${u.mag.toFixed(1)}
            </div>
            <div style="flex: 1;">
                <div style="font-size: 1.1rem; color: var(--text-main); font-weight: 500; line-height: 1.3;">${u.referencia}</div>
                <div style="color: var(--light-1); font-size: 0.95rem; margin-top: 8px;"><i class="fa-solid fa-ruler-vertical"></i> Profundidad: ${u.profundidad}</div>
                <div style="color: var(--light-2); font-size: 0.85rem; margin-top: 4px;"><i class="fa-regular fa-calendar"></i> ${u.fecha} <i class="fa-regular fa-clock" style="margin-left:8px;"></i> ${u.hora}</div>
            </div>
        </div>
        ${tsunamiHtml}
    `;

    // APLICAMOS EL CORTE: .slice(0, 5) para tomar solo los primeros 5 sismos
    listaSismos.slice(0, 5).forEach((sismo, index) => {
        const color = sismo.mag >= 5.0 ? '#ef4444' : (sismo.mag >= 4.0 ? '#f59e0b' : 'var(--primary)');
        const radioMap = Math.max(14, sismo.mag * 4.5);

        const fila = document.createElement('tr');
        fila.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
        fila.style.cursor = "pointer";
        fila.style.transition = "0.2s";
        
        fila.onmouseenter = () => fila.style.background = "rgba(6, 177, 203, 0.15)";
        fila.onmouseleave = () => fila.style.background = "transparent";
        fila.onclick = () => {
            mapSismico.setView([sismo.lat, sismo.lng], 9);
        };

        // Reducimos las columnas para que encaje visualmente en el panel lateral
        fila.innerHTML = `
            <td style="padding: 10px 5px;">${sismo.fecha}<br><span style="font-size:0.75rem; color:var(--light-2);">${sismo.hora}</span></td>
            <td style="padding: 10px 5px; font-weight:600; color:${color};">${sismo.mag.toFixed(1)}</td>
            <td style="padding: 10px 5px;">${sismo.profundidad}</td>
            <td style="padding: 10px 5px; font-size:0.8rem;">${sismo.referencia}</td>
        `;
        tablaBody.appendChild(fila);

        const htmlIcon = `<div style="background:${color}; width:${radioMap}px; height:${radioMap}px; border-radius:50%; border: 2px solid white; opacity:0.8; box-shadow: 0 0 20px ${color};"></div>`;
        const divIcon = L.divIcon({ className: 'custom-div-icon', html: htmlIcon, iconSize: [radioMap, radioMap], iconAnchor: [radioMap/2, radioMap/2] });

        const marker = L.marker([sismo.lat, sismo.lng], {icon: divIcon}).addTo(mapSismico)
            .bindPopup(`
                <div style="font-family:'Outfit'; font-size: 0.9rem; color: var(--secondary-2); min-width: 200px;">
                    <b style="font-size: 1.2rem; color: ${color};">Magnitud ${sismo.mag.toFixed(1)}</b><br>
                    <b style="color: #1E3A5F; display: block; margin-top: 5px;">${sismo.referencia}</b>
                    <hr style="border: 0; border-top: 1px solid #ccc; margin: 8px 0;">
                    <b>Profundidad:</b> ${sismo.profundidad}<br>
                    <b>Hora:</b> ${sismo.fecha} - ${sismo.hora}
                </div>
            `);
            
        if(index === 0) {
            marker.openPopup();
            mapSismico.setView([sismo.lat, sismo.lng], 7); 
        }
        capasIGP.push(marker);
    });
}

    /* ================= AULA VIRTUAL Y JUEGOS ================= */
    function iniciarModulo(modulo) {
    const contenedor = document.getElementById('contenedor-interactivo');
    contenedor.style.display = 'block';
    contenedor.style.animation = 'fadeIn 0.5s ease';
    contenedor.innerHTML = '';

    if (modulo === 'anatomia') {
        contenedor.innerHTML = `
            <style>
                .esquema-teos { position: relative; width: 100%; max-width: 320px; height: 420px; margin: 0 auto; border: 2px dashed var(--glass-border); border-radius: 20px; background: rgba(30, 58, 95, 0.2); box-shadow: inset 0 0 30px rgba(0,0,0,0.5); }
                .componente { position: absolute; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column; cursor: pointer; transition: 0.3s; color: var(--light-1); backdrop-filter: blur(5px); }
                .componente:hover, .componente.activo { background: rgba(6, 177, 203, 0.2); border-color: var(--primary); box-shadow: 0 0 20px rgba(6, 177, 203, 0.5); transform: scale(1.05); color: #fff; z-index: 10; }
                .comp-pir { top: 20px; left: 50%; transform: translateX(-50%); width: 140px; height: 70px; border-color: rgba(239, 68, 68, 0.4); }
                .comp-pir:hover { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.15);}
                .comp-esp32 { top: 110px; left: 50%; transform: translateX(-50%); width: 160px; height: 160px; border-color: rgba(46, 196, 182, 0.4); }
                .comp-esp32:hover { border-color: var(--accent); box-shadow: 0 0 20px rgba(46, 196, 182, 0.5); background: rgba(46, 196, 182, 0.15);}
                .comp-mpu { top: 290px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; border-color: rgba(245, 158, 11, 0.4); }
                .comp-mpu:hover { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); background: rgba(245, 158, 11, 0.15);}
                .comp-motor-l { top: 110px; left: -20px; width: 60px; height: 280px; border-radius: 30px; }
                .comp-motor-r { top: 110px; right: -20px; width: 60px; height: 280px; border-radius: 30px; }
                .info-panel-box { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 30px; height: 100%; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; justify-content: center; }
                .cable { position: absolute; background: rgba(255,255,255,0.1); z-index: 0; }
                .cable-1 { width: 2px; height: 20px; left: 50%; top: 90px; }
                .cable-2 { width: 2px; height: 20px; left: 50%; top: 270px; }
            </style>
            <div class="card glass-panel" style="border-color: var(--light-1);">
                <div class="card-header" style="color: var(--light-1);"><i class="fa-solid fa-microchip"></i> Vista de Rayos X: Arquitectura Hardware</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center; padding: 20px 0;">
                    <div style="padding: 20px;">
                        <div class="esquema-teos">
                            <div class="cable cable-1"></div>
                            <div class="cable cable-2"></div>
                            <div class="componente comp-motor-l" onmouseover="mostrarInfoTEOS('motor')" onclick="mostrarInfoTEOS('motor')"><i class="fa-solid fa-gear fa-spin" style="margin-bottom: 80px; --fa-animation-duration: 4s;"></i><i class="fa-solid fa-truck-monster"></i></div>
                            <div class="componente comp-motor-r" onmouseover="mostrarInfoTEOS('motor')" onclick="mostrarInfoTEOS('motor')"><i class="fa-solid fa-gear fa-spin" style="margin-bottom: 80px; --fa-animation-duration: 4s; animation-direction: reverse;"></i><i class="fa-solid fa-truck-monster"></i></div>
                            <div class="componente comp-pir" onmouseover="mostrarInfoTEOS('pir')" onclick="mostrarInfoTEOS('pir')"><i class="fa-solid fa-radar" style="font-size: 1.5rem; margin-bottom: 5px; color: #ef4444;"></i><span style="font-size: 0.8rem; font-weight: 500;">Módulo PIR / Ultra</span></div>
                            <div class="componente comp-esp32" onmouseover="mostrarInfoTEOS('esp32')" onclick="mostrarInfoTEOS('esp32')"><i class="fa-solid fa-microchip" style="font-size: 3rem; margin-bottom: 10px; color: var(--accent); text-shadow: 0 0 15px var(--accent);"></i><span style="font-weight: 700; letter-spacing: 1px;">ESP32 CORE</span><span style="font-size: 0.7rem; color: var(--light-2); margin-top: 5px;">Wi-Fi / BT</span></div>
                            <div class="componente comp-mpu" onmouseover="mostrarInfoTEOS('mpu')" onclick="mostrarInfoTEOS('mpu')"><i class="fa-solid fa-cube" style="font-size: 1.8rem; margin-bottom: 5px; color: #f59e0b;"></i><span style="font-size: 0.85rem; font-weight: 500;">MPU-6050</span></div>
                        </div>
                    </div>
                    <div class="info-panel-box" id="info-rayosx">
                        <div style="text-align: center; color: var(--light-2);">
                            <i class="fa-solid fa-hand-pointer" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                            <h3 style="font-size: 1.5rem; margin-bottom: 15px; font-weight: 500;">Escáner Inactivo</h3>
                            <p style="font-weight: 300; line-height: 1.6; max-width: 300px; margin: 0 auto;">Pasa el cursor o presiona los componentes del diagrama para interceptar la telemetría y ver sus especificaciones.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (modulo === 'informacion') {
        contenedor.innerHTML = `
            <div class="card glass-panel" style="border-color: rgba(239,68,68,0.3); animation: slideUp 0.5s ease;">
                <div class="card-header" style="color: #ef4444; font-size: 1.4rem; justify-content: center; border-bottom: 1px solid rgba(239,68,68,0.2); padding-bottom: 20px;">
                    <i class="fa-solid fa-file-contract"></i> TEOS: Fundamentos y Base Teórica
                </div>
                
                <div style="padding: 30px 20px; line-height: 1.8; color: var(--light-2); font-weight: 300;">
                    
                    <div style="margin-bottom: 40px; background: rgba(0,0,0,0.2); padding: 25px; border-radius: 12px; border-left: 4px solid #ef4444;">
                        <h3 style="color: var(--text-main); margin-bottom: 15px; font-size: 1.3rem;"><i class="fa-solid fa-robot" style="color: #ef4444; margin-right: 10px;"></i> 1. Descripción del Proyecto</h3>
                        <p style="font-size: 1.05rem; margin-bottom: 15px;"><strong>TEOS</strong> es un asistente robótico diseñado para convivir en los barrios, cuidando a los vecinos y enseñando sobre prevención.</p>
                        <ul style="padding-left: 20px; font-size: 0.95rem; margin-bottom: 0;">
                            <li style="margin-bottom: 8px;">Es controlado por un ESP32 Devkit y realiza patrullajes de forma autónoma.</li>
                            <li style="margin-bottom: 8px;">Si detecta un peligro, cambia su comportamiento para alertar a la comunidad.</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 40px;">
                        <h3 style="color: var(--text-main); margin-bottom: 15px; font-size: 1.3rem;"><i class="fa-solid fa-bullseye" style="color: #ef4444; margin-right: 10px;"></i> 2. Objetivos</h3>
                        <ul style="padding-left: 20px; font-size: 0.95rem;">
                            <li style="margin-bottom: 10px;"><strong>Promover la inclusión:</strong> Alertas para personas con discapacidad visual y auditiva.</li>
                            <li style="margin-bottom: 10px;"><strong>Mitigar el riesgo:</strong> Red de sensores y conexión satelital para evacuación.</li>
                            <li style="margin-bottom: 10px;"><strong>Continuidad operativa:</strong> Funcionamiento con alimentación solar.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        } else if (modulo === 'juegos') {
            window.menuJuegos();
        }
    }
    
    window.mostrarInfoTEOS = function(comp) {
        const panel = document.getElementById('info-rayosx');
        const db = {
            'esp32': { title: 'ESP32 (Cerebro Core)', icon: 'fa-microchip', color: 'var(--accent)', desc: 'Microcontrolador principal de 32 bits.', specs: ['CPU Dual-Core', 'WiFi / BT'] },
            'mpu': { title: 'MPU-6050 (Giroscopio)', icon: 'fa-cube', color: '#f59e0b', desc: 'Sensor inercial 3D.', specs: ['Acelerómetro 3 ejes', 'Giroscopio 3 ejes'] },
            'pir': { title: 'HC-SR501 / Radar (Ojos)', icon: 'fa-radar', color: '#ef4444', desc: 'Monitorea firmas térmicas.', specs: ['Rango: Hasta 7m', 'Ángulo: ~110°'] },
            'motor': { title: 'Sistema de Tracción', icon: 'fa-truck-monster', color: 'var(--light-1)', desc: 'Puente H de control de potencia.', specs: ['Control independiente', 'Soporte de voltaje'] }
        };

        const info = db[comp];
        panel.style.opacity = 0;
        
        setTimeout(() => {
            panel.innerHTML = `
                <h3 style="color: ${info.color}; margin-bottom: 15px; display: flex; align-items: center; gap: 12px; font-size: 1.6rem;">
                    <div style="background: ${info.color}20; padding: 10px; border-radius: 10px;"><i class="fa-solid ${info.icon}"></i></div> ${info.title}
                </h3>
                <p style="color: var(--text-main); font-weight: 300; line-height: 1.7; margin-bottom: 25px;">${info.desc}</p>
                <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; border-left: 3px solid ${info.color};">
                    <h4 style="color: var(--light-1); margin-bottom: 12px; font-size: 0.85rem;">Especificaciones:</h4>
                    <ul style="color: var(--light-2); font-weight: 300; padding-left: 20px;">
                        ${info.specs.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            `;
            panel.style.transition = 'opacity 0.3s ease';
            panel.style.opacity = 1;
        }, 150);
    }

    window.menuJuegos = function() {
        const contenedor = document.getElementById('contenedor-interactivo');
        contenedor.innerHTML = `
            <div class="card glass-panel" style="border-color: rgba(46,196,182,0.3); animation: slideUp 0.5s ease;">
                <div class="card-header" style="color: #2EC4B6; justify-content: center; border-bottom: 1px solid rgba(46,196,182,0.2); padding-bottom: 20px;">
                    <i class="fa-solid fa-gamepad"></i> Terminal Arcade TEOS
                </div>
                <div style="padding: 30px 20px; text-align: center; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    <div class="card glass-panel" style="flex: 1; min-width: 250px; cursor: pointer; border-color: var(--primary);" onclick="prepararTrivia()">
                        <i class="fa-solid fa-bolt" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 10px;">Trivia de Reacción</h3>
                    </div>
                    <div class="card glass-panel" style="flex: 1; min-width: 250px; cursor: pointer; border-color: #f59e0b;" onclick="iniciarSopaLetras()">
                        <i class="fa-solid fa-border-all" style="font-size: 3rem; color: #f59e0b; margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 10px;">Sopa de Letras</h3>
                    </div>
                </div>
            </div>
        `;
    }

    // === LÓGICA DE LA SOPA DE LETRAS ===
    window.iniciarSopaLetras = function() {
        const contenedor = document.getElementById('contenedor-interactivo');
        
        const size = 16; 
        const listaPalabras = [
            { id: 'word-sensor', text: 'SENSOR' }, { id: 'word-solar', text: 'SOLAR' },
            { id: 'word-esp', text: 'ESP' }, { id: 'word-pir', text: 'PIR' },
            { id: 'word-alarma', text: 'ALARMA' }, { id: 'word-mpu', text: 'MPU' },
            { id: 'word-led', text: 'LED' }, { id: 'word-silbato', text: 'SILBATO' },
            { id: 'word-linterna', text: 'LINTERNA' }, { id: 'word-vendas', text: 'VENDAS' },
            { id: 'word-mochila', text: 'MOCHILA' }, { id: 'word-botiquin', text: 'BOTIQUIN' },
            { id: 'word-agua', text: 'AGUA' }, { id: 'word-radio', text: 'RADIO' }
        ];

        let grid = Array(size * size).fill('');
        window.respuestasSopa = {};

        listaPalabras.forEach(palabra => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                let dir = Math.random() > 0.5 ? 1 : size; 
                let row = Math.floor(Math.random() * size);
                let col = Math.floor(Math.random() * size);
                let startIdx = row * size + col;

                if (dir === 1 && col + palabra.text.length > size) { attempts++; continue; }
                if (dir === size && row + palabra.text.length > size) { attempts++; continue; }

                let canPlace = true;
                let tempIndices = [];
                for (let i = 0; i < palabra.text.length; i++) {
                    let idx = startIdx + (i * dir);
                    if (grid[idx] !== '' && grid[idx] !== palabra.text[i]) {
                        canPlace = false;
                        break;
                    }
                    tempIndices.push(idx);
                }

                if (canPlace) {
                    for (let i = 0; i < palabra.text.length; i++) {
                        let idx = startIdx + (i * dir);
                        grid[idx] = palabra.text[i];
                    }
                    window.respuestasSopa[palabra.id] = tempIndices;
                    placed = true;
                }
                attempts++;
            }
        });

        const alfabeto = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        let gridHTML = '';
        for(let i=0; i<grid.length; i++) {
            if(grid[i] === '') grid[i] = alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
            gridHTML += `<div class="sl-cell" data-idx="${i}" onclick="toggleLetra(this)">${grid[i]}</div>`;
        }

        let palabrasHTML = '';
        listaPalabras.forEach(palabra => {
            palabrasHTML += `<div class="sl-word" id="${palabra.id}">${palabra.text}</div>`;
        });

        contenedor.innerHTML = `
            <style>
                .sl-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .sl-grid-wrapper { max-width: 100%; overflow-x: auto; padding-bottom: 10px; }
                .sl-grid { display: grid; grid-template-columns: repeat(16, 26px); gap: 3px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 12px; border: 1px solid var(--glass-border); box-shadow: inset 0 0 20px rgba(0,0,0,0.5); min-width: fit-content; margin: 0 auto;}
                .sl-cell { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 600; color: white; background: rgba(255,255,255,0.05); border-radius: 4px; cursor: pointer; user-select: none; transition: 0.2s; }
                .sl-cell:hover { background: rgba(6,177,203,0.3); transform: scale(1.1); }
                .sl-cell.selected { background: var(--accent); color: var(--secondary-2); box-shadow: 0 0 10px var(--accent); }
                .sl-words { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; width: 100%; max-width: 700px; margin-top: 15px; }
                .sl-word { background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 6px; font-weight: 300; font-size: 0.85rem; letter-spacing: 1px; color: var(--light-2); border-left: 3px solid #f59e0b; transition: 0.3s; text-align: center;}
                .sl-word.found { text-decoration: line-through; color: var(--accent); border-color: var(--accent); background: rgba(46,196,182,0.1); }
            </style>
            
            <div class="card glass-panel" style="border-color: #f59e0b; animation: slideUp 0.5s ease;">
                <div class="card-header" style="color: #f59e0b; justify-content: center; border-bottom: 1px solid rgba(245,158,11,0.2); padding-bottom: 20px; position: relative;">
                    <i class="fa-solid fa-border-all"></i> Sopa de Letras de Emergencia
                    <button class="btn btn-outline" style="position: absolute; left: 0; top: -5px; padding: 6px 12px; font-size: 0.75rem; border-color: rgba(255,255,255,0.2);" onclick="menuJuegos()">
                        <i class="fa-solid fa-arrow-left"></i> Volver
                    </button>
                </div>
                <div style="padding: 25px 15px; text-align: center;">
                    <div class="sl-container">
                        <div class="sl-grid-wrapper"><div class="sl-grid">${gridHTML}</div></div>
                        <div class="sl-words">${palabrasHTML}</div>
                    </div>
                    <div style="margin-top: 30px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                        <button class="btn" style="border-color: #f59e0b; color: #f59e0b; padding: 12px 30px;" onclick="verificarSopa()">Validar Selección</button>
                        <button class="btn btn-outline" style="padding: 12px 30px; border-color: rgba(255,255,255,0.2);" onclick="iniciarSopaLetras()">Nuevo Tablero</button>
                    </div>
                    <div id="sl-resultado" style="margin-top: 20px; font-weight: 500; font-size: 1.1rem; height: 30px;"></div>
                </div>
            </div>
        `;
    }

    window.toggleLetra = function(elemento) {
        elemento.classList.toggle('selected');
    }

    window.verificarSopa = function() {
        const seleccionadas = Array.from(document.querySelectorAll('.sl-cell.selected')).map(el => parseInt(el.dataset.idx));
        let todasEncontradas = true;

        for (const [wordId, indices] of Object.entries(window.respuestasSopa)) {
            const palabraEncontrada = indices.every(idx => seleccionadas.includes(idx));
            const wordElement = document.getElementById(wordId);
            
            if (palabraEncontrada) {
                wordElement.classList.add('found');
            } else {
                wordElement.classList.remove('found');
                todasEncontradas = false;
            }
        }

        const resultadoDiv = document.getElementById('sl-resultado');
        if (todasEncontradas) {
            const todosIndicesValidos = Object.values(window.respuestasSopa).flat();
            const extras = seleccionadas.filter(idx => !todosIndicesValidos.includes(idx));
            
            if(extras.length === 0) {
                resultadoDiv.innerHTML = '<span style="color: var(--accent);"><i class="fa-solid fa-unlock-keyhole"></i> ¡Excelente! Estás listo.</span>';
            } else {
                resultadoDiv.innerHTML = '<span style="color: #f59e0b;"><i class="fa-solid fa-circle-exclamation"></i> Tienes letras extra marcadas.</span>';
            }
        } else {
            resultadoDiv.innerHTML = '<span style="color: #ef4444;"><i class="fa-solid fa-magnifying-glass"></i> Aún faltan palabras por descubrir.</span>';
        }
    }

    // === LÓGICA DEL MINIJUEGO: TRIVIA TEOS ===
    window.preguntasTrivia = [
        { pregunta: "¿Qué microcontrolador actúa como el 'cerebro' principal del nodo TEOS?", opciones: ["Arduino Uno", "Raspberry Pi 4", "ESP32 Devkit", "Micro:bit"], correcta: 2 },
        { pregunta: "Durante un apagón masivo, TEOS activa su 'Modo Apagón'. ¿Qué acción realiza exactamente?", opciones: ["Se apaga para ahorrar batería", "Enciende luces LED de alta potencia como faro", "Emite una sirena de 120dB sin parar", "Se desconecta de la red Wi-Fi"], correcta: 1 },
        { pregunta: "¿Cuál es la función principal del sensor MPU-6050 en el robot?", opciones: ["Detectar sismos e inclinaciones", "Medir la temperatura ambiental", "Reconocer rostros", "Medir la distancia de los obstáculos"], correcta: 0 },
        { pregunta: "¿Cómo garantiza TEOS la inclusión de personas con discapacidad auditiva durante una emergencia?", opciones: ["Aumentando el volumen de la sirena", "Mediante luces estroboscópicas y textos en pantalla", "Llamándolos por teléfono móvil", "Desplegando un dron de asistencia"], correcta: 1 }
    ];

    window.preguntaActual = 0;
    window.puntajeTrivia = 0;

    window.prepararTrivia = function() {
        const contenedor = document.getElementById('contenedor-interactivo');
        contenedor.innerHTML = `<div class="card glass-panel" style="border-color: var(--primary);"><div id="trivia-container" style="padding: 20px; text-align: center;"></div></div>`;
        window.iniciarTrivia();
    }

    window.iniciarTrivia = function() {
        window.preguntaActual = 0;
        window.puntajeTrivia = 0;
        renderizarPregunta();
    }

    window.renderizarPregunta = function() {
        const container = document.getElementById('trivia-container');
        const preguntaData = window.preguntasTrivia[window.preguntaActual];

        let opcionesHTML = '';
        preguntaData.opciones.forEach((opcion, index) => {
            opcionesHTML += `
                <button class="btn btn-outline" style="width: 100%; text-align: left; justify-content: flex-start; padding: 15px 20px; border-color: rgba(255,255,255,0.1); margin-bottom: 12px; font-weight: 300;" 
                        onclick="verificarRespuesta(${index}, this)">
                    <span style="color: var(--primary); font-weight: 700; margin-right: 15px;">${String.fromCharCode(65 + index)}</span> ${opcion}
                </button>
            `;
        });

        container.innerHTML = `
            <div style="text-align: left; width: 100%; max-width: 700px; margin: 0 auto; animation: fadeIn 0.4s ease;">
                <div style="display: flex; justify-content: space-between; color: var(--light-2); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <span>Pregunta ${window.preguntaActual + 1} de ${window.preguntasTrivia.length}</span>
                    <span>Puntaje: <strong style="color: var(--accent);">${window.puntajeTrivia}</strong></span>
                </div>
                <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 25px; line-height: 1.5; font-weight: 500;">
                    ${preguntaData.pregunta}
                </h3>
                <div id="opciones-container">
                    ${opcionesHTML}
                </div>
            </div>
        `;
    }

    window.verificarRespuesta = function(indiceSeleccionado, botonElement) {
        const preguntaData = window.preguntasTrivia[window.preguntaActual];
        const esCorrecta = indiceSeleccionado === preguntaData.correcta;
        const botones = document.getElementById('opciones-container').querySelectorAll('button');

        botones.forEach(btn => btn.disabled = true);

        if (esCorrecta) {
            window.puntajeTrivia += 100;
            botonElement.style.background = 'rgba(46,196,182,0.2)';
            botonElement.style.borderColor = 'var(--accent)';
            botonElement.style.color = 'var(--text-main)';
            botonElement.innerHTML += '<i class="fa-solid fa-circle-check" style="margin-left: auto; color: var(--accent); font-size: 1.2rem;"></i>';
        } else {
            botonElement.style.background = 'rgba(239,68,68,0.2)';
            botonElement.style.borderColor = '#ef4444';
            botonElement.style.color = 'var(--text-main)';
            botonElement.innerHTML += '<i class="fa-solid fa-circle-xmark" style="margin-left: auto; color: #ef4444; font-size: 1.2rem;"></i>';
            
            const botonCorrecto = botones[preguntaData.correcta];
            botonCorrecto.style.borderColor = 'var(--accent)';
            botonCorrecto.style.color = 'var(--accent)';
        }

        setTimeout(() => {
            window.preguntaActual++;
            if (window.preguntaActual < window.preguntasTrivia.length) {
                renderizarPregunta();
            } else {
                mostrarResultadoTrivia();
            }
        }, 1500); 
    }

    window.mostrarResultadoTrivia = function() {
        const container = document.getElementById('trivia-container');
        const puntajeMaximo = window.preguntasTrivia.length * 100;
        const porcentaje = (window.puntajeTrivia / puntajeMaximo) * 100;
        
        let mensaje, icono, color;
        if (porcentaje === 100) {
            mensaje = "¡Operador Nivel Experto! Dominas la arquitectura de TEOS al 100%.";
            icono = "fa-trophy"; color = "#fcd34d";
        } else if (porcentaje >= 50) {
            mensaje = "Buen trabajo, tienes bases sólidas.";
            icono = "fa-thumbs-up"; color = "var(--primary)";
        } else {
            mensaje = "Requieres más entrenamiento. Revisa la sección de Información.";
            icono = "fa-triangle-exclamation"; color = "#ef4444";
        }

        container.innerHTML = `
            <div style="animation: fadeIn 0.5s ease; text-align: center;">
                <i class="fa-solid ${icono}" style="font-size: 4rem; color: ${color}; margin-bottom: 20px;"></i>
                <h2 style="color: var(--text-main); margin-bottom: 10px; font-size: 2rem;">Simulación Completada</h2>
                <h3 style="color: var(--accent); margin-bottom: 20px; font-size: 1.5rem;">Puntaje: ${window.puntajeTrivia} / ${puntajeMaximo}</h3>
                <p style="color: var(--light-2); font-weight: 300; max-width: 400px; margin: 0 auto 30px;">
                    ${mensaje}
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn" style="border-color: var(--primary);" onclick="iniciarTrivia()"><i class="fa-solid fa-rotate-right"></i> Reintentar</button>
                    <button class="btn btn-outline" onclick="menuJuegos()"><i class="fa-solid fa-gamepad"></i> Volver a Juegos</button>
                </div>
            </div>
        `;
    }

    /* ================= LÓGICA DE INICIO DE SESIÓN ================= */
    function abrirModalLogin() {
        const modal = document.getElementById('login-modal');
        modal.classList.add('show');
    }

    function cerrarModalLogin() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('show');
        // Limpiar el formulario al cerrar
        document.getElementById('login-form').reset();
    }

    /* ================= BASE DE DATOS SIMULADA Y ROLES ================= */
    // Base de datos temporal en memoria
    let baseDatosUsuarios = [
        { id: "Gabriel", pass: "Gabriel_G1", rol: "usuario" },
        { id: "Oscar", pass: "Oscar_O1", rol: "administrador" }
    ];

    /* ================= CONTROL DE MODALES ================= */
    function abrirModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    function cerrarModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        // Limpiamos los campos para no dejar rastros de contraseñas
        if (modalId === 'login-modal') document.getElementById('login-form').reset();
        if (modalId === 'register-modal') document.getElementById('register-form').reset();
    }

    /* ================= LÓGICA DE INICIO DE SESIÓN ================= */
    function procesarLogin(evento) {
        evento.preventDefault(); 
        
        const nombre = document.getElementById('login-nombre').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        
        // Buscamos si las credenciales hacen "match"
        const usuarioValido = baseDatosUsuarios.find(u => u.id === nombre && u.pass === pass);
        
        if (usuarioValido) {
            cerrarModal('login-modal');
            aplicarEstadoSesion(usuarioValido.rol, usuarioValido.id);
            
            if (usuarioValido.rol === 'administrador') {
                showTempHint(`Autenticación Nivel 1. Bienvenido Administrador ${usuarioValido.id}.`);
            } else {
                showTempHint(`Acceso concedido. Bienvenido Operador ${usuarioValido.id}.`);
            }
        } else {
            showTempHint("❌ Error: Operador o contraseña incorrectos.");
            document.getElementById('login-pass').value = ''; // Borra la clave por seguridad
        }
    }

    /* ================= LÓGICA DE REGISTRO ================= */
    function procesarRegistro(evento) {
        evento.preventDefault();
        
        const nombre = document.getElementById('reg-nombre').value.trim();
        const pass = document.getElementById('reg-pass').value.trim();
        const passConf = document.getElementById('reg-pass-conf').value.trim();
        const rol = document.getElementById('reg-rol').value;

        // 1. Validar que las contraseñas sean iguales
        if (pass !== passConf) {
            showTempHint("❌ Error: Las contraseñas no coinciden.");
            return;
        }

        // 2. Validar que el usuario no exista previamente (ignora mayúsculas/minúsculas)
        const usuarioExiste = baseDatosUsuarios.find(u => u.id.toLowerCase() === nombre.toLowerCase());
        if (usuarioExiste) {
            showTempHint("❌ Error: El nombre de operador ya está en uso.");
            return;
        }

        // 3. Guardar en la "base de datos"
        baseDatosUsuarios.push({ id: nombre, pass: pass, rol: rol });
        
        cerrarModal('register-modal');
        showTempHint(`✅ Registro exitoso. Ahora puedes iniciar sesión como ${nombre}.`);
    }

    /* ================= APLICAR ESTADO EN LA INTERFAZ ================= */
    function aplicarEstadoSesion(rol, nombreUsuario) {
        const btnControl = document.getElementById('nav-control');
        const btnAula = document.getElementById('nav-aula');
        const panelVisitante = document.getElementById('guest-actions');
        const panelUsuario = document.getElementById('user-actions');
        const etiquetaNombre = document.getElementById('nombre-usuario-ui');

        // Cambia el panel superior derecho
        panelVisitante.classList.add('oculto');
        panelUsuario.classList.remove('oculto');
        etiquetaNombre.innerText = nombreUsuario;

        // Lógica de permisos de visibilidad
        if (rol === 'administrador') {
            btnControl.classList.remove('oculto');
            btnAula.classList.remove('oculto');
        } else if (rol === 'usuario') {
            btnControl.classList.add('oculto');
            btnAula.classList.remove('oculto');
        }
    }

    function cerrarSesion() {
        // Esconder botones protegidos
        document.getElementById('nav-control').classList.add('oculto');
        document.getElementById('nav-aula').classList.add('oculto');
        
        // Restaurar los botones de login
        document.getElementById('user-actions').classList.add('oculto');
        document.getElementById('guest-actions').classList.remove('oculto');
        
        // Asegurarse de enviar al usuario a la pantalla de inicio
        switchView('view-login');
        
        showTempHint("Sesión cerrada correctamente. Volviendo al modo visitante.");
    }

    /* ================= MAPA 3D POR DEPARTAMENTOS (MAPBOX) ================= */
    let mapDept = null;
    // Archivo público con los polígonos de Perú
    let geojsonPeruUrl = 'https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson';

    function inicializarMapaDepartamentos() {
        // Si el mapa ya se cargó antes, solo forzamos un redibujado por si la ventana cambió de tamaño
        if (mapDept) {
            setTimeout(() => mapDept.resize(), 200);
            return;
        }

        // 1. Configurar la credencial
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; 

        // 2. Inicializar el renderizado 3D en el nuevo contenedor
        mapDept = new mapboxgl.Map({
            container: 'mapa-departamentos', // El ID exacto del div que creaste
            style: 'mapbox://styles/mapbox/dark-v11', // Tema oscuro sci-fi
            center: [-75.01, -9.19], // Coordenadas centrales de Perú
            zoom: 4.5,
            pitch: 45, // Inclinación 3D
            bearing: -10 
        });

        // Control de brújula y zoom
        mapDept.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // 3. Cuando el mapa cargue, inyectamos los polígonos
        mapDept.on('load', () => {
            
            mapDept.addSource('departamentos-peru', {
                type: 'geojson',
                data: geojsonPeruUrl
            });

            // Capa translúcida base
            mapDept.addLayer({
                'id': 'departamentos-fill',
                'type': 'fill',
                'source': 'departamentos-peru',
                'paint': {
                    'fill-color': 'rgba(6, 177, 203, 0.15)', // Tono turquesa ligero
                    'fill-outline-color': '#06B1CB'
                }
            });

            // Bordes de los departamentos
            mapDept.addLayer({
                'id': 'departamentos-line',
                'type': 'line',
                'source': 'departamentos-peru',
                'paint': {
                    'line-color': '#2EC4B6', 
                    'line-width': 1.5
                }
                
            });
            actualizarColoresMapa();

            // 4. Conexión con tu Dashboard: Al hacer clic en un departamento
            mapDept.on('click', 'departamentos-fill', (e) => {
                if (e.features.length > 0) {
                    // Obtenemos el nombre del polígono clickeado
                    let nombreDept = e.features[0].properties.NOMBDEP; 
                    nombreDept = nombreDept.charAt(0).toUpperCase() + nombreDept.slice(1).toLowerCase();
                    
                    // Buscamos tu selector HTML
                    const selector = document.getElementById('region-selector');
                    
                    for (let i = 0; i < selector.options.length; i++) {
                        // Si hace match con las opciones (ej. "Piura" == "Piura")
                        if (selector.options[i].value.toUpperCase() === nombreDept.toUpperCase()) {
                            selector.selectedIndex = i;
                            
                            // Actualizamos tus gráficos
                            actualizarGraficoPorRegion();
                            
                            // Animación de cámara volando hacia el objetivo
                            mapDept.flyTo({
                                center: e.lngLat,
                                zoom: 6.5,
                                pitch: 55,
                                essential: true 
                            });
                            break;
                        }
                    }
                }
            });

            // Cambiar el cursor a mano interactiva
            mapDept.on('mouseenter', 'departamentos-fill', () => {
                mapDept.getCanvas().style.cursor = 'pointer';
            });
            mapDept.on('mouseleave', 'departamentos-fill', () => {
                mapDept.getCanvas().style.cursor = '';
            });
        });
    }

    /* ================= RENDERIZADO DE MAPA DE CALOR (COROPLETAS) ================= */
    function actualizarColoresMapa() {
        // Verificamos que el mapa y la fuente de datos ya estén cargados
        if (!mapDept || !mapDept.getSource('departamentos-peru')) return;

        // Mapbox usa arrays para sus reglas lógicas. 
        // Comparamos el nombre del departamento convirtiéndolo a mayúsculas para evitar errores tipográficos
        let matchExpression = ['match', ['upcase', ['get', 'NOMBDEP']]];

        // Recorremos tu "base de datos" de regiones
        for (const [departamento, datos] of Object.entries(datosPorRegion)) {
            const nivelInseguridad = datos[0]; // El índice 0 corresponde a Inseguridad Ciudadana
            let colorAsignado;

            if (nivelInseguridad >= 60) {
                colorAsignado = '#ef4444'; // Rojo (Crítico)
            } else if (nivelInseguridad >= 40) {
                colorAsignado = '#f59e0b'; // Ámbar (Alerta)
            } else {
                colorAsignado = 'rgba(46, 196, 182, 0.4)'; // Verde/Celeste translúcido (Estable)
            }

            // Limpiamos acentos para asegurar el match con el GeoJSON (ej. "Junín" -> "JUNIN")
            const deptoNormalizado = departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            
            // Agregamos la regla: Si coincide el nombre, pinta de este color
            matchExpression.push(deptoNormalizado, colorAsignado);
        }

        // Color por defecto si un departamento no está en tu lista
        matchExpression.push('rgba(6, 177, 203, 0.15)');

        // Inyectamos la regla de pintura dinámicamente a la capa de los polígonos
        mapDept.setPaintProperty('departamentos-fill', 'fill-color', matchExpression);
    }

    /* ================= SWITCH Y SIMULACIÓN 3D MAPBOX ================= */
    let isMapSimulationMode = false;

    function toggleMapMode() {
        isMapSimulationMode = document.getElementById('map-mode-toggle').checked;
        const panelAnalisis = document.getElementById('panel-analisis');
        const panelSimulacion = document.getElementById('panel-simulacion');
        const lblAnalisis = document.getElementById('label-analisis');
        const lblSimulacion = document.getElementById('label-simulacion');

        if (isMapSimulationMode) {
            // Intercambiar paneles
            panelAnalisis.style.display = 'none';
            panelSimulacion.style.display = 'flex';
            
            // Estilos del switch
            lblAnalisis.style.color = 'var(--light-2)';
            lblAnalisis.style.textShadow = 'none';
            lblSimulacion.style.color = 'var(--accent)';
            lblSimulacion.style.textShadow = '0 0 10px var(--accent)';
            
            // Ejecutar simulación en 0% por primera vez
            updateMapSimulation();
        } else {
            // Restaurar paneles
            panelAnalisis.style.display = 'flex';
            panelSimulacion.style.display = 'none';
            
            // Estilos del switch
            lblSimulacion.style.color = 'var(--light-2)';
            lblSimulacion.style.textShadow = 'none';
            lblAnalisis.style.color = 'var(--accent)';
            lblAnalisis.style.textShadow = '0 0 10px var(--accent)';
            
            // Restaurar los colores base originales del mapa
            if (typeof actualizarColoresMapa === "function") {
                actualizarColoresMapa();
            }
        }
    }

    function updateMapSimulation() {
        if (!isMapSimulationMode || !mapDept || !mapDept.getSource('departamentos-peru')) return;

        const sliderVal = document.getElementById('slider-map-sim').value;
        document.getElementById('val-map-sim').innerText = sliderVal + '%';

        const factor = sliderVal / 100; // Va de 0.0 a 1.0
        let matchExpression = ['match', ['upcase', ['get', 'NOMBDEP']]];

        let sumOriginal = 0;
        let sumMitigated = 0;
        let count = 0;

        // Recorremos la base de datos para calcular el nuevo color por cada región
        for (const [departamento, datos] of Object.entries(datosPorRegion)) {
            let originalRisk = datos[0]; 
            // Matemática exacta: reduce hasta un 30% máximo basándose en el slider
            let mitigatedRisk = originalRisk * (1 - (0.30 * factor));
            
            sumOriginal += originalRisk;
            sumMitigated += mitigatedRisk;
            count++;

            // Asignamos el RGB base de acuerdo a tu lógica original
            let rgbBase = originalRisk >= 60 ? [239, 68, 68] : (originalRisk >= 40 ? [245, 158, 11] : [46, 196, 182]);
            let rgbObjetivo = [46, 196, 182]; // Verde neón translúcido (#2EC4B6)

            // Interpolación matemática lineal entre colores
            let r = Math.round(rgbBase[0] + (rgbObjetivo[0] - rgbBase[0]) * factor);
            let g = Math.round(rgbBase[1] + (rgbObjetivo[1] - rgbBase[1]) * factor);
            let b = Math.round(rgbBase[2] + (rgbObjetivo[2] - rgbBase[2]) * factor);

            // Aumentamos ligeramente la opacidad (de 0.4 a 0.7) al simular para un efecto visual dramático
            let opacity = 0.4 + (0.3 * factor); 
            let colorFinal = `rgba(${r}, ${g}, ${b}, ${opacity})`;

            const deptoNormalizado = departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            matchExpression.push(deptoNormalizado, colorFinal);
        }
        
        // Color default por si falla el match
        matchExpression.push('rgba(6, 177, 203, 0.15)');
        
        // Aplicamos el nuevo array lógico SIN recargar el mapa
        mapDept.setPaintProperty('departamentos-fill', 'fill-color', matchExpression);

        // Actualizamos las estadísticas del panel visual
        if (count > 0) {
            document.getElementById('riesgo-nacional-original').innerText = (sumOriginal / count).toFixed(1) + '%';
            document.getElementById('riesgo-nacional-mitigado').innerText = (sumMitigated / count).toFixed(1) + '%';
        }
    }

    /* ================= SISTEMA DE VISIÓN (CÁMARA WEBRTC) ================= */
    let currentStream = null;
    let isCameraActive = false;

    // Actualiza el listado de cámaras en el desplegable (se llama después de obtener permiso)
    async function actualizarListaCamaras(dispositivoSeleccionadoId = null) {
        const select = document.getElementById('camera-select');
        if (!select || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            select.innerHTML = '';
            
            if (videoDevices.length === 0) {
                select.innerHTML = '<option value="">No se detectaron cámaras</option>';
                return;
            }
            
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Lente Óptico ${index + 1}`;
                if (dispositivoSeleccionadoId && device.deviceId === dispositivoSeleccionadoId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } catch (err) {
            console.warn("No se pudieron enumerar los dispositivos de video:", err);
        }
    }

    async function toggleCamera() {
        const videoElement = document.getElementById('teos-camera');
        const placeholder = document.getElementById('cam-placeholder');
        const btn = document.getElementById('btn-start-cam');
        const statusBadge = document.getElementById('cam-status');
        const select = document.getElementById('camera-select');

        if (isCameraActive) {
            // ========== APAGAR CÁMARA ==========
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }
            videoElement.srcObject = null;
            videoElement.style.display = 'none';
            placeholder.style.display = 'block';
            
            btn.innerHTML = '<i class="fa-solid fa-power-off"></i> Iniciar Transmisión';
            btn.classList.remove('btn-outline');
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = 'var(--text-main)';
            
            statusBadge.innerHTML = '<i class="fa-solid fa-video-slash"></i> Offline';
            statusBadge.style.color = 'var(--light-2)';
            statusBadge.style.textShadow = 'none';
            
            isCameraActive = false;
            
            if (typeof showTempHint === "function") showTempHint("Transmisión óptica finalizada.");
            
        } else {
            // ========== ENCENDER CÁMARA (BAJO DEMANDA) ==========
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                if (typeof showTempHint === "function") {
                    showTempHint("❌ Tu navegador o conexión (requiere HTTPS o localhost) no soporta acceso a la cámara.");
                }
                return;
            }

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Solicitando acceso...';

            const selectedDeviceId = select ? select.value : '';
            const constraints = selectedDeviceId 
                ? { video: { deviceId: { exact: selectedDeviceId } } } 
                : { video: true };

            try {
                // Solicita permiso explícito al usuario en este momento exacto
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = currentStream;
                
                videoElement.style.display = 'block';
                placeholder.style.display = 'none';
                
                // Cambiar estilos del botón al modo "Detener"
                btn.innerHTML = '<i class="fa-solid fa-ban"></i> Detener Transmisión';
                btn.classList.add('btn-outline');
                btn.style.borderColor = '#ef4444';
                btn.style.color = '#ef4444';
                
                // Cambiar la etiqueta a estado "En Vivo"
                statusBadge.innerHTML = '<i class="fa-solid fa-circle-dot fa-fade"></i> En Vivo (REC)';
                statusBadge.style.color = '#ef4444';
                statusBadge.style.textShadow = '0 0 10px #ef4444';
                
                isCameraActive = true;

                // Ahora que tenemos permiso, listamos las cámaras con sus nombres reales
                await actualizarListaCamaras(selectedDeviceId);

                if (typeof showTempHint === "function") showTempHint("Enlace óptico establecido.");
                
            } catch (err) {
                console.error("Error al acceder a la cámara:", err);
                
                // Manejo de errores amigable según la causa
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    if (typeof showTempHint === "function") {
                        showTempHint("⚠️ Permiso bloqueado o denegado. Habilita la cámara en tu navegador y vuelve a presionar Iniciar.");
                    }
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    if (typeof showTempHint === "function") {
                        showTempHint("❌ No se detectó ninguna cámara conectada en tu equipo.");
                    }
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    if (typeof showTempHint === "function") {
                        showTempHint("❌ La cámara está siendo utilizada por otra aplicación.");
                    }
                } else {
                    if (typeof showTempHint === "function") {
                        showTempHint("❌ Error al conectar con el lente: " + (err.message || err.name));
                    }
                }

                // Restaurar botón a su estado original para permitir reintentar
                btn.innerHTML = '<i class="fa-solid fa-power-off"></i> Iniciar Transmisión';
                btn.classList.remove('btn-outline');
                btn.style.borderColor = 'var(--primary)';
                btn.style.color = 'var(--text-main)';
                isCameraActive = false;
            }
        }
    }

    // Si el usuario cambia de cámara en el desplegable MIENTRAS está encendida, hacemos el cambio
    document.addEventListener('DOMContentLoaded', () => {
        const camSelect = document.getElementById('camera-select');
        if (camSelect) {
            camSelect.addEventListener('change', () => {
                if (isCameraActive) {
                    toggleCamera(); // Apaga la cámara actual
                    setTimeout(() => toggleCamera(), 500); // Enciende la nueva cámara seleccionada
                }
            });
        }
    });
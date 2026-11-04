let graficaRK4 = null;
let detallesIteraciones = [];

// Base de datos de ejemplos y configuraciones físicas
const presetsFisicos = {
    newton: {
        badge: "Termodinámica",
        titulo: "Ley de Enfriamiento de Newton",
        desc: "Modela la transferencia de calor de un fluido caliente (90°C) expuesto a temperatura ambiente (20°C).",
        formulaHTML: "<strong>EDO:</strong> dT/dt = -k(T - T_amb)<br><strong>Input:</strong> <span style='color:#2563eb;'>-0.15 * (y - 20)</span>",
        eq: "-0.15 * (y - 20)",
        x0: "0",
        y0: "90",
        xf: "30",
        h: "1",
        svgHTML: `<svg width="180" height="110" viewBox="0 0 180 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 45H120V80C120 88.2843 113.284 95 105 95H65C56.7157 95 50 88.2843 50 80V45Z" fill="#3b82f6" fill-opacity="0.15" stroke="#2563eb" stroke-width="2"/>
            <path d="M120 52H132C136.418 52 140 55.5817 140 60V68C140 72.4183 136.418 76 132 76H120" stroke="#2563eb" stroke-width="2"/>
            <rect x="54" y="50" width="62" height="6" rx="3" fill="#ef4444"/>
            <path d="M65 38C65 34 71 34 71 30" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <path d="M85 40C85 36 91 36 91 32" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <path d="M105 38C105 34 111 34 111 30" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <text x="10" y="25" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="bold">T_amb = 20°C</text>
            <text x="60" y="75" fill="#ef4444" font-size="10" font-family="sans-serif" font-weight="bold">90°C</text>
        </svg>`
    },
    caida: {
        badge: "Mecánica Clásica",
        titulo: "Caída Libre con Arrastre",
        desc: "Velocidad v(t) de un cuerpo en caída libre afectado por la fricción del aire (k/m = 0.2).",
        formulaHTML: "<strong>EDO:</strong> dv/dt = g - (k/m)v<br><strong>Input:</strong> <span style='color:#2563eb;'>9.8 - 0.2 * y</span>",
        eq: "9.8 - 0.2 * y",
        x0: "0",
        y0: "0",
        xf: "25",
        h: "0.5",
        svgHTML: `<svg width="180" height="110" viewBox="0 0 180 110" fill="none">
            <circle cx="90" cy="40" r="14" fill="#ef4444"/>
            <path d="M90 54V85M90 85L84 75M90 85L96 75" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
            <path d="M90 26V10M90 10L84 18M90 10L96 18" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <text x="110" y="45" fill="#ef4444" font-size="10" font-family="sans-serif" font-weight="bold">Objeto</text>
            <text x="110" y="75" fill="#2563eb" font-size="10" font-family="sans-serif" font-weight="bold">g = 9.8</text>
        </svg>`
    },
    poblacion: {
        badge: "Biomatemática",
        titulo: "Crecimiento Poblacional",
        desc: "Modelo logístico de población con capacidad de carga máxima K = 1000.",
        formulaHTML: "<strong>EDO:</strong> dP/dt = r*P*(1 - P/K)<br><strong>Input:</strong> <span style='color:#2563eb;'>0.08 * y * (1 - y / 1000)</span>",
        eq: "0.08 * y * (1 - y / 1000)",
        x0: "0",
        y0: "50",
        xf: "100",
        h: "2",
        svgHTML: `<svg width="180" height="110" viewBox="0 0 180 110" fill="none">
            <path d="M20 90 Q 70 85 90 50 T 160 20" stroke="#10b981" stroke-width="3" fill="none"/>
            <line x1="20" y1="20" x2="160" y2="20" stroke="#94a3b8" stroke-dasharray="4" stroke-width="1.5"/>
            <text x="25" y="15" fill="#64748b" font-size="9" font-family="sans-serif">K = 1000 (Límite)</text>
            <text x="25" y="80" fill="#10b981" font-size="10" font-family="sans-serif" font-weight="bold">P₀ = 50</text>
        </svg>`
    },
    custom: {
        badge: "Personalizado",
        titulo: "Tu Ejercicio / Caso Propio",
        desc: "Ingresa la ecuación diferencial de tu guía o taller, o adjunta una foto para visualizarla aquí.",
        formulaHTML: "<strong>Estado:</strong> Listo para resolver con el algoritmo RK4.",
        eq: "y - x^2 + 1",
        x0: "0",
        y0: "0.5",
        xf: "2",
        h: "0.2",
        svgHTML: `<div style="text-align:center; color:#64748b; font-size:0.8rem; padding:1rem;">📷 Haz clic abajo para subir una foto de tu ejercicio.</div>`
    }
};

function cambiarFenomeno() {
    const key = document.getElementById('selectFenomeno').value;
    const data = presetsFisicos[key];
    if (!data) return;

    document.getElementById('panelBadge').innerText = data.badge;
    document.getElementById('panelTitulo').innerText = data.titulo;
    document.getElementById('panelDesc').innerText = data.desc;
    document.getElementById('panelFormula').innerHTML = data.formulaHTML;

    const preview = document.getElementById('panelFotoPreview');
    const svgContainer = document.getElementById('panelSvgDefault');

    if (preview.dataset.custom !== "true") {
        preview.classList.add('hidden-img');
        svgContainer.innerHTML = data.svgHTML;
        svgContainer.style.display = 'block';
    }
}

function cargarFotoCaso(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('panelFotoPreview');
        const svgContainer = document.getElementById('panelSvgDefault');

        preview.src = e.target.result;
        preview.classList.remove('hidden-img');
        preview.dataset.custom = "true";
        svgContainer.style.display = 'none';

        document.getElementById('selectFenomeno').value = 'custom';
        document.getElementById('panelBadge').innerText = "Foto Cargada";
        document.getElementById('panelTitulo').innerText = "Ejercicio Adjunto";
        document.getElementById('panelDesc').innerText = "Foto del problema cargada. Ingresa los parámetros de la EDO en el panel izquierdo.";
    };
    reader.readAsDataURL(file);
}

function cargarFenomenoFisico() {
    const key = document.getElementById('selectFenomeno').value;
    const data = presetsFisicos[key];
    if (data) {
        document.getElementById('eq').value = data.eq;
        document.getElementById('x0').value = data.x0;
        document.getElementById('y0').value = data.y0;
        document.getElementById('xf').value = data.xf;
        document.getElementById('h').value = data.h;
    }
    iniciarCalculo();
}

function mostrarError(msj) {
    const div = document.getElementById('mensajeError');
    div.innerText = msj;
    div.classList.remove('hidden');
    document.getElementById('panelResultados').classList.add('hidden');
}

function ocultarError() {
    document.getElementById('mensajeError').classList.add('hidden');
}

function cambiarPestana(tabId) {
    document.getElementById('tab-grafica').classList.add('hidden');
    document.getElementById('tab-tabla').classList.add('hidden');
    
    document.getElementById('btnTabGrafica').classList.remove('active');
    document.getElementById('btnTabTabla').classList.remove('active');

    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'tab-grafica') {
        document.getElementById('btnTabGrafica').classList.add('active');
    } else {
        document.getElementById('btnTabTabla').classList.add('active');
    }
}

function abrirModal(index) {
    const detalle = detallesIteraciones[index];
    if (!detalle) return;

    document.getElementById('modalTitulo').innerText = `Procedimiento - Iteración ${detalle.iter}`;
    document.getElementById('contenidoModal').innerHTML = detalle.htmlModal;
    document.getElementById('modalSustitucion').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalSustitucion').classList.add('hidden');
}

window.onclick = function(event) {
    const modal = document.getElementById('modalSustitucion');
    if (event.target == modal) {
        cerrarModal();
    }
}

function formatearSustitucion(eqStr, valX, valY) {
    return eqStr
        .replace(/\bx\b/gi, `(${valX})`)
        .replace(/\by\b/gi, `(${valY})`);
}

function iniciarCalculo() {
    const btn = document.getElementById('btnCalcular');
    btn.innerHTML = 'Calculando...';
    btn.disabled = true;

    setTimeout(() => {
        try {
            calcularRK4();
        } catch (err) {
            console.error(err);
            mostrarError("Error en el cálculo: " + err.message);
        } finally {
            btn.innerHTML = 'Ejecutar Cálculo';
            btn.disabled = false;
        }
    }, 100);
}

function calcularRK4() {
    ocultarError();

    if (typeof math === 'undefined') {
        return mostrarError("La librería Math.js no ha cargado correctamente.");
    }

    const eqStr = document.getElementById('eq').value.trim();
    const x0 = parseFloat(document.getElementById('x0').value);
    const y0 = parseFloat(document.getElementById('y0').value);
    const xf = parseFloat(document.getElementById('xf').value);
    const h = parseFloat(document.getElementById('h').value);

    if (!eqStr) return mostrarError("Ingrese la ecuación diferencial.");
    if (isNaN(x0) || isNaN(y0) || isNaN(xf) || isNaN(h)) return mostrarError("Llene todos los valores numéricos.");
    if (h <= 0) return mostrarError("El paso h debe ser mayor a 0.");
    if (xf <= x0) return mostrarError("xf debe ser mayor a x0.");

    let f;
    try {
        f = math.compile(eqStr);
        f.evaluate({ x: x0, y: y0 });
    } catch (error) {
        return mostrarError("Sintaxis de ecuación no válida. Use '*' para multiplicar (ej: 2*x*y).");
    }

    let x = x0;
    let y = y0;
    let iteracion = 0;

    let arr_x = [x];
    let arr_y = [y];
    detallesIteraciones = [];

    let htmlTabla = `
        <thead>
            <tr>
                <th>i</th>
                <th>x</th>
                <th>k₁</th>
                <th>k₂</th>
                <th>k₃</th>
                <th>k₄</th>
                <th>y (RK4)</th>
                <th style="text-align:center;">Ver</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>0</td>
                <td>${x.toFixed(4)}</td>
                <td>-</td><td>-</td><td>-</td><td>-</td>
                <td style="font-weight:700; color:var(--primary);">${y.toFixed(6)}</td>
                <td style="text-align:center;">-</td>
            </tr>
    `;

    while (x < xf - (h * 0.001)) {
        let x1 = x, y1 = y;
        let k1 = f.evaluate({ x: x1, y: y1 });

        let x2 = x + h/2, y2 = y + (h/2)*k1;
        let k2 = f.evaluate({ x: x2, y: y2 });

        let x3 = x + h/2, y3 = y + (h/2)*k2;
        let k3 = f.evaluate({ x: x3, y: y3 });

        let x4 = x + h, y4 = y + h*k3;
        let k4 = f.evaluate({ x: x4, y: y4 });

        let y_next = y + (h / 6) * (k1 + 2*k2 + 2*k3 + k4);
        iteracion++;

        detallesIteraciones.push({
            iter: iteracion,
            htmlModal: `
                <div style="background:#f8fafc; border-left:3px solid var(--primary); padding:0.75rem; margin-bottom:0.5rem; font-family:monospace; font-size:0.8rem; line-height:1.6;">
                    <strong>k₁</strong> = f(${x1.toFixed(4)}, ${y1.toFixed(6)})<br>
                    = ${formatearSustitucion(eqStr, x1.toFixed(4), y1.toFixed(6))}<br>
                    → <strong>k₁ = ${k1.toFixed(6)}</strong><br><br>

                    <strong>k₂</strong> = f(${x2.toFixed(4)}, ${y2.toFixed(6)})<br>
                    = ${formatearSustitucion(eqStr, x2.toFixed(4), y2.toFixed(6))}<br>
                    → <strong>k₂ = ${k2.toFixed(6)}</strong><br><br>

                    <strong>k₃</strong> = f(${x3.toFixed(4)}, ${y3.toFixed(6)})<br>
                    = ${formatearSustitucion(eqStr, x3.toFixed(4), y3.toFixed(6))}<br>
                    → <strong>k₃ = ${k3.toFixed(6)}</strong><br><br>

                    <strong>k₄</strong> = f(${x4.toFixed(4)}, ${y4.toFixed(6)})<br>
                    = ${formatearSustitucion(eqStr, x4.toFixed(4), y4.toFixed(6))}<br>
                    → <strong>k₄ = ${k4.toFixed(6)}</strong>
                </div>
            `
        });

        y = y_next;
        x = x + h;

        arr_x.push(x);
        arr_y.push(y);

        let idx = iteracion - 1;
        htmlTabla += `<tr>
            <td>${iteracion}</td>
            <td>${x.toFixed(4)}</td>
            <td>${k1.toFixed(4)}</td>
            <td>${k2.toFixed(4)}</td>
            <td>${k3.toFixed(4)}</td>
            <td>${k4.toFixed(4)}</td>
            <td style="font-weight:700; color:var(--primary);">${y.toFixed(6)}</td>
            <td style="text-align:center;"><button style="background:none; border:none; cursor:pointer;" onclick="abrirModal(${idx})">🔍</button></td>
        </tr>`;

        if (iteracion > 3000) break;
    }
    
    htmlTabla += '</tbody>';

    document.getElementById('kpiPasos').innerText = iteracion;
    document.getElementById('kpiYFinal').innerText = y.toFixed(6);
    document.getElementById('kpiH').innerText = h;
    document.getElementById('tablaResultados').innerHTML = htmlTabla;

    document.getElementById('panelResultados').classList.remove('hidden');

    dibujarGrafica(arr_x, arr_y, eqStr);
}

function dibujarGrafica(xData, yData, eqStr) {
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('grafica').getContext('2d');
    if (graficaRK4) graficaRK4.destroy();

    graficaRK4 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xData.map(v => v.toFixed(2)),
            datasets: [{
                label: `y(x) para dy/dx = ${eqStr}`,
                data: yData,
                borderColor: '#2563eb',
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#f1f5f9' } },
                y: { grid: { color: '#f1f5f9' } }
            }
        }
    });
}

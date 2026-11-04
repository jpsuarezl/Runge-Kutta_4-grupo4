let graficaRK4 = null;
let detallesIteraciones = [];

// Base de datos de fenómenos físicos predeterminados (variables x0 y xf)
const presetsFisicos = {
    caida: {
        eq: "9.81 - 0.15*y",
        x0: "0",
        y0: "0",
        xf: "10",
        h: "0.2",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <circle cx="90" cy="30" r="12" fill="#ef4444"/>
            <path d="M90 42V70M90 70L85 62M90 70L95 62" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
            <text x="110" y="35" fill="#ef4444" font-size="10" font-family="sans-serif" font-weight="bold">Objeto</text>
            <text x="110" y="65" fill="#2563eb" font-size="10" font-family="sans-serif" font-weight="bold">g = 9.81</text>
        </svg>`
    },
    newton: {
        eq: "-0.15 * (y - 20)",
        x0: "0",
        y0: "90",
        xf: "30",
        h: "1",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <rect x="65" y="35" width="50" height="40" rx="4" fill="#3b82f6" fill-opacity="0.2" stroke="#2563eb" stroke-width="2"/>
            <path d="M75 25C75 20 80 20 80 15" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <path d="M90 27C90 22 95 22 95 17" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <text x="15" y="55" fill="#64748b" font-size="9" font-family="sans-serif" font-weight="bold">Tamb = 20°C</text>
        </svg>`
    },
    poblacion: {
        eq: "0.08 * y * (1 - y / 1000)",
        x0: "0",
        y0: "50",
        xf: "100",
        h: "2",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <path d="M20 75 Q 70 70 90 40 T 160 15" stroke="#10b981" stroke-width="2.5" fill="none"/>
            <line x1="20" y1="15" x2="160" y2="15" stroke="#94a3b8" stroke-dasharray="3"/>
            <text x="25" y="82" fill="#10b981" font-size="9" font-family="sans-serif" font-weight="bold">P₀ = 50</text>
        </svg>`
    },
    custom: {
        eq: "y - x^2 + 1",
        x0: "0",
        y0: "0.5",
        xf: "2",
        h: "0.2",
        svgHTML: `<div style="text-align:center; color:#64748b; font-size:0.8rem;">✏️ Caso Personalizado</div>`
    }
};

// Cargar preset seleccionado
function cambiarFenomeno() {
    const key = document.getElementById('selectFenomeno').value;
    const data = presetsFisicos[key];
    if (!data) return;

    document.getElementById('eq').value = data.eq;
    document.getElementById('x0').value = data.x0;
    document.getElementById('y0').value = data.y0;
    document.getElementById('xf').value = data.xf;
    document.getElementById('h').value = data.h;

    const preview = document.getElementById('panelFotoPreview');
    const svgContainer = document.getElementById('panelSvgDefault');

    if (preview.dataset.custom !== "true") {
        preview.classList.add('hidden-img');
        svgContainer.innerHTML = data.svgHTML;
        svgContainer.style.display = 'block';
    }
}

// Botones de ayuda matemática rápida
function insertarTextoEq(texto) {
    const input = document.getElementById('eq');
    input.value += texto;
    input.focus();
}

// Carga de foto del ejercicio
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
    };
    reader.readAsDataURL(file);
}

// Manejo de Modales
function abrirModalEquipo() {
    document.getElementById('modalEquipo').classList.remove('hidden');
}

function cerrarModalEquipo() {
    document.getElementById('modalEquipo').classList.add('hidden');
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
    if (event.target == document.getElementById('modalSustitucion')) cerrarModal();
    if (event.target == document.getElementById('modalEquipo')) cerrarModalEquipo();
}

function mostrarError(msj) {
    const div = document.getElementById('mensajeError');
    div.innerText = msj;
    div.classList.remove('hidden');
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

// Formatear sustitución explícita en x e y
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
            btn.innerHTML = 'Ejecutar Cálculo RK4';
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
    if (h <= 0) return mostrarError("El paso (h) debe ser mayor a 0.");
    if (xf <= x0) return mostrarError("El valor x final (xf) debe ser mayor al inicial (x₀).");

    let f;
    try {
        f = math.compile(eqStr);
        f.evaluate({ x: x0, y: y0 });
    } catch (error) {
        return mostrarError("Sintaxis de ecuación no válida. Use '*' para multiplicar (ej: 0.15*y).");
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
                <td style="font-weight:700; color:#4338ca;">${y.toFixed(6)}</td>
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
                <div style="background:#f8fafc; border-left:3px solid #4338ca; padding:0.75rem; margin-bottom:0.5rem; font-family:monospace; font-size:0.8rem; line-height:1.6;">
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
            <td style="font-weight:700; color:#4338ca;">${y.toFixed(6)}</td>
            <td style="text-align:center;"><button style="background:none; border:none; cursor:pointer;" onclick="abrirModal(${idx})">🔍</button></td>
        </tr>`;

        if (iteracion > 3000) break;
    }
    
    htmlTabla += '</tbody>';

    document.getElementById('kpiPasos').innerText = iteracion;
    document.getElementById('kpiYFinal').innerText = y.toFixed(4);
    document.getElementById('kpiH').innerText = h;
    document.getElementById('tablaResultados').innerHTML = htmlTabla;

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
                label: `Estado y(x) — dy/dx = ${eqStr}`,
                data: yData,
                borderColor: '#4338ca',
                backgroundColor: 'rgba(67, 56, 202, 0.08)',
                borderWidth: 2.5,
                pointRadius: 3,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    title: { display: true, text: 'Variable Independiente (x)', font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' } 
                },
                y: { 
                    title: { display: true, text: 'Estado (y)', font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' } 
                }
            }
        }
    });
}

// Inicializar preset por defecto y ejecutar cálculo automático al cargar la página
window.onload = function() {
    cambiarFenomeno();
    iniciarCalculo();
};

let graficaRK4 = null;
let detallesIteraciones = [];
let campoActivoId = 'eq';

// Estado de los datos de cada campo
const estadoCampos = {
    eq: { texto: "9.81 - 0.15*y", pos: 13 },
    x0: { texto: "0", pos: 1 },
    y0: { texto: "0", pos: 1 },
    xf: { texto: "10", pos: 2 },
    h:  { texto: "0.2", pos: 3 }
};

// Base de datos de fenómenos predeterminados
const presetsFisicos = {
    caida: {
        eq: "9.81 - 0.15*y", x0: "0", y0: "0", xf: "10", h: "0.2",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <circle cx="90" cy="30" r="12" fill="#ef4444"/>
            <path d="M90 42V70M90 70L85 62M90 70L95 62" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
            <text x="110" y="35" fill="#ef4444" font-size="10" font-family="sans-serif" font-weight="bold">Objeto</text>
            <text x="110" y="65" fill="#2563eb" font-size="10" font-family="sans-serif" font-weight="bold">g = 9.81</text>
        </svg>`
    },
    newton: {
        eq: "-0.15 * (y - 20)", x0: "0", y0: "90", xf: "30", h: "1",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <rect x="65" y="35" width="50" height="40" rx="4" fill="#3b82f6" fill-opacity="0.2" stroke="#2563eb" stroke-width="2"/>
            <path d="M75 25C75 20 80 20 80 15" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <path d="M90 27C90 22 95 22 95 17" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            <text x="15" y="55" fill="#64748b" font-size="9" font-family="sans-serif" font-weight="bold">Tamb = 20°C</text>
        </svg>`
    },
    poblacion: {
        eq: "0.08 * y * (1 - y / 1000)", x0: "0", y0: "50", xf: "100", h: "2",
        svgHTML: `<svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <path d="M20 75 Q 70 70 90 40 T 160 15" stroke="#10b981" stroke-width="2.5" fill="none"/>
            <line x1="20" y1="15" x2="160" y2="15" stroke="#94a3b8" stroke-dasharray="3"/>
            <text x="25" y="82" fill="#10b981" font-size="9" font-family="sans-serif" font-weight="bold">P₀ = 50</text>
        </svg>`
    },
    custom: {
        eq: "", x0: "", y0: "", xf: "", h: "",
        svgHTML: `<div style="text-align:center; color:#64748b; font-size:0.8rem;">✏️ Caso Personalizado</div>`
    }
};

// Renderiza el contenido de los campos mostrando el cursor parpadeante |
function renderizarPantallas() {
    Object.keys(estadoCampos).forEach(id => {
        const display = document.getElementById(`display_${id}`);
        if (!display) return;
        const wrapper = display.parentElement;
        const c = estadoCampos[id];

        if (id === campoActivoId) {
            wrapper.classList.add('active-field');
            const antes = c.texto.substring(0, c.pos);
            const despues = c.texto.substring(c.pos);
            display.innerHTML = `${escapeHTML(antes)}<span class="blinking-cursor"></span>${escapeHTML(despues)}`;
        } else {
            wrapper.classList.remove('active-field');
            display.innerHTML = escapeHTML(c.texto);
        }
    });
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function seleccionarCampo(id) {
    campoActivoId = id;
    renderizarPantallas();
}

function cambiarFenomeno() {
    const key = document.getElementById('selectFenomeno').value;
    const data = presetsFisicos[key];
    if (!data) return;

    ['eq', 'x0', 'y0', 'xf', 'h'].forEach(field => {
        estadoCampos[field].texto = data[field];
        estadoCampos[field].pos = data[field].length;
    });

    const svgContainer = document.getElementById('panelSvgDefault');
    if (svgContainer) {
        svgContainer.innerHTML = data.svgHTML;
        svgContainer.style.display = 'block';
    }

    ocultarError();
    renderizarPantallas();
}

// Mueve el cursor a la izquierda (-1) o derecha (+1)
function moverCursor(dir) {
    const c = estadoCampos[campoActivoId];
    c.pos = Math.max(0, Math.min(c.texto.length, c.pos + dir));
    renderizarPantallas();
}

// Inserta texto respetando la posición actual del cursor
function insertarTexto(t) {
    const c = estadoCampos[campoActivoId];
    const antes = c.texto.substring(0, c.pos);
    const despues = c.texto.substring(c.pos);

    c.texto = antes + t + despues;
    
    if (t.endsWith('()')) {
        c.pos = c.pos + t.length - 1;
    } else {
        c.pos = c.pos + t.length;
    }
    renderizarPantallas();
}

// Borra el carácter exacto a la izquierda del cursor
function borrarCaracter() {
    const c = estadoCampos[campoActivoId];
    if (c.pos > 0) {
        const antes = c.texto.substring(0, c.pos - 1);
        const despues = c.texto.substring(c.pos);
        c.texto = antes + despues;
        c.pos--;
        renderizarPantallas();
    }
}

function limpiarCampo() {
    const c = estadoCampos[campoActivoId];
    c.texto = "";
    c.pos = 0;
    renderizarPantallas();
}

// Dibujar Gráfica
function dibujarGrafica(xData, yData, eqStr) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('grafica');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
                x: { title: { display: true, text: 'Variable Independiente (x)', font: { weight: 'bold' } }, grid: { color: '#f1f5f9' } },
                y: { title: { display: true, text: 'Estado (y)', font: { weight: 'bold' } }, grid: { color: '#f1f5f9' } }
            }
        }
    });
}

// Modales
function abrirModalEquipo() { document.getElementById('modalEquipo').classList.remove('hidden'); }
function cerrarModalEquipo() { document.getElementById('modalEquipo').classList.add('hidden'); }

function abrirModal(index) {
    const detalle = detallesIteraciones[index];
    if (!detalle) return;

    document.getElementById('modalTitulo').innerText = `Procedimiento - Iteración ${detalle.iter}`;
    document.getElementById('contenidoModal').innerHTML = detalle.htmlModal;
    document.getElementById('modalSustitucion').classList.remove('hidden');
}

function cerrarModal() { document.getElementById('modalSustitucion').classList.add('hidden'); }

window.onclick = function(event) {
    if (event.target == document.getElementById('modalSustitucion')) cerrarModal();
    if (event.target == document.getElementById('modalEquipo')) cerrarModalEquipo();
}

function mostrarError(msj) {
    const div = document.getElementById('mensajeError');
    div.innerText = msj;
    div.classList.remove('hidden');
}

function ocultarError() { document.getElementById('mensajeError').classList.add('hidden'); }

function cambiarPestana(tabId) {
    document.getElementById('tab-grafica').classList.add('hidden');
    document.getElementById('tab-tabla').classList.add('hidden');
    
    document.getElementById('btnTabGrafica').classList.remove('active');
    document.getElementById('btnTabTabla').classList.remove('active');

    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'tab-grafica') {
        document.getElementById('btnTabGrafica').classList.add('active');
        if (graficaRK4) graficaRK4.resize();
    } else {
        document.getElementById('btnTabTabla').classList.add('active');
    }
}

function formatearSustitucion(eqStr, valX, valY) {
    return eqStr.replace(/\bx\b/gi, `(${valX})`).replace(/\by\b/gi, `(${valY})`);
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

// Cálculo RK4
function calcularRK4() {
    ocultarError();

    if (typeof math === 'undefined') {
        return mostrarError("La librería Math.js no ha cargado correctamente.");
    }

    const eqStr = estadoCampos.eq.texto.trim();
    const x0 = parseFloat(estadoCampos.x0.texto);
    const y0 = parseFloat(estadoCampos.y0.texto);
    const xf = parseFloat(estadoCampos.xf.texto);
    const h = parseFloat(estadoCampos.h.texto);

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
                <div style="background:#f8fafc; border-left:3px solid #4338ca; padding:0.85rem; margin-bottom:0.5rem; font-family:monospace; font-size:0.82rem; line-height:1.7;">
                    <!-- k1 -->
                    <strong>k₁:</strong><br>
                    x₁ = ${x1.toFixed(4)}<br>
                    y₁ = ${y1.toFixed(6)}<br>
                    k₁ = f(${x1.toFixed(4)}, ${y1.toFixed(6)}) = ${formatearSustitucion(eqStr, x1.toFixed(4), y1.toFixed(6))}<br>
                    → <strong>k₁ = ${k1.toFixed(6)}</strong><br><br>

                    <!-- k2 -->
                    <strong>k₂:</strong><br>
                    x₂ = x + h/2 = ${x1.toFixed(4)} + ${h}/2 = <strong>${x2.toFixed(4)}</strong><br>
                    y₂ = y + (h/2)·k₁ = ${y1.toFixed(6)} + (${h}/2)·(${k1.toFixed(6)}) = <strong>${y2.toFixed(6)}</strong><br>
                    k₂ = f(${x2.toFixed(4)}, ${y2.toFixed(6)}) = ${formatearSustitucion(eqStr, x2.toFixed(4), y2.toFixed(6))}<br>
                    → <strong>k₂ = ${k2.toFixed(6)}</strong><br><br>

                    <!-- k3 -->
                    <strong>k₃:</strong><br>
                    x₃ = x + h/2 = ${x1.toFixed(4)} + ${h}/2 = <strong>${x3.toFixed(4)}</strong><br>
                    y₃ = y + (h/2)·k₂ = ${y1.toFixed(6)} + (${h}/2)·(${k2.toFixed(6)}) = <strong>${y3.toFixed(6)}</strong><br>
                    k₃ = f(${x3.toFixed(4)}, ${y3.toFixed(6)}) = ${formatearSustitucion(eqStr, x3.toFixed(4), y3.toFixed(6))}<br>
                    → <strong>k₃ = ${k3.toFixed(6)}</strong><br><br>

                    <!-- k4 -->
                    <strong>k₄:</strong><br>
                    x₄ = x + h = ${x1.toFixed(4)} + ${h} = <strong>${x4.toFixed(4)}</strong><br>
                    y₄ = y + h·k₃ = ${y1.toFixed(6)} + ${h}·(${k3.toFixed(6)}) = <strong>${y4.toFixed(6)}</strong><br>
                    k₄ = f(${x4.toFixed(4)}, ${y4.toFixed(6)}) = ${formatearSustitucion(eqStr, x4.toFixed(4), y4.toFixed(6))}<br>
                    → <strong>k₄ = ${k4.toFixed(6)}</strong><br><br>

                    <!-- Resultado Final Iteración -->
                    <hr style="border:0; border-top:1px solid #cbd5e1; margin:0.6rem 0;">
                    <strong>Nuevo y (RK4):</strong><br>
                    y_{${iteracion}} = ${y1.toFixed(6)} + (${h}/6)·[${k1.toFixed(6)} + 2(${k2.toFixed(6)}) + 2(${k3.toFixed(6)}) + ${k4.toFixed(6)}]<br>
                    → <strong style="color:#4338ca;">y_{${iteracion}} = ${y_next.toFixed(6)}</strong>
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

window.onload = function() {
    cambiarFenomeno();
    renderizarPantallas();
    iniciarCalculo();
};

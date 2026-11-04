let graficaRK4 = null;
let detallesIteraciones = [];

function cargarFenomenoFisico() {
    document.getElementById('eq').value = '-0.15 * (y - 20)';
    document.getElementById('x0').value = '0';
    document.getElementById('y0').value = '90';
    document.getElementById('xf').value = '30';
    document.getElementById('h').value = '1';
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

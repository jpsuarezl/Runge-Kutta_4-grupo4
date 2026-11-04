let graficaRK4 = null;
let detallesIteraciones = [];

function mostrarError(msj) {
    const div = document.getElementById('mensajeError');
    div.innerText = msj;
    div.style.display = 'block';
    const panel = document.getElementById('panelResultados');
    panel.style.display = 'none';
    panel.classList.remove('animar');
}

function ocultarError() {
    const div = document.getElementById('mensajeError');
    div.style.display = 'none';
}

function cambiarPestana(tabId) {
    document.getElementById('tab-grafica').style.display = 'none';
    document.getElementById('tab-tabla').style.display = 'none';
    
    document.getElementById('btnTabGrafica').classList.remove('active');
    document.getElementById('btnTabTabla').classList.remove('active');

    document.getElementById(tabId).style.display = 'block';
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
    document.getElementById('modalSustitucion').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modalSustitucion').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalSustitucion');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function formatearSustitucion(eqStr, valX, valY) {
    let formulaVisual = eqStr;
    formulaVisual = formulaVisual.replace(/\b x \b/gi, `(${valX})`).replace(/x/g, `(${valX})`);
    formulaVisual = formulaVisual.replace(/\b y \b/gi, `(${valY})`).replace(/y/g, `(${valY})`);
    return formulaVisual;
}

function iniciarCalculo() {
    const btn = document.getElementById('btnCalcular');
    btn.innerHTML = '⏳ Calculando...';
    btn.disabled = true;

    // Pausa breve para brindar feedback de carga interactiva
    setTimeout(() => {
        calcularRK4();
        btn.innerHTML = 'Ejecutar Cálculo';
        btn.disabled = false;
    }, 180);
}

function calcularRK4() {
    ocultarError();

    const eqStr = document.getElementById('eq').value.trim();
    const x0 = parseFloat(document.getElementById('x0').value);
    const y0 = parseFloat(document.getElementById('y0').value);
    const xf = parseFloat(document.getElementById('xf').value);
    const h = parseFloat(document.getElementById('h').value);

    if (!eqStr) return mostrarError("Por favor ingrese la ecuación diferencial f(x,y).");
    if (isNaN(x0) || isNaN(y0) || isNaN(xf) || isNaN(h)) {
        return mostrarError("Por favor llene todos los campos numéricos.");
    }
    if (h <= 0) return mostrarError("El tamaño de paso (h) debe ser mayor a 0.");
    if (xf <= x0) return mostrarError("El valor de x final (xf) debe ser mayor a x inicial (xₙ).");

    let f;
    try {
        f = math.compile(eqStr);
        f.evaluate({ x: x0, y: y0 });
    } catch (error) {
        return mostrarError("Sintaxis inválida. Recuerde usar '*' para multiplicar (ej: 2*x*y).");
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
                <th>Iteración</th><th>x</th><th>k₁</th><th>k₂</th><th>k₃</th><th>k₄</th><th>y (aprox)</th><th>Ver</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    htmlTabla += `<tr><td>0</td><td>${x.toFixed(4)}</td><td>-</td><td>-</td><td>-</td><td>-</td><td><strong>${y.toFixed(6)}</strong></td><td>-</td></tr>`;

    while (x < xf - (h * 0.001)) {
        let x1 = x;
        let y1 = y;
        let k1 = f.evaluate({ x: x1, y: y1 });

        let x2 = x + h/2;
        let y2 = y + (h/2)*k1;
        let k2 = f.evaluate({ x: x2, y: y2 });

        let x3 = x + h/2;
        let y3 = y + (h/2)*k2;
        let k3 = f.evaluate({ x: x3, y: y3 });

        let x4 = x + h;
        let y4 = y + h*k3;
        let k4 = f.evaluate({ x: x4, y: y4 });

        let y_next = y + (h / 6) * (k1 + 2*k2 + 2*k3 + k4);

        iteracion++;

        let contenidoModalHtml = `
            <div class="sustitucion-box">
                <strong>Cálculo de k₁:</strong><br>
                k₁ = f(xₙ, yₙ) = f(${x1.toFixed(4)}, ${y1.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code>${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x1.toFixed(4), y1.toFixed(6))}<br>
                <span style="color: #4338ca; font-weight: bold; display:inline-block; margin-top:5px;">→ k₁ = ${k1.toFixed(6)}</span>
            </div>
            
            <div class="sustitucion-box">
                <strong>Cálculo de k₂:</strong><br>
                x = xₙ + h/2 = ${x1.toFixed(4)} + ${h}/2 = ${x2.toFixed(4)}<br>
                y = yₙ + (h/2)·k₁ = ${y1.toFixed(6)} + (${h}/2)·(${k1.toFixed(6)}) = ${y2.toFixed(6)}<br>
                k₂ = f(${x2.toFixed(4)}, ${y2.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code>${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x2.toFixed(4), y2.toFixed(6))}<br>
                <span style="color: #4338ca; font-weight: bold; display:inline-block; margin-top:5px;">→ k₂ = ${k2.toFixed(6)}</span>
            </div>
            
            <div class="sustitucion-box">
                <strong>Cálculo de k₃:</strong><br>
                x = xₙ + h/2 = ${x1.toFixed(4)} + ${h}/2 = ${x3.toFixed(4)}<br>
                y = yₙ + (h/2)·k₂ = ${y1.toFixed(6)} + (${h}/2)·(${k2.toFixed(6)}) = ${y3.toFixed(6)}<br>
                k₃ = f(${x3.toFixed(4)}, ${y3.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code>${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x3.toFixed(4), y3.toFixed(6))}<br>
                <span style="color: #4338ca; font-weight: bold; display:inline-block; margin-top:5px;">→ k₃ = ${k3.toFixed(6)}</span>
            </div>
            
            <div class="sustitucion-box">
                <strong>Cálculo de k₄:</strong><br>
                x = xₙ + h = ${x1.toFixed(4)} + ${h} = ${x4.toFixed(4)}<br>
                y = yₙ + h·k₃ = ${y1.toFixed(6)} + ${h}·(${k3.toFixed(6)}) = ${y4.toFixed(6)}<br>
                k₄ = f(${x4.toFixed(4)}, ${y4.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code>${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x4.toFixed(4), y4.toFixed(6))}<br>
                <span style="color: #4338ca; font-weight: bold; display:inline-block; margin-top:5px;">→ k₄ = ${k4.toFixed(6)}</span>
            </div>
        `;

        detallesIteraciones.push({
            iter: iteracion,
            htmlModal: contenidoModalHtml
        });

        y = y_next;
        x = x + h;

        if (!isFinite(y)) {
            mostrarError(`Cálculo interrumpido: Se detectó una singularidad en x = ${x.toFixed(4)}.`);
            return;
        }

        arr_x.push(x);
        arr_y.push(y);

        let indexDetalle = iteracion - 1;
        htmlTabla += `<tr>
            <td>${iteracion}</td>
            <td>${x.toFixed(4)}</td>
            <td>${k1.toFixed(4)}</td>
            <td>${k2.toFixed(4)}</td>
            <td>${k3.toFixed(4)}</td>
            <td>${k4.toFixed(4)}</td>
            <td><strong>${y.toFixed(6)}</strong></td>
            <td><button class="btn-lupa" onclick="abrirModal(${indexDetalle})" title="Ver procedimiento">🔍</button></td>
        </tr>`;

        if (iteracion > 5000) {
            mostrarError("Límite de iteraciones alcanzado por seguridad (máx. 5000).");
            return;
        }
    }
    
    htmlTabla += '</tbody>';

    // Actualizar tarjetas de métricas KPI
    document.getElementById('kpiPasos').innerText = iteracion;
    document.getElementById('kpiYFinal').innerText = y.toFixed(6);
    document.getElementById('kpiH').innerText = h;

    // Mostrar panel de resultados con animación suave
    const panel = document.getElementById('panelResultados');
    panel.style.display = 'block';
    panel.classList.add('animar');

    document.getElementById('tablaResultados').innerHTML = htmlTabla;
    
    dibujarGrafica(arr_x, arr_y);
}

function dibujarGrafica(xData, yData) {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (graficaRK4) graficaRK4.destroy();

    // Crear degradado continuo para el área bajo la curva
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(67, 56, 202, 0.35)');
    gradient.addColorStop(1, 'rgba(67, 56, 202, 0.0)');

    graficaRK4 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xData.map(val => val.toFixed(2)),
            datasets: [{
                label: 'Aproximación RK4',
                data: yData,
                borderColor: '#4338ca', 
                backgroundColor: gradient,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#4338ca',
                pointHoverRadius: 7,
                fill: true,
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            },
            scales: {
                x: { title: { display: true, text: 'Variable Independiente (x)', font: {weight: 'bold'} } },
                y: { title: { display: true, text: 'Variable Dependiente (y)', font: {weight: 'bold'} } }
            },
            plugins: {
                legend: {
                    labels: { font: { family: 'Inter', weight: '500' } }
                }
            }
        }
    });
}

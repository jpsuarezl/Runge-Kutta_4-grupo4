let graficaRK4 = null;
let detallesIteraciones = [];

function mostrarError(msj) {
    const div = document.getElementById('mensajeError');
    div.innerText = msj;
    div.classList.remove('hidden');
    const panel = document.getElementById('panelResultados');
    panel.classList.add('hidden');
    panel.classList.remove('animate-fade-in');
}

function ocultarError() {
    const div = document.getElementById('mensajeError');
    div.classList.add('hidden');
}

function cambiarPestana(tabId) {
    const tabGrafica = document.getElementById('tab-grafica');
    const tabTabla = document.getElementById('tab-tabla');
    const btnGrafica = document.getElementById('btnTabGrafica');
    const btnTabla = document.getElementById('btnTabTabla');

    if (tabId === 'tab-grafica') {
        tabGrafica.classList.remove('hidden');
        tabGrafica.classList.add('block');
        tabTabla.classList.add('hidden');
        tabTabla.classList.remove('block');

        btnGrafica.className = "py-2.5 px-4 text-sm font-semibold text-brand-700 border-b-2 border-brand-700 focus:outline-none transition-colors";
        btnTabla.className = "py-2.5 px-4 text-sm font-semibold text-slate-500 border-b-2 border-transparent hover:text-brand-700 focus:outline-none transition-colors";
    } else {
        tabTabla.classList.remove('hidden');
        tabTabla.classList.add('block');
        tabGrafica.classList.add('hidden');
        tabGrafica.classList.remove('block');

        btnTabla.className = "py-2.5 px-4 text-sm font-semibold text-brand-700 border-b-2 border-brand-700 focus:outline-none transition-colors";
        btnGrafica.className = "py-2.5 px-4 text-sm font-semibold text-slate-500 border-b-2 border-transparent hover:text-brand-700 focus:outline-none transition-colors";
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
    let formulaVisual = eqStr;
    formulaVisual = formulaVisual.replace(/\b x \b/gi, `(${valX})`).replace(/x/g, `(${valX})`);
    formulaVisual = formulaVisual.replace(/\b y \b/gi, `(${valY})`).replace(/y/g, `(${valY})`);
    return formulaVisual;
}

function iniciarCalculo() {
    const btn = document.getElementById('btnCalcular');
    btn.innerHTML = '⏳ Calculando...';
    btn.disabled = true;

    setTimeout(() => {
        calcularRK4();
        btn.innerHTML = 'Ejecutar Cálculo';
        btn.disabled = false;
    }, 180);
}

function calcularRK4() {
    ocultarError();

    const eqStr = document.getElementById('eq').value.trim();
    const eqExactaStr = document.getElementById('eqExacta').value.trim();
    const x0 = parseFloat(document.getElementById('x0').value);
    const y0 = parseFloat(document.getElementById('y0').value);
    const xf = parseFloat(document.getElementById('xf').value);
    const h = parseFloat(document.getElementById('h').value);

    if (!eqStr) return mostrarError("Por favor ingrese la ecuación diferencial f(x,y).");
    if (isNaN(x0) || isNaN(y0) || isNaN(xf) || isNaN(h)) {
        return mostrarError("Por favor llene todos los campos numéricos.");
    }
    if (h <= 0) return mostrarError("El tamaño de paso (h) debe ser mayor a 0.");
    if (xf <= x0) return mostrarError("El valor de x final (xf) debe ser mayor a x inicial (x₀).");

    let f;
    try {
        f = math.compile(eqStr);
        f.evaluate({ x: x0, y: y0 });
    } catch (error) {
        return mostrarError("Sintaxis inválida en f(x,y). Recuerde usar '*' para multiplicar (ej: 2*x*y).");
    }

    let f_exact = null;
    if (eqExactaStr) {
        try {
            f_exact = math.compile(eqExactaStr);
            f_exact.evaluate({ x: x0 });
        } catch (error) {
            return mostrarError("Sintaxis inválida en la solución exacta y(x). Verifique la fórmula.");
        }
    }

    let x = x0;
    let y = y0;
    let iteracion = 0;

    let arr_x = [x];
    let arr_y = [y];
    let arr_exacta = f_exact ? [f_exact.evaluate({ x: x })] : [];
    detallesIteraciones = [];

    let htmlTabla = `
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            <tr>
                <th class="py-3 px-4">Iteración</th>
                <th class="py-3 px-4">x</th>
                <th class="py-3 px-4">k₁</th>
                <th class="py-3 px-4">k₂</th>
                <th class="py-3 px-4">k₃</th>
                <th class="py-3 px-4">k₄</th>
                <th class="py-3 px-4">y (RK4)</th>
                ${f_exact ? '<th class="py-3 px-4">y (Exacta)</th><th class="py-3 px-4">Error Abs.</th>' : ''}
                <th class="py-3 px-4 text-center">Ver</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
    `;
    
    let exact_i0 = f_exact ? f_exact.evaluate({ x: x }) : null;
    let error_i0 = f_exact ? Math.abs(exact_i0 - y) : null;

    htmlTabla += `<tr class="hover:bg-slate-50/80 transition-colors">
        <td class="py-3 px-4 font-medium">0</td>
        <td class="py-3 px-4 font-mono">${x.toFixed(4)}</td>
        <td class="py-3 px-4 text-slate-400">-</td>
        <td class="py-3 px-4 text-slate-400">-</td>
        <td class="py-3 px-4 text-slate-400">-</td>
        <td class="py-3 px-4 text-slate-400">-</td>
        <td class="py-3 px-4 font-mono font-bold text-brand-700">${y.toFixed(6)}</td>
        ${f_exact ? `<td class="py-3 px-4 font-mono text-sky-700">${exact_i0.toFixed(6)}</td><td class="py-3 px-4 font-mono text-slate-500">${error_i0.toFixed(6)}</td>` : ''}
        <td class="py-3 px-4 text-center text-slate-400">-</td>
    </tr>`;

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
            <div class="p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl border border-slate-200/80 font-mono text-sm leading-relaxed">
                <strong class="text-slate-800">Cálculo de k₁:</strong><br>
                k₁ = f(xₙ, yₙ) = f(${x1.toFixed(4)}, ${y1.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x1.toFixed(4), y1.toFixed(6))}<br>
                <span class="text-brand-700 font-bold block mt-1.5">→ k₁ = ${k1.toFixed(6)}</span>
            </div>
            
            <div class="p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl border border-slate-200/80 font-mono text-sm leading-relaxed">
                <strong class="text-slate-800">Cálculo de k₂:</strong><br>
                x = xₙ + h/2 = ${x1.toFixed(4)} + ${h}/2 = ${x2.toFixed(4)}<br>
                y = yₙ + (h/2)·k₁ = ${y1.toFixed(6)} + (${h}/2)·(${k1.toFixed(6)}) = ${y2.toFixed(6)}<br>
                k₂ = f(${x2.toFixed(4)}, ${y2.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x2.toFixed(4), y2.toFixed(6))}<br>
                <span class="text-brand-700 font-bold block mt-1.5">→ k₂ = ${k2.toFixed(6)}</span>
            </div>
            
            <div class="p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl border border-slate-200/80 font-mono text-sm leading-relaxed">
                <strong class="text-slate-800">Cálculo de k₃:</strong><br>
                x = xₙ + h/2 = ${x1.toFixed(4)} + ${h}/2 = ${x3.toFixed(4)}<br>
                y = yₙ + (h/2)·k₂ = ${y1.toFixed(6)} + (${h}/2)·(${k2.toFixed(6)}) = ${y3.toFixed(6)}<br>
                k₃ = f(${x3.toFixed(4)}, ${y3.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x3.toFixed(4), y3.toFixed(6))}<br>
                <span class="text-brand-700 font-bold block mt-1.5">→ k₃ = ${k3.toFixed(6)}</span>
            </div>
            
            <div class="p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl border border-slate-200/80 font-mono text-sm leading-relaxed">
                <strong class="text-slate-800">Cálculo de k₄:</strong><br>
                x = xₙ + h = ${x1.toFixed(4)} + ${h} = ${x4.toFixed(4)}<br>
                y = yₙ + h·k₃ = ${y1.toFixed(6)} + ${h}·(${k3.toFixed(6)}) = ${y4.toFixed(6)}<br>
                k₄ = f(${x4.toFixed(4)}, ${y4.toFixed(6)})<br>
                Sustituyendo en f(x,y) = <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${eqStr}</code>:<br>
                = ${formatearSustitucion(eqStr, x4.toFixed(4), y4.toFixed(6))}<br>
                <span class="text-brand-700 font-bold block mt-1.5">→ k₄ = ${k4.toFixed(6)}</span>
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

        let valExacto = f_exact ? f_exact.evaluate({ x: x }) : null;
        let errAbs = f_exact ? Math.abs(valExacto - y) : null;

        arr_x.push(x);
        arr_y.push(y);
        if (f_exact) arr_exacta.push(valExacto);

        let indexDetalle = iteracion - 1;
        htmlTabla += `<tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-3 px-4 font-medium">${iteracion}</td>
            <td class="py-3 px-4 font-mono">${x.toFixed(4)}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${k1.toFixed(4)}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${k2.toFixed(4)}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${k3.toFixed(4)}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${k4.toFixed(4)}</td>
            <td class="py-3 px-4 font-mono font-bold text-brand-700">${y.toFixed(6)}</td>
            ${f_exact ? `<td class="py-3 px-4 font-mono text-sky-700">${valExacto.toFixed(6)}</td><td class="py-3 px-4 font-mono text-slate-500">${errAbs.toExponential(3)}</td>` : ''}
            <td class="py-3 px-4 text-center">
                <button onclick="abrirModal(${indexDetalle})" title="Ver procedimiento"
                    class="p-1.5 text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all transform hover:scale-110">
                    🔍
                </button>
            </td>
        </tr>`;

        if (iteracion > 5000) {
            mostrarError("Límite de iteraciones alcanzado por seguridad (máx. 5000).");
            return;
        }
    }
    
    htmlTabla += '</tbody>';

    // Actualizar KPIs
    document.getElementById('kpiPasos').innerText = iteracion;
    document.getElementById('kpiYFinal').innerText = y.toFixed(6);
    document.getElementById('kpiH').innerText = h;

    // Badges sobre la gráfica
    let badgeHtml = `<span class="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-mono text-xs font-semibold">EDO: dy/dx = ${eqStr}</span>`;
    if (eqExactaStr) {
        badgeHtml += `<span class="inline-flex items-center px-3 py-1 bg-sky-600 text-white rounded-lg font-mono text-xs font-semibold shadow-sm">Solución Exacta: y(x) = ${eqExactaStr}</span>`;
    }
    document.getElementById('eqBadgeContainer').innerHTML = badgeHtml;

    const panel = document.getElementById('panelResultados');
    panel.classList.remove('hidden');
    panel.classList.add('animate-fade-in');

    document.getElementById('tablaResultados').innerHTML = htmlTabla;
    
    dibujarGrafica(arr_x, arr_y, arr_exacta, eqStr, eqExactaStr);
}

function dibujarGrafica(xData, yData, exactData, eqStr, eqExactaStr) {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (graficaRK4) graficaRK4.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.35)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    const datasets = [
        {
            label: `RK4: dy/dx = ${eqStr}`,
            data: yData,
            borderColor: '#4f46e5', 
            backgroundColor: gradient,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#4f46e5',
            pointHoverRadius: 7,
            fill: true,
            tension: 0.25
        }
    ];

    if (exactData && exactData.length > 0) {
        datasets.push({
            label: `Exacta: y(x) = ${eqExactaStr}`,
            data: exactData,
            borderColor: '#0f172a',
            borderDash: [6, 4],
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.25
        });
    }

    graficaRK4 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xData.map(val => val.toFixed(2)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Variable Independiente (x)', font: { family: 'Inter', weight: 'bold' } },
                    grid: { color: '#f1f5f9' }
                },
                y: { 
                    title: { display: true, text: 'Variable Dependiente (y)', font: { family: 'Inter', weight: 'bold' } },
                    grid: { color: '#f1f5f9' }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { family: 'Inter', weight: '600' } }
                },
                title: {
                    display: true,
                    text: exactData && exactData.length > 0 
                        ? `Comparación: dy/dx = ${eqStr} vs. Solución Exacta y(x) = ${eqExactaStr}` 
                        : `Aproximación Numérica RK4 para dy/dx = ${eqStr}`,
                    font: { family: 'Inter', size: 14, weight: '700' },
                    color: '#0c4a6e',
                    padding: { bottom: 15 }
                }
            }
        }
    });
}

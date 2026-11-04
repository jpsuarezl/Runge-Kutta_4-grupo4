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

// Renderiza los campos mostrando el cursor visual parpadeante
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

    const preview = document.getElementById('panelFotoPreview');
    const svgContainer = document.getElementById('panelSvgDefault');

    if (preview && preview.dataset.custom !== "true") {
        preview.classList.add('hidden-img');
        svgContainer.innerHTML = data.svgHTML;
        svgContainer.style.display = 'block';
    }

    ocultarError();
    renderizarPantallas();
}

function moverCursor(dir) {
    const c = estadoCampos[campoActivoId];
    c.pos = Math.max(0, Math.min(c.texto.length, c.pos + dir));
    renderizarPantallas();
}

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

// CORRECCIÓN AUTOMÁTICA DE CARACTERES TÍPICOS DE OCR
function sanitizarTextoOCR(str) {
    return str
        .replace(/%/g, '*')          // Convierte '%' accidental a '*'
        .replace(/θ/g, '0')          // Convierte el símbolo theta 'θ' a '0'
        .replace(/\b6\.2\b/g, '0.2') // Corrige confusión común entre 0.2 y 6.2
        .replace(/\bo\b/gi, '0')     // Convierte la letra 'o' suelta a '0'
        .trim();
}

// CARGA DE FOTO Y MOSTRADO CORRECTO EN EL CONTENEDOR
function cargarFotoCaso(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('panelFotoPreview');
        const svgContainer = document.getElementById('panelSvgDefault');

        // Mostrar la foto seleccionada e inhabilitar el SVG por defecto
        preview.src = e.target.result;
        preview.classList.remove('hidden-img');
        preview.style.display = 'block';
        preview.dataset.custom = "true";
        if (svgContainer) svgContainer.style.display = 'none';

        // Cambiar el selector a personalizado sin sobreescribir la foto
        document.getElementById('selectFenomeno').value = 'custom';
        
        // Limpiar pantallas para recibir los datos del OCR
        ['eq', 'x0', 'y0', 'xf', 'h'].forEach(id => {
            estadoCampos[id].texto = "";
            estadoCampos[id].pos = 0;
        });
        renderizarPantallas();
    };
    reader.readAsDataURL(file);

    // Iniciar OCR Tesseract
    const statusDiv = document.getElementById('statusOCR');
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.innerText = "🔍 Analizando imagen con Tesseract OCR...";
    }

    if (typeof Tesseract === 'undefined') {
        if (statusDiv) statusDiv.innerText = "⚠️ La librería Tesseract no está disponible.";
        return;
    }

    Tesseract.recognize(file, 'eng')
        .then(({ data: { text } }) => {
            console.log("Texto detectado por OCR:\n", text);
            const extraido = procesarTextoOCR(text);
            
            if (statusDiv) {
                if (extraido) {
                    statusDiv.innerText = "✅ Datos extraídos correctamente.";
                } else {
                    statusDiv.innerText = "ℹ️ Imagen procesada. Complete o ajuste los datos si es necesario.";
                }
                setTimeout(() => statusDiv.classList.add('hidden'), 5000);
            }
        })
        .catch(err => {
            console.error(err);
            if (statusDiv) statusDiv.innerText = "⚠️ Error al escanear la imagen.";
        });
}

// FILTRADO DE TEXTO EXTRAÍDO
function procesarTextoOCR(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let algoEncontrado = false;

    lines.forEach(line => {
        let lineLimpia = sanitizarTextoOCR(line);
        const clean = lineLimpia.replace(/\s+/g, '').toLowerCase();

        // 1. Extraer Ecuación Diferencial
        if (clean.includes('dy/dx=') || clean.includes('f(x,y)=')) {
            let partes = lineLimpia.split('=');
            let posibleEq = partes[partes.length - 1].trim();

            posibleEq = posibleEq.replace(/[^0-9xXyY+\-*/^().\s]/g, '');
            if (posibleEq.length > 0) {
                estadoCampos.eq.texto = posibleEq;
                estadoCampos.eq.pos = posibleEq.length;
                algoEncontrado = true;
            }
        }

        // 2. Extraer x0 / x_0 / xO
        const matchX0 = lineLimpia.match(/(?:x0|x_0|x[o0θ])\s*[:=]\s*([0-9.-]+|[o0θ])/i);
        if (matchX0) {
            let val = sanitizarTextoOCR(matchX0[1]);
            estadoCampos.x0.texto = val;
            estadoCampos.x0.pos = val.length;
            algoEncontrado = true;
        }

        // 3. Extraer y0 / y_0 / yO
        const matchY0 = lineLimpia.match(/(?:y0|y_0|y[o0θ])\s*[:=]\s*([0-9.-]+|[o0θ])/i);
        if (matchY0) {
            let val = sanitizarTextoOCR(matchY0[1]);
            estadoCampos.y0.texto = val;
            estadoCampos.y0.pos = val.length;
            algoEncontrado = true;
        }

        // 4. Extraer xf / x final
        const matchXf = lineLimpia.match(/(?:xf|x_f|x\s*final)\s*[:=]\s*(

// CARGA DE FOTO Y ESCANEO OCR MEJORADO
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
        
        // Limpiar campos antes de autollenar
        ['eq', 'x0', 'y0', 'xf', 'h'].forEach(id => {
            estadoCampos[id].texto = "";
            estadoCampos[id].pos = 0;
        });
        renderizarPantallas();
    };
    reader.readAsDataURL(file);

    const statusDiv = document.getElementById('statusOCR');
    statusDiv.classList.remove('hidden');
    statusDiv.innerText = "🔍 Analizando imagen con Tesseract OCR...";

    if (typeof Tesseract === 'undefined') {
        statusDiv.innerText = "⚠️ La librería Tesseract no se ha cargado.";
        return;
    }

    Tesseract.recognize(file, 'eng')
        .then(({ data: { text } }) => {
            console.log("Texto detectado por OCR:\n", text);
            const extraido = procesarTextoOCR(text);
            
            if (extraido) {
                statusDiv.innerText = "✅ Datos extraídos correctamente.";
            } else {
                statusDiv.innerText = "ℹ️ Foto leída, pero no se halló patrón dy/dx explícito. Ingrese los datos manualmente.";
            }
            setTimeout(() => statusDiv.classList.add('hidden'), 5000);
        })
        .catch(err => {
            console.error(err);
            statusDiv.innerText = "⚠️ Error al procesar la imagen.";
        });
}

// FILTRADO INTELIGENTE Y FLEXIBLE
function procesarTextoOCR(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let algoEncontrado = false;

    lines.forEach(line => {
        const clean = line.replace(/\s+/g, '').toLowerCase();

        // 1. Detección de Ecuación Diferencial (dy/dx =, f(x,y)=, o expresiones con variables x/y)
        if (clean.includes('=') && (clean.includes('x') || clean.includes('y'))) {
            let partes = line.split('=');
            let posibleEq = partes[partes.length - 1].trim();

            // Si el lado derecho contiene variables matemáticas, la tomamos
            if (posibleEq && (posibleEq.includes('x') || posibleEq.includes('y') || /[0-9]/.test(posibleEq))) {
                // Limpiar caracteres OCR no matemáticos
                posibleEq = posibleEq.replace(/[^0-9xXyY+\-*/^().\s]/g, '');
                if (posibleEq.length > 1) {
                    estadoCampos.eq.texto = posibleEq;
                    estadoCampos.eq.pos = posibleEq.length;
                    algoEncontrado = true;
                }
            }
        }

        // 2. Extraer x0 / x_0 / x(0)
        const matchX0 = line.match(/(?:x0|x_0|x\(0\))\s*[:=]\s*([0-9.-]+)/i);
        if (matchX0) {
            estadoCampos.x0.texto = matchX0[1];
            estadoCampos.x0.pos = matchX0[1].length;
            algoEncontrado = true;
        }

        // 3. Extraer y0 / y_0 / y(0)
        const matchY0 = line.match(/(?:y0|y_0|y\(0\))\s*[:=]\s*([0-9.-]+)/i);
        if (matchY0) {
            estadoCampos.y0.texto = matchY0[1];
            estadoCampos.y0.pos = matchY0[1].length;
            algoEncontrado = true;
        }

        // 4. Extraer xf / x final
        const matchXf = line.match(/(?:xf|x_f|x\s*final)\s*[:=]\s*([0-9.-]+)/i);
        if (matchXf) {
            estadoCampos.xf.texto = matchXf[1];
            estadoCampos.xf.pos = matchXf[1].length;
            algoEncontrado = true;
        }

        // 5. Extraer paso h
        const matchH = line.match(/(?:h|paso)\s*[:=]\s*([0-9.-]+)/i);
        if (matchH) {
            estadoCampos.h.texto = matchH[1];
            estadoCampos.h.pos = matchH[1].length;
            algoEncontrado = true;
        }
    });

    renderizarPantallas();
    
    // Si se logró extraer la ecuación y al menos un valor, intenta ejecutar
    if (estadoCampos.eq.texto !== "") {
        iniciarCalculo();
    }

    return algoEncontrado;
}

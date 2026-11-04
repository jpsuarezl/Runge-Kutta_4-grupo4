// CORRECCIÓN AUTOMÁTICA DE CARACTERES TÍPICOS DE OCR
function sanitizarTextoOCR(str) {
    return str
        .replace(/%/g, '*')        // Convierte '%' o '%%' accidental a '*'
        .replace(/θ/g, '0')        // Convierte el símbolo theta 'θ' a '0'
        .replace(/o/gi, '0')       // Convierte la letra 'O'/'o' en asignaciones numéricas a '0'
        .replace(/\b6\.2\b/g, '0.2') // Corrige confusión común entre 0.2 y 6.2
        .trim();
}

function procesarTextoOCR(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let algoEncontrado = false;

    lines.forEach(line => {
        // Limpiar errores comunes de caracteres en la línea completa
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
        const matchXf = lineLimpia.match(/(?:xf|x_f|x\s*final)\s*[:=]\s*([0-9.-]+)/i);
        if (matchXf) {
            let val = sanitizarTextoOCR(matchXf[1]);
            estadoCampos.xf.texto = val;
            estadoCampos.xf.pos = val.length;
            algoEncontrado = true;
        }

        // 5. Extraer paso h
        const matchH = lineLimpia.match(/(?:h|paso)\s*[:=]\s*([0-9.-]+)/i);
        if (matchH) {
            let val = sanitizarTextoOCR(matchH[1]);
            estadoCampos.h.texto = val;
            estadoCampos.h.pos = val.length;
            algoEncontrado = true;
        }
    });

    renderizarPantallas();

    if (estadoCampos.eq.texto !== "") {
        iniciarCalculo();
    }

    return algoEncontrado;
}

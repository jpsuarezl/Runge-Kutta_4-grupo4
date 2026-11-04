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

    document.getElementById('eq').value =

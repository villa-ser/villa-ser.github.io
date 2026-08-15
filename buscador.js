// ==========================================
// 1. TU BASE DE DATOS INTEGRADA
// ==========================================
// Copia aquí los datos de tu Excel. Cada bloque entre { } es una fila.
// Esto evita errores de columnas desordenadas y hace que funcione a la velocidad de la luz.

const baseDeDatos = [
    {
        codigo: "08-03",
        organizacion: "Organización de Ejemplo",
        tema: "Acometidas y Tableros",
        concepto: "Solo cableado, independientemente de la cantidad de conductores.",
        precio: "18500",
        observaciones: "Sin observaciones."
    },
    {
        codigo: "02-15",
        organizacion: "AEA",
        tema: "Instalación",
        concepto: "Armado pilar trifásico con cañería completa",
        precio: "45000",
        observaciones: "No incluye materiales de mampostería."
    }
    // Añade más bloques separados por comas según necesites
];

// ==========================================
// 2. LÓGICA DEL BUSCADOR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");

    // Habilitar el botón SOLO si hay más de 2 letras escritas
    searchInput.addEventListener("input", () => {
        btnBuscar.disabled = searchInput.value.trim().length < 2;
    });

    // Ejecutar la búsqueda al hacer clic
    btnBuscar.addEventListener("click", realizarBusqueda);

    // Permitir buscar presionando la tecla "Enter"
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !btnBuscar.disabled) {
            realizarBusqueda();
        }
    });
});

function realizarBusqueda() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    if (searchInput.length < 2) return;

    // Extraer hasta 5 palabras clave, ignorando mayúsculas y espacios vacíos
    let palabrasClave = searchInput.toLowerCase().split(/\s+/).filter(p => p.length > 0).slice(0, 5);
    const resultados = [

        
    ];

    // Iterar directamente sobre nuestra base de datos limpia
    for (const fila of baseDeDatos) {
        
        // RESTRICCIÓN ABSOLUTA: Buscar ÚNICAMENTE en "concepto" (lo que era la columna D)
        const textoConcepto = String(fila.concepto || "").toLowerCase();

        // Verificar que TODAS las palabras ingresadas estén dentro del concepto
        const coincidenciaExacta = palabrasClave.every(palabra => textoConcepto.includes(palabra));

        if (coincidenciaExacta) {
            resultados.push(fila);
            if (resultados.length >= 6) break; // Máximo 6 resultados
        }
    }

    renderizarResultados(resultados, palabrasClave);
}

// Resaltador de palabras clave en color cian (Estilo NGC)
function resaltarTexto(texto, palabrasClave) {
    if (!texto) return "";
    
    const palabrasValidas = palabrasClave
        .filter(p => p.length > 0)
        .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escapar caracteres raros
        .sort((a, b) => b.length - a.length); // Previene que palabras cortas rompan palabras largas

    if (palabrasValidas.length === 0) return texto;

    const regex = new RegExp(`(${palabrasValidas.join('|')})`, 'gi');
    return texto.replace(regex, `<span class="gnc-highlight">$1</span>`);
}

// Dibujar las tarjetas en la pantalla
function renderizarResultados(resultados, palabrasClave) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (window.lucide) { lucide.createIcons(); }

    if (resultados.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron coincidencias. Prueba con otras palabras.</div>`;
        return;
    }

    resultados.forEach(fila => {
        // Datos extraídos de forma exacta desde el bloque JSON
        const codigo = fila.codigo || "-";
        const organizacion = fila.organizacion || "No especificado";
        const tema = fila.tema || "General";
        const concepto = fila.concepto || "Mano de obra";
        
        // Formatear precio para que siempre tenga el símbolo o diga "Consultar"
        let precio = fila.precio ? `$ ${fila.precio}` : "$ Consultar";
        
        const observaciones = fila.observaciones || "Sin observaciones.";

        // Resaltar palabras solo en el título (Concepto)
        const conceptoResaltado = resaltarTexto(concepto, palabrasClave);

        const card = document.createElement("div");
        card.className = "result-card";
        
        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${conceptoResaltado}</span>
                <span class="result-price">${precio}</span>
            </div>
            <div class="result-body">
                <p><span class="tag">CÓDIGO:</span> ${codigo}</p>
                <p><span class="tag">ORGANIZACIÓN:</span> ${organizacion}</p>
                <p><span class="tag">TEMA:</span> ${tema}</p>
                <p style="margin-top: 8px; border-top: 1px dashed rgba(0,212,255,0.2); padding-top: 8px;">
                    <span class="tag" style="display:block; margin-bottom:4px;">OBSERVACIONES:</span>
                    ${observaciones}
                </p>
            </div>
        `;

        resultsContainer.appendChild(card);
    });
}

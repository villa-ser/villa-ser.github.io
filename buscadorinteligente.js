let allData = [];

// 1. DICCIONARIO DE SINÓNIMOS (Puedes agregar los que necesites)
const gruposSinonimos = [
    ["termomagnetica", "termica", "fusible", "llave", "breaker"],
    ["diferencial", "disyuntor", "salvavita", "salva"],
    ["tomacorriente", "toma", "enchufe", "modulo"],
    ["conductor", "cable", "alambre", "linea"],
    ["jabalina", "electrodo", "tierra"],
    ["luminaria", "lampara", "foco", "artefacto", "luz"]
    ["instalacion", "montaje", "colocacion", "implementacion", "implantacion", "establecimiento", "puesta en marcha", "conexion", "cambio"],
];

document.addEventListener("DOMContentLoaded", () => {
    cargarExcel();

    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");

    searchInput.addEventListener("input", () => {
        btnBuscar.disabled = searchInput.value.trim().length === 0;
    });

    btnBuscar.addEventListener("click", ejecutarBusqueda);

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !btnBuscar.disabled) {
            ejecutarBusqueda();
        }
    });
});

async function cargarExcel() {
    const statusMsg = document.getElementById("status-message");
    const searchInput = document.getElementById("searchInput");
    
    try {
        const response = await fetch('archivo.xlsx');
        if (!response.ok) throw new Error("No se pudo cargar archivo.xlsx");
        
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const nombreHoja = workbook.SheetNames.includes('Precios') ? 'Precios' : workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];
        const jsonRaw = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
        
        allData = [];
        for (let i = 1; i < jsonRaw.length; i++) {
            const fila = jsonRaw[i];
            const concepto = String(fila['D'] || "").trim();
            const precio = String(fila['E'] || "").trim();
            
            if (!concepto) continue;
            if (precio.toLowerCase().includes("importe neto") || precio === "") continue;

            allData.push({
                organizacion: String(fila['B'] || "").trim() || "General",  
                tema: String(fila['C'] || "").trim() || "General",          
                concepto: concepto,                                         
                precio: fila['E'],                                          
                observaciones: String(fila['F'] || "").trim()               
            });
        }
        
        statusMsg.style.display = "none";
        searchInput.disabled = false;
        searchInput.placeholder = "Ej: armado pilar trifásico...";

    } catch (error) {
        statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al leer archivo.xlsx';
        statusMsg.style.color = "var(--error-red)";
        console.error(error);
    }
}

// 2. FUNCIÓN PARA LIMPIAR TEXTO (Quita acentos, símbolos y pasa a minúsculas)
function normalizarTexto(texto) {
    return texto
        .normalize("NFD") // Descompone caracteres con acentos
        .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ""); // Elimina cualquier símbolo, dejando solo letras, números y espacios
}

// 3. EXPANDIR BÚSQUEDA CON SINÓNIMOS
function obtenerSinonimos(palabra) {
    let opciones = [palabra];
    for (const grupo of gruposSinonimos) {
        if (grupo.includes(palabra)) {
            opciones = [...new Set([...opciones, ...grupo])];
        }
    }
    return opciones;
}

// 4. ALGORITMO DE LEVENSHTEIN (Calcula qué tan diferentes son dos palabras)
function distanciaLevenshtein(a, b) {
    const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
    for (let j = 0; j <= b.length; j++) matriz[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const costo = a[i - 1] === b[j - 1] ? 0 : 1;
            matriz[i][j] = Math.min(
                matriz[i - 1][j] + 1,      // Eliminación
                matriz[i][j - 1] + 1,      // Inserción
                matriz[i - 1][j - 1] + costo // Sustitución
            );
        }
    }
    return matriz[a.length][b.length];
}

// 5. EVALUAR SIMILITUD (Tolera errores según el largo de la palabra)
function sonSimilares(buscada, objetivo) {
    if (buscada === objetivo) return true;
    
    // Si la palabra buscada está contenida dentro del objetivo (Ej: "termi" en "termomagnetica")
    // Se exige un mínimo de 3 letras para no hacer match falso con letras sueltas ("a", "el")
    if (buscada.length >= 3 && objetivo.includes(buscada)) return true;

    // Calculamos el margen de error permitido (1 error cada 4 letras)
    const maxErrores = Math.floor(buscada.length / 4);
    if (maxErrores === 0) return false; // Palabras muy cortas deben coincidir exacto o por 'includes'

    // Si la diferencia de tamaño es muy grande, ni siquiera calculamos Levenshtein
    if (Math.abs(buscada.length - objetivo.length) > maxErrores + 1) return false;

    return distanciaLevenshtein(buscada, objetivo) <= maxErrores;
}

function ejecutarBusqueda() {
    const rawQuery = document.getElementById("searchInput").value;
    const queryNormalizada = normalizarTexto(rawQuery);
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (queryNormalizada.trim() === "") return;

    // Extraer hasta 5 palabras clave (ya limpias de acentos y símbolos)
    const palabrasBusqueda = queryNormalizada.split(/\s+/).filter(p => p.length > 0).slice(0, 5);
    const coincidencias = [];

    for (const item of allData) {
        const conceptoNormalizado = normalizarTexto(item.concepto);
        const palabrasDelConcepto = conceptoNormalizado.split(/\s+/);
        
        // La fila debe cumplir con TODAS las palabras ingresadas
        const cumpleTodas = palabrasBusqueda.every(palabraBuscada => {
            // Expandimos la palabra ingresada por el usuario para buscar también sus sinónimos
            const opcionesBuscadas = obtenerSinonimos(palabraBuscada);

            // Verificamos si alguna de las opciones (o sinónimos) coincide con alguna palabra del excel
            return opcionesBuscadas.some(opcion => {
                return palabrasDelConcepto.some(palabraConcepto => sonSimilares(opcion, palabraConcepto));
            });
        });

        if (cumpleTodas) {
            coincidencias.push(item);
            if (coincidencias.length >= 5) break; // Límite de 5 resultados
        }
    }

    if (coincidencias.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron resultados para su búsqueda.<br><span style="font-size:0.75rem; font-weight:normal; color:var(--ngc-text-muted);">Intenta usar palabras clave más generales. (Ej: "pilar" en vez de "armado de pilar completo")</span></div>`;
        return;
    }

    coincidencias.forEach(item => {
        let precioFormat = "$ Consultar";
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "") {
            precioFormat = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else if (item.precio) {
            precioFormat = `$ ${item.precio}`;
        }

        const card = document.createElement("div");
        card.className = "result-card";

        const mensajeWp = encodeURIComponent(`Hola Sergio, quisiera solicitar un presupuesto a medida basado en este concepto: "${item.concepto}". Vi que el valor referencial es de ${precioFormat}.`);
        const urlWp = `https://wa.me/543513559347?text=${mensajeWp}`;

        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${item.concepto}</span>
                <span class="result-price">${precioFormat}</span>
            </div>
            <div class="result-obs">
                <i data-lucide="info" style="width: 14px; height: 14px; display:inline-block; vertical-align: middle;"></i> 
                ${item.observaciones ? item.observaciones : "Sin observaciones adicionales."}
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Organización / Entidad:</span><br> ${item.organizacion}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tema General:</span><br> ${item.tema}
                </div>
                
                <div class="wsp-section">
                    <span class="wsp-leyenda">¿Querés un presupuesto completo y a la medida?</span>
                    <a href="${urlWp}" target="_blank" class="btn-whatsapp">
                        <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> Solicitar Presupuesto
                    </a>
                </div>
            </div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.closest('.btn-whatsapp')) return;
            card.classList.toggle("active");
        });

        resultsContainer.appendChild(card);
    });
    
    // Renderizar iconos lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
                        }
                        

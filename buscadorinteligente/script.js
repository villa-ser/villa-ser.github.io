// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

let allData = [];

// ==========================================
// 0.5. PALABRAS VACÍAS (STOPWORDS)
// ==========================================
// Se ignorarán pronombres, conectores, artículos, adverbios y adjetivos no técnicos
const palabrasVacias = new Set([
    // Artículos y Preposiciones
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "durante",
    "en", "entre", "hacia", "hasta", "mediante", "para", "por", "segun", "sin", "so", "sobre", "tras",
    // Conjunciones
    "y", "e", "ni", "o", "u", "pero", "mas", "sino", "aunque", "porque", "pues", "como", "si", "que",
    // Pronombres
    "yo", "tu", "el", "ella", "ello", "nosotros", "nosotras", "vosotros", "vosotras",
    "ellos", "ellas", "me", "te", "se", "nos", "os", "lo", "la", "le", "los", "las", "les",
    "mi", "ti", "conmigo", "contigo", "consigo",
    "este", "ese", "aquel", "esta", "esa", "aquella", "estos", "esos", "aquellos",
    "estas", "esas", "aquellas", "esto", "eso", "aquello",
    "mio", "tuyo", "suyo", "nuestro", "vuestro",
    "alguien", "nadie", "algo", "nada", "cualquiera", "alguno", "ninguno", "quien", "cual", "cuales",
    // Adverbios
    "aqui", "ahi", "alli", "aca", "alla", "cerca", "lejos", "arriba", "abajo", "delante", "detras",
    "dentro", "fuera", "hoy", "ayer", "manana", "ahora", "antes", "despues", "luego", "tarde", "temprano",
    "pronto", "siempre", "nunca", "jamas", "ya", "todavia", "aun", "asi", "bien", "mal", "despacio", "deprisa",
    "muy", "mucho", "poco", "bastante", "demasiado", "mas", "menos", "tan", "tanto",
    "apenas", "casi", "medio", "tambien", "cierto", "claro", "exacto", "obvio",
    "no", "tampoco", "quiza", "quizas", "acaso",
    // Adjetivos genéricos 
    "bueno", "malo", "mejor", "peor", "mayor", "menor", "grande", "pequeno", "nuevo", "viejo",
    "facil", "dificil", "bonito", "feo", "rapido", "lento", "solo", "solamente"
]);

// ==========================================
// 1. DICCIONARIO DE SINÓNIMOS
// ==========================================
const gruposSinonimos = [
    ["termomagnetica", "termica", "fusible", "llave", "breaker"],
    ["timbre", "campanilla", "zumbador", "bocina", "pitido", "soneria", "portero", "llamador"],
    ["diferencial", "disyuntor", "salvavita", "salva"],
    ["tomacorriente", "toma", "enchufe", "modulo", "boca"],
    ["conductor", "cable", "alambre", "linea", "recableado", "cableado"],
    ["jabalina", "electrodo", "tierra", "pat", "puestaatierra"],
    ["luminaria", "lampara", "foco", "artefacto", "luz", "lus", "luces", "lamparita", "aplique"],
    ["instalacion", "instalar", "instala", "montaje", "colocacion", "implementacion", "conexion", "cambio", "armado"],
    ["pilar", "acometida", "monofasico", "trifasico"],
    ["fexible", "corrugado", "manguera"],
    ["cano", "caneria", "tubo"],
    ["motor", "motores"],
    ["exterior", "externo", "interperie", "afuera"],
    ["interior", "interno", "dentro", "adentro"],
    ["mono", "monofásico", "monofásica"],
    ["cablecanal", "canaleta", "cableducto", "canal", "moldura"], 
    ["apto", "certificado", "epec", "alta", "ersep"]
];

document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    cargarExcel();

    // ==========================================
    // 1. LÓGICA DEL MENÚ FLOTANTE SUPERIOR
    // ==========================================
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        // Cerrar menú flotante al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DEL MODO DÍA / MODO NOCHE
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
        }

        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // ==========================================
    // 3. LÓGICA DEL BUSCADOR
    // ==========================================
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");

    if(searchInput && btnBuscar) {
        searchInput.addEventListener("input", () => {
            btnBuscar.disabled = searchInput.value.trim().length === 0;
        });

        btnBuscar.addEventListener("click", () => {
            const textoOriginal = btnBuscar.innerHTML;
            btnBuscar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            setTimeout(() => {
                ejecutarBusqueda();
                btnBuscar.innerHTML = textoOriginal;
            }, 200);
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !btnBuscar.disabled) {
                btnBuscar.click();
            }
        });
    }
});

function busquedaRapida(termino) {
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    
    if(searchInput && btnBuscar) {
        searchInput.value = termino;
        btnBuscar.disabled = false;
        btnBuscar.click();
    }
}

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
        
        if(statusMsg) statusMsg.style.display = "none";
        if(searchInput) searchInput.disabled = false;

    } catch (error) {
        if(statusMsg) {
            statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error de conexión con la base de datos.';
            statusMsg.style.color = "var(--error-red)";
        }
        console.error(error);
    }
}

// NUEVA FUNCIÓN: Divide el texto y fusiona palabras compuestas de forma segura
function obtenerPalabrasClave(texto) {
    let txt = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
    let palabras = txt.split(/\s+/).filter(p => p.length > 0);
    
    for (let i = 0; i < palabras.length; i++) {
        if (palabras[i] === "cable" && palabras[i+1] === "canal") {
            palabras[i] = "cablecanal";
            palabras.splice(i+1, 1);
            i--; // Retrocedemos el índice para evitar saltarnos palabras
        } else if (palabras[i] === "puesta" && palabras[i+1] === "a" && palabras[i+2] === "tierra") {
            palabras[i] = "puestaatierra";
            palabras.splice(i+1, 2);
            i--; 
        }
    }
    return palabras;
}

function obtenerSinonimos(palabra) {
    let opciones = [palabra];
    for (const grupo of gruposSinonimos) {
        if (grupo.includes(palabra)) {
            opciones = [...new Set([...opciones, ...grupo])];
        }
    }
    return opciones;
}

function distanciaLevenshtein(a, b) {
    const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
    for (let j = 0; j <= b.length; j++) matriz[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const costo = a[i - 1] === b[j - 1] ? 0 : 1;
            matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + costo);
        }
    }
    return matriz[a.length][b.length];
}

function sonSimilares(buscada, objetivo) {
    if (buscada === objetivo) return true;
    if (buscada.length >= 3 && objetivo.includes(buscada)) return true;
    const maxErrores = Math.floor(buscada.length / 4);
    if (maxErrores === 0) return false;
    if (Math.abs(buscada.length - objetivo.length) > maxErrores + 1) return false;
    return distanciaLevenshtein(buscada, objetivo) <= maxErrores;
}

function ejecutarBusqueda() {
    const rawQuery = document.getElementById("searchInput").value;
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (rawQuery.trim() === "") return;

    // Se obtienen las palabras ya fusionadas (ej: "cablecanal") y se filtran las palabras vacías
    const palabrasBusqueda = obtenerPalabrasClave(rawQuery)
        .filter(p => !palabrasVacias.has(p))
        .slice(0, 5);

    if (palabrasBusqueda.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">Por favor ingresá términos técnicos más específicos.<br><span style="font-size:0.75rem; font-weight:normal; color:var(--ngc-text-muted); display:block; margin-top:10px;">Ej: "tablero", "boca", "jabalina"</span></div>`;
        return;
    }

    const coincidencias = [];

    for (const item of allData) {
        const palabrasDelConcepto = obtenerPalabrasClave(item.concepto);
        
        const cumpleTodas = palabrasBusqueda.every(palabraBuscada => {
            const opcionesBuscadas = obtenerSinonimos(palabraBuscada);
            return opcionesBuscadas.some(opcion => {
                return palabrasDelConcepto.some(palabraConcepto => sonSimilares(opcion, palabraConcepto));
            });
        });

        if (cumpleTodas) {
            coincidencias.push(item);
            if (coincidencias.length >= 10) break; 
        }
    }

    if (coincidencias.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron precios referenciales.<br><span style="font-size:0.75rem; font-weight:normal; color:var(--ngc-text-muted); display:block; margin-top:10px;">Intentá usar palabras más cortas o generales. (Ej: "tablero", "boca", "jabalina")</span></div>`;
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
        card.className = "result-card gpu-accel"; 

        const mensajeWp = encodeURIComponent(`Hola Sergio, quisiera solicitar un presupuesto a medida basado en este concepto: "${item.concepto}". Vi que el valor referencial de mano de obra es de ${precioFormat}.`);
        const urlWp = `https://wa.me/543513559347?text=${mensajeWp}`;

        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${item.concepto}</span>
                <div class="price-container">
                    <span class="result-price">${precioFormat}</span>
                    <span class="price-note">Solo Mano de Obra</span>
                </div>
            </div>
            
            <div class="result-obs-preview">
                <span class="click-to-expand"><i class="fa-solid fa-chevron-down"></i> Toca para ver detalles</span>
            </div>
            
            <div class="result-details">
                <div class="detail-row obs-row">
                    <span class="detail-label">Observaciones:</span><br> 
                    ${item.observaciones ? item.observaciones : "Precio estimativo por el servicio de instalación. No incluye materiales."}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entidad Referencia:</span><br> ${item.organizacion}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Categoría:</span><br> ${item.tema}
                </div>
                
                <div class="wsp-section">
                    <a href="${urlWp}" target="_blank" class="btn-whatsapp">
                        <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> Consultar Viabilidad
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
    
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Buscador de Precios',
      text: 'Buscador de precios referenciales para trabajos eléctricos en Córdoba:',
      url: 'https://villaser.com.ar/buscadorinteligente'
    }).catch(console.error);
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent("Precios referenciales de trabajos eléctricos en Córdoba: https://villaser.com.ar/buscadorinteligente"), '_blank');
  }
    }
     

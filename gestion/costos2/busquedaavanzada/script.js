// --- LÓGICA DE TEMA AUTOMÁTICO EN TIEMPO REAL ---
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
    
    if (temaGuardado === 'system') {
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
});

// =========================================================
// CONEXIÓN GOOGLE SHEETS (MISMA BASE QUE MÓDULO COSTOS)
// =========================================================
const SHEET_ID = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
const URL_SHEET = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1`;

let allData = [];
let diccionarioSugerencias = [];
let seleccionPendiente = false;

// ==========================================
// 1. PALABRAS VACÍAS Y SINÓNIMOS
// ==========================================
const palabrasVacias = new Set([
    "electrico", "electrica", "el", "la", "los", "las", "un", "una", "unos", "unas",
    "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "durante", "en", "entre", "hacia", "hasta", "mediante", "para", "por", "x", "segun", "sin", "so", "sobre", "tras",
    "y", "e", "ni", "o", "u", "pero", "mas", "sino", "aunque", "porque", "pues", "como", "si", "que", "yo", "tu", "el", "ella", "ello", "nosotros", "nosotras", "vosotros", "vosotras",
    "ellos", "ellas", "me", "te", "se", "nos", "os", "lo", "la", "le", "los", "las", "les", "mi", "ti", "conmigo", "contigo", "consigo", "este", "ese", "aquel", "esta", "esa", "aquella", "estos", "esos", "aquellos", "estas", "esas", "aquellas", "esto", "eso", "aquello",
    "mio", "tuyo", "suyo", "nuestro", "vuestro", "alguien", "nadie", "algo", "nada", "cualquiera", "alguno", "ninguno", "quien", "cual", "cuales", "aqui", "ahi", "alli", "aca", "alla", "cerca", "lejos", "arriba", "abajo", "delante", "detras",
    "dentro", "fuera", "hoy", "ayer", "manana", "ahora", "antes", "despues", "luego", "tarde", "temprano", "pronto", "siempre", "nunca", "jamas", "ya", "todavia", "aun", "asi", "bien", "mal", "despacio", "deprisa",
    "muy", "mucho", "poco", "bastante", "demasiado", "mas", "menos", "tan", "tanto", "apenas", "casi", "medio", "tambien", "cierto", "claro", "exacto", "obvio", "no", "tampoco", "quiza", "quizas", "acaso",
    "bueno", "malo", "mejor", "peor", "mayor", "menor", "grande", "pequeno", "nuevo", "viejo", "facil", "dificil", "bonito", "feo", "rapido", "lento", "solo", "solamente"
]);

const gruposSinonimos = [
    ["termomagnetica", "termica", "fusible", "breaker"],
    ["interruptor", "llave", "perilla", "apagador"],
    ["timbre", "campanilla", "zumbador", "bocina", "pitido", "soneria", "portero", "llamador"],
    ["diferencial", "disyuntor", "salvavita", "salva"],
    ["tomacorriente", "toma", "enchufe", "modulo", "enchufes"],
    ["conductor", "cable", "alambre", "linea", "recableado", "cableado"],
    ["jabalina", "electrodo", "tierra", "pat", "puestaatierra"],
    ["luminaria", "lampara", "foco", "artefacto", "luz", "lus", "luces", "lamparita", "aplique"],
    ["instalacion", "instalar", "colocar", "instala", "montaje", "colocacion", "implementacion", "conexion", "cambio", "armado"],
    ["pilar", "acometida", "monofasico", "trifasico"],
    ["fexible", "corrugado", "manguera"],
    ["cano", "caneria", "tubo"],
    ["motor", "motores"],
    ["nuevo", "nueva"],
    ["exterior", "externo", "interperie", "afuera"],
    ["interior", "interno", "dentro", "adentro"],
    ["mono", "monofásico", "monofásica"],
    ["cablecanal", "canaleta", "cableducto", "canal", "moldura"], 
    ["apto", "certificado", "epec", "alta", "ersep"]
];

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosGoogleSheet();

    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    const suggestionsList = document.getElementById("suggestionsList");

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (searchInput && suggestionsList && e.target !== searchInput && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add("oculto");
        }
    });

    if (searchInput && btnBuscar) {
        searchInput.addEventListener("focus", function() {
            if (seleccionPendiente) { this.select(); seleccionPendiente = false; }
        });
        
        searchInput.addEventListener("click", function() {
            if (seleccionPendiente) { this.select(); seleccionPendiente = false; }
        });

        searchInput.addEventListener("input", () => {
            seleccionPendiente = false; 
            btnBuscar.disabled = searchInput.value.trim().length === 0;
            const text = searchInput.value;
            const words = text.split(/\s+/);
            const lastWord = words[words.length - 1]; 

            if (lastWord.length >= 3) mostrarSugerencias(lastWord, words);
            else suggestionsList.classList.add("oculto");
        });

        btnBuscar.addEventListener("click", () => {
            const textoOriginal = btnBuscar.innerHTML;
            btnBuscar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...';
            suggestionsList.classList.add("oculto"); 
            seleccionPendiente = true;

            setTimeout(() => {
                ejecutarBusqueda();
                btnBuscar.innerHTML = textoOriginal;
            }, 200);
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !btnBuscar.disabled) btnBuscar.click();
        });
    }

    // Lectura opcional de parámetros URL (?servicio=)
    const parametrosURL = new URLSearchParams(window.location.search);
    const servicioSolicitado = parametrosURL.get('servicio');

    if (servicioSolicitado) {
        const terminoBusqueda = servicioSolicitado.replace(/_/g, ' ');
        const temporizadorCarga = setInterval(() => {
            if (typeof allData !== 'undefined' && allData.length > 0) {
                clearInterval(temporizadorCarga); 
                if (searchInput && btnBuscar) {
                    searchInput.value = terminoBusqueda;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (suggestionsList) suggestionsList.classList.add("oculto");
                    setTimeout(() => btnBuscar.click(), 50);
                }
            }
        }, 100); 
    }
});

// ==========================================
// 2. DESCARGA DESDE GOOGLE SHEETS
// ==========================================
async function cargarDatosGoogleSheet() {
    const loadingCard = document.getElementById("loading");
    const appContainer = document.getElementById("app");
    const searchInput = document.getElementById("searchInput");

    try {
        const response = await fetch(URL_SHEET);
        if (!response.ok) throw new Error("No se pudo conectar con Google Sheets");
        
        const txt = await response.text();
        const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
        const rows = json.table?.rows || [];
        
        allData = [];
        rows.forEach(r => {
            if (!r.c) return;
            
            // Mapeo idéntico al módulo Costos:
            // Col A (0): Rubro/Tema | Col B (1): Concepto | Col C (2): Precio
            // Col D (3): Notas      | Col F (5): Código   | Col J (9): Fuente/Org
            const tema = String(r.c[0]?.v ?? "").trim();
            const concepto = String(r.c[1]?.v ?? "").trim();
            const precio = r.c[2]?.v;
            const notas = String(r.c[3]?.v ?? "").trim();
            const codigo = String(r.c[5]?.v ?? "").trim();
            const fuente = String(r.c[9]?.v ?? "").trim();

            if (!concepto) return;
            if (concepto.toLowerCase() === "concepto" || concepto.toLowerCase() === "trabajo") return;

            allData.push({
                tema: tema || "General",
                concepto: concepto,
                precio: precio !== null && precio !== undefined ? precio : "",
                observaciones: notas,
                codigo: codigo || "S/C",
                organizacion: fuente || "General"
            });
        });

        construirDiccionarioSugerencias(); 

        if (loadingCard) loadingCard.classList.add("oculto");
        if (appContainer) appContainer.classList.remove("oculto");
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.focus();
        }
    } catch (error) {
        if (loadingCard) {
            loadingCard.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--error-red); font-size: 3rem; margin-bottom: 15px;"></i>
                <br><span style="color: var(--ngc-text-main); font-weight: bold;">Error de conexión con Google Sheets.</span>
                <p style="font-size: 0.8rem; color: var(--ngc-text-faded); margin-top: 8px;">Verificá tu conexión a internet e intentá nuevamente.</p>
                <button type="button" class="corp-btn" style="margin-top: 15px;" onclick="location.reload()">Reintentar</button>
            `;
        }
        console.error(error);
    }
}

// ==========================================
// 3. FUNCIONES DEL MOTOR DE BÚSQUEDA
// ==========================================
function mostrarSugerencias(lastWord, allWords) {
    const suggestionsList = document.getElementById('suggestionsList');
    const searchInput = document.getElementById("searchInput");
    
    const lastWordNorm = lastWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const lastWordFonetica = normalizarFoneticaYPlural(lastWordNorm);
    let matches = new Set(); 
    
    const checkMatchSugerencia = (palabraCorrecta) => {
        const pNorm = palabraCorrecta.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const pFon = normalizarFoneticaYPlural(pNorm);
        
        if (pNorm.includes(lastWordNorm)) return true;
        if (pFon.includes(lastWordFonetica)) return true;
        
        const prefijo = pNorm.substring(0, lastWordNorm.length);
        const maxErrores = Math.floor(lastWordNorm.length / 3) + 1;
        if (distanciaLevenshtein(lastWordNorm, prefijo) <= maxErrores) return true;
        
        return false;
    };

    diccionarioSugerencias.forEach(palabra => {
        if (checkMatchSugerencia(palabra)) {
            matches.add(palabra); 
            obtenerSinonimos(palabra).forEach(s => matches.add(s));
        }
    });

    gruposSinonimos.forEach(grupo => {
        grupo.forEach(sinonimo => {
            if (checkMatchSugerencia(sinonimo)) {
                matches.add(sinonimo);
                grupo.forEach(s => matches.add(s));
            }
        });
    });

    let matchesArray = Array.from(matches);
    matchesArray.sort((a, b) => {
        const aNorm = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const bNorm = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const aFon = normalizarFoneticaYPlural(aNorm);
        const bFon = normalizarFoneticaYPlural(bNorm);
        const aStarts = (aNorm.startsWith(lastWordNorm) || aFon.startsWith(lastWordFonetica)) ? -1 : 1;
        const bStarts = (bNorm.startsWith(lastWordNorm) || bFon.startsWith(lastWordFonetica)) ? -1 : 1;
        
        if (aStarts !== bStarts) return aStarts - bStarts;
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    });

    matchesArray = matchesArray.slice(0, 6);

    if (matchesArray.length === 0) {
        suggestionsList.classList.add("oculto");
        return;
    }

    suggestionsList.innerHTML = '';
    matchesArray.forEach((match, idx) => {
        const li = document.createElement('li');
        li.textContent = match;
        li.style.padding = '11px 14px';
        li.style.cursor = 'pointer';
        li.style.color = 'var(--ngc-text-main)';
        li.style.fontSize = '0.9rem';
        if (idx < matchesArray.length - 1) {
            li.style.borderBottom = '1px solid var(--ngc-privacy-border)';
        }
        
        li.addEventListener('click', () => {
            allWords[allWords.length - 1] = match;
            searchInput.value = allWords.join(' ') + ' ';
            suggestionsList.classList.add("oculto");
            document.getElementById("btnBuscar").disabled = false;
            searchInput.focus();
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);
        });
        suggestionsList.appendChild(li);
    });
    suggestionsList.classList.remove('oculto');
}

function construirDiccionarioSugerencias() {
    let palabras = new Set();
    allData.forEach(item => {
        let textoLimpio = item.concepto.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, ' ');
        let tokens = textoLimpio.split(/\s+/);
        tokens.forEach(word => {
            let w = word.toLowerCase();
            if (w.length >= 3 && !palabrasVacias.has(w)) palabras.add(w);
        });
    });
    diccionarioSugerencias = Array.from(palabras);
}

function normalizarFoneticaYPlural(texto) {
    return texto.split(/\s+/).map(p => {
        p = p.replace(/ll/g, "y").replace(/y/g, "i").replace(/v/g, "b").replace(/z/g, "s")
             .replace(/ce/g, "se").replace(/ci/g, "si").replace(/ch/g, "x").replace(/h/g, "").replace(/x/g, "ch");       
        if (p.length > 4 && p.endsWith("es")) p = p.slice(0, -2);
        else if (p.length > 3 && p.endsWith("s")) p = p.slice(0, -1);
        return p;
    }).join(" ");
}

function obtenerPalabrasClave(texto) {
    let txt = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
    let palabras = txt.split(/\s+/).filter(p => p.length > 0);
    for (let i = 0; i < palabras.length; i++) {
        if (palabras[i] === "cable" && palabras[i+1] === "canal") {
            palabras[i] = "cablecanal"; palabras.splice(i+1, 1); i--; 
        } else if (palabras[i] === "puesta" && palabras[i+1] === "a" && palabras[i+2] === "tierra") {
            palabras[i] = "puestaatierra"; palabras.splice(i+1, 2); i--; 
        }
    }
    return palabras;
}

function obtenerSinonimos(palabra) {
    let opciones = [palabra];
    for (const grupo of gruposSinonimos) {
        if (grupo.includes(palabra)) opciones = [...new Set([...opciones, ...grupo])];
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

    const palabrasBusqueda = obtenerPalabrasClave(rawQuery).filter(p => !palabrasVacias.has(p)).slice(0, 5);

    if (palabrasBusqueda.length === 0) {
        resultsContainer.innerHTML = `
            <div class="corp-card gpu-accel" style="text-align: center; padding: 25px 15px;">
                <span style="color: var(--ngc-text-main); font-weight: 600;">Por favor ingresá términos técnicos específicos.</span>
                <span style="font-size: 0.8rem; color: var(--ngc-text-faded); display: block; margin-top: 10px;">Ej: "tablero", "boca", "jabalina"</span>
            </div>`;
        return;
    }

    const coincidencias = [];
    const busquedaCompleta = rawQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const busquedaCompletaNorm = normalizarFoneticaYPlural(busquedaCompleta);

    for (const item of allData) {
        let score = 0; 
        const conceptoNormalizado = item.concepto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const conceptoNormalizadoFonetico = normalizarFoneticaYPlural(conceptoNormalizado);
        const palabrasDelConcepto = obtenerPalabrasClave(item.concepto);
        
        if (conceptoNormalizado.includes(busquedaCompleta)) {
            score += 100;
            if (conceptoNormalizado === busquedaCompleta) score += 50; 
        } else if (conceptoNormalizadoFonetico.includes(busquedaCompletaNorm)) {
            score += 80;
            if (conceptoNormalizadoFonetico === busquedaCompletaNorm) score += 40; 
        }

        let cumpleTodas = true;
        for (const palabraBuscada of palabrasBusqueda) {
            const opcionesBuscadas = obtenerSinonimos(palabraBuscada);
            let mejorPuntajePalabra = 0;
            let palabraEncontrada = false;

            for (const opcion of opcionesBuscadas) {
                const opcionFonetica = normalizarFoneticaYPlural(opcion);
                for (const palabraConcepto of palabrasDelConcepto) {
                    const conceptoFonetico = normalizarFoneticaYPlural(palabraConcepto);

                    if (opcion === palabraConcepto) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, opcion === palabraBuscada ? 10 : 7);
                    } else if (opcionFonetica === conceptoFonetico) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, opcion === palabraBuscada ? 9 : 6);
                    } else if (sonSimilares(opcion, palabraConcepto)) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, 4);
                    } else if (sonSimilares(opcionFonetica, conceptoFonetico)) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, 3);
                    }
                }
            }
            if (!palabraEncontrada) { cumpleTodas = false; break; }
            score += mejorPuntajePalabra;
        }
        if (cumpleTodas) coincidencias.push({ item: item, score: score });
    }

    coincidencias.sort((a, b) => b.score - a.score);
    const mejoresResultados = coincidencias.slice(0, 10).map(c => c.item);

    if (mejoresResultados.length === 0) {
        resultsContainer.innerHTML = `
            <div class="corp-card gpu-accel" style="text-align: center; padding: 25px 15px;">
                <span style="color: var(--error-red); font-weight: 600;">No se encontraron precios referenciales.</span>
                <span style="font-size: 0.8rem; color: var(--ngc-text-faded); display: block; margin-top: 10px;">Intentá usar palabras más cortas o generales. (Ej: "tablero", "boca", "jabalina")</span>
            </div>`;
        return;
    }

    mejoresResultados.forEach(item => {
        let precioFormat = "$ Consultar";
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "" && item.precio !== null) {
            precioFormat = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else if (item.precio) {
            precioFormat = `$ ${item.precio}`;
        }

        const card = document.createElement("div");
        card.className = "corp-card gpu-accel"; 
        card.style.cursor = "pointer";
        card.style.padding = "20px";

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="flex: 1; padding-right: 15px;">
                    <span style="display: inline-block; font-size: 0.7rem; background: var(--ngc-neon); color: #000; padding: 2px 7px; border-radius: 5px; font-weight: bold; margin-bottom: 6px;">${item.codigo}</span>
                    <span style="display: block; font-size: 0.95rem; font-weight: 700; color: var(--ngc-text-main); line-height: 1.4;">${item.concepto}</span>
                </div>
                <div style="text-align: right; min-width: 95px;">
                    <span style="font-size: 1.15rem; font-weight: 800; color: var(--success-green); display: block;">${precioFormat}</span>
                    <span style="font-size: 0.65rem; color: var(--ngc-text-faded); text-transform: uppercase; font-weight: 600;">Solo M. de Obra</span>
                </div>
            </div>
            
            <div class="result-obs-preview" style="font-size: 0.8rem; color: var(--ngc-neon); display: flex; align-items: center; gap: 6px; font-weight: 500;">
                <i class="fa-solid fa-chevron-down acc-icon-indicator" style="transition: transform 0.3s;"></i> <span class="txt-ver-mas">Ver detalles</span>
            </div>
            
            <div class="result-details" style="margin-top: 15px; border-top: 1px solid var(--ngc-privacy-border); padding-top: 15px; display: none;">
                <div style="margin-bottom: 12px; font-size: 0.85rem;">
                    <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Notas Aclaratorias / Condiciones</span><br> 
                    <span style="color: var(--ngc-text-main); display: block; margin-top: 3px; white-space: pre-wrap;">${item.observaciones ? item.observaciones : "Sin notas aclaratorias adicionales para este concepto."}</span>
                </div>
                <div style="display: flex; gap: 15px; margin-bottom: 0;">
                    <div style="flex: 1; font-size: 0.85rem;">
                        <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Fuente Info</span><br> 
                        <span style="color: var(--ngc-text-main); display: block; margin-top: 3px;">${item.organizacion}</span>
                    </div>
                    <div style="flex: 1; font-size: 0.85rem;">
                        <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Categoría</span><br> 
                        <span style="color: var(--ngc-text-main); display: block; margin-top: 3px;">${item.tema}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            card.classList.toggle("active");
            
            const details = card.querySelector('.result-details');
            const icon = card.querySelector('.acc-icon-indicator');
            const txt = card.querySelector('.txt-ver-mas');
            
            if (card.classList.contains("active")) {
                details.style.display = "block";
                icon.style.transform = "rotate(180deg)";
                txt.textContent = "Ocultar detalles";
            } else {
                details.style.display = "none";
                icon.style.transform = "rotate(0deg)";
                txt.textContent = "Ver detalles";
            }
        });

        resultsContainer.appendChild(card);
    });
}

function busquedaRapida(termino) {
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    if (searchInput && btnBuscar) {
        searchInput.value = termino;
        btnBuscar.disabled = false;
        seleccionPendiente = true; 
        btnBuscar.click();
    }
}

function limpiarBusqueda() {
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    const suggestionsList = document.getElementById("suggestionsList");
    const resultsContainer = document.getElementById("resultsContainer");

    if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
    }
    if (btnBuscar) btnBuscar.disabled = true;
    if (suggestionsList) suggestionsList.classList.add("oculto");
    if (resultsContainer) resultsContainer.innerHTML = "";
    seleccionPendiente = false;
}

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../../agenda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '#', active: true },
        { nombre: 'Calculadora', icon: 'fa-calculator', url: '../../leyescalc/index.html' },
        { nombre: 'Proveedores', icon: 'fa-truck-fast', url: '../../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-book-open', url: '../../catalogos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
        // Centra automáticamente el botón activo en la vista
    requestAnimationFrame(() => {
        const btnActivo = footer.querySelector('.corp-nav-item.active');
        if (btnActivo) {
            const footerRect = footer.getBoundingClientRect();
            const btnRect = btnActivo.getBoundingClientRect();
            footer.scrollLeft += (btnRect.left - footerRect.left) - (footerRect.width / 2) + (btnRect.width / 2);
        }
    });
    
});

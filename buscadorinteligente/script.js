document.addEventListener("DOMContentLoaded", () => {
    // 1. LÓGICA DE ANIMACIÓN FADE-IN EN ESCALERA (SCROLL)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -20px 0px', 
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        const elementosVisibles = entries.filter(entry => entry.isIntersecting);
        elementosVisibles.forEach((entry, index) => {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 120); 
            observer.unobserve(entry.target);
        });
    }, observerOptions);

    const elementosAnimar = document.querySelectorAll('.fade-in-up');
    elementosAnimar.forEach(el => observer.observe(el));

    // Renderizar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// =========================================================
// SCRIPTS ESPECÍFICOS DEL "BUSCADOR INTELIGENTE"
// =========================================================

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
    cargarExcel();

    // ==========================================
    // LÓGICA DEL BUSCADOR Y AUTOCOMPLETADO
    // ==========================================
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    const suggestionsList = document.getElementById("suggestionsList");

    // Cerrar sugerencias al hacer click fuera
    document.addEventListener("click", (e) => {
        if(searchInput && suggestionsList && e.target !== searchInput && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add("oculto");
        }
    });

    if(searchInput && btnBuscar) {
        
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
            btnBuscar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
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

    // ==========================================
    // LÓGICA CLON FLOTANTE CTA
    // ==========================================
/*    const ctaOriginal = document.querySelector('.cta-escritorio');
    const colDerecha = document.querySelector('.col-derecha');
    
    if (ctaOriginal && colDerecha) {
        const ctaClone = ctaOriginal.cloneNode(true);
        ctaClone.classList.add('cta-flotante-clone');
        ctaClone.classList.remove('separador-bloque'); 
        document.body.appendChild(ctaClone);

        let isColDerechaVisible = false;
        
        const observer = new IntersectionObserver((entries) => {
            isColDerechaVisible = entries[0].isIntersecting;
            actualizarCtaFlotante();
        }, { threshold: 0.05 }); 
        
        observer.observe(colDerecha);
        window.addEventListener('scroll', actualizarCtaFlotante, { passive: true });

        function actualizarCtaFlotante() {
            if (window.innerWidth >= 1024) return;
            if (window.scrollY > 300 && !isColDerechaVisible) ctaClone.classList.add('visible');
            else ctaClone.classList.remove('visible'); 
        }
    } */

    // ==========================================
    // LECTURA DE URL PARAMS (?servicio=)
    // ==========================================
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
// 2. FUNCIONES DEL MOTOR DE BÚSQUEDA
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
    matchesArray.forEach(match => {
        const li = document.createElement('li');
        li.textContent = match; 
        
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

        construirDiccionarioSugerencias(); 
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
        resultsContainer.innerHTML = `<div class="corp-card fade-in-up visible" style="text-align:center; padding: 25px 15px;"><span style="color:var(--ngc-text-main); font-weight:600;">Por favor ingresá términos técnicos específicos.</span><br><span style="font-size:0.8rem; color:var(--ngc-text-faded); display:block; margin-top:10px;">Ej: "tablero", "boca", "jabalina"</span></div>`;
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
        resultsContainer.innerHTML = `<div class="corp-card fade-in-up visible" style="text-align:center; padding: 25px 15px;"><span style="color:var(--error-red); font-weight:600;">No se encontraron precios referenciales.</span><br><span style="font-size:0.8rem; color:var(--ngc-text-faded); display:block; margin-top:10px;">Intentá usar palabras más cortas o generales. (Ej: "tablero", "boca", "jabalina")</span></div>`;
        return;
    }

    mejoresResultados.forEach(item => {
        let precioFormat = "$ Consultar";
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "") {
            precioFormat = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else if (item.precio) {
            precioFormat = `$ ${item.precio}`;
        }

        const card = document.createElement("div");
        
        // ACÁ ESTÁ LA MAGIA DEL ESTILO: usamos corp-card para los resultados
        card.className = "corp-card fade-in-up visible"; 
        card.style.cursor = "pointer";
        card.style.padding = "20px";

        const mensajeWp = encodeURIComponent(`Hola Sergio, quisiera solicitar un presupuesto a medida basado en este concepto: "${item.concepto}". Vi que el valor referencial de mano de obra es de ${precioFormat}.`);
        const urlWp = `https://wa.me/543513559347?text=${mensajeWp}`;

        // Reestructurado al 100% con HTML en línea para evitar requerir más CSS externo
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <span style="font-size: 0.95rem; font-weight: 700; color: var(--ngc-text-main); flex: 1; padding-right: 15px; line-height: 1.4;">${item.concepto}</span>
                <div style="text-align: right; min-width: 90px;">
                    <span style="font-size: 1.1rem; font-weight: 700; color: var(--ngc-neon); display: block;">${precioFormat}</span>
                    <span style="font-size: 0.65rem; color: var(--ngc-text-faded); text-transform: uppercase; font-weight: 600;">Solo M. de Obra</span>
                </div>
            </div>
            
            <div class="result-obs-preview" style="font-size: 0.8rem; color: var(--ngc-neon); display: flex; align-items: center; gap: 6px; font-weight: 500;">
                <i class="fa-solid fa-chevron-down acc-icon-indicator" style="transition: transform 0.3s;"></i> <span class="txt-ver-mas">Ver detalles</span>
            </div>
            
            <div class="result-details" style="margin-top: 15px; border-top: 1px solid var(--ngc-privacy-border); padding-top: 15px; display: none;">
                <div style="margin-bottom: 12px; font-size: 0.85rem;">
                    <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Observaciones</span><br> 
                    <span style="color: var(--ngc-text-main); display: block; margin-top: 3px;">${item.observaciones ? item.observaciones : "Precio estimativo por el servicio de instalación. No incluye materiales."}</span>
                </div>
                <div style="display: flex; gap: 15px; margin-bottom: 18px;">
                    <div style="flex: 1; font-size: 0.85rem;">
                        <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Entidad</span><br> 
                        <span style="color: var(--ngc-text-main); display: block; margin-top: 3px;">${item.organizacion}</span>
                    </div>
                    <div style="flex: 1; font-size: 0.85rem;">
                        <span style="color: var(--ngc-text-faded); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">Categoría</span><br> 
                        <span style="color: var(--ngc-text-main); display: block; margin-top: 3px;">${item.tema}</span>
                    </div>
                </div>
                
                <a href="${urlWp}" target="_blank" class="corp-btn success-btn btn-whatsapp" style="width: 100%;">
                    <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> Consultar Viabilidad
                </a>
            </div>
        `;

        // Lógica de acordeón resuelta en JavaScript (sin tocar CSS extra)
        card.addEventListener("click", (e) => {
            if (e.target.closest('.btn-whatsapp')) return; // Evita que se abra/cierre si tocás el botón
            
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
    if(searchInput && btnBuscar) {
        searchInput.value = termino;
        btnBuscar.disabled = false;
        seleccionPendiente = true; 
        btnBuscar.click();
    }
}

// LÓGICA PARA COMPARTIR LA WEB (Nativo en celulares)
function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Precios Referenciales de Mano de Obra | Villaser Electricista Categoría III',
            text: 'Buscador de precios referenciales de mano de obra eléctrica en Córdoba. Consultá costos estimativos para instalaciones y reparaciones.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
}


    

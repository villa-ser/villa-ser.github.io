// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

let allData = [];
let diccionarioSugerencias = []; // Almacenará las palabras únicas para autocompletar
let seleccionPendiente = false;  // Controla cuándo se debe seleccionar todo el texto

// ==========================================
// 0.5. PALABRAS VACÍAS (STOPWORDS)
// ==========================================
const palabrasVacias = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "durante",
    "en", "entre", "hacia", "hasta", "mediante", "para", "por", "x", "segun", "sin", "so", "sobre", "tras",
    "y", "e", "ni", "o", "u", "pero", "mas", "sino", "aunque", "porque", "pues", "como", "si", "que",
    "yo", "tu", "el", "ella", "ello", "nosotros", "nosotras", "vosotros", "vosotras",
    "ellos", "ellas", "me", "te", "se", "nos", "os", "lo", "la", "le", "los", "las", "les",
    "mi", "ti", "conmigo", "contigo", "consigo",
    "este", "ese", "aquel", "esta", "esa", "aquella", "estos", "esos", "aquellos",
    "estas", "esas", "aquellas", "esto", "eso", "aquello",
    "mio", "tuyo", "suyo", "nuestro", "vuestro",
    "alguien", "nadie", "algo", "nada", "cualquiera", "alguno", "ninguno", "quien", "cual", "cuales",
    "aqui", "ahi", "alli", "aca", "alla", "cerca", "lejos", "arriba", "abajo", "delante", "detras",
    "dentro", "fuera", "hoy", "ayer", "manana", "ahora", "antes", "despues", "luego", "tarde", "temprano",
    "pronto", "siempre", "nunca", "jamas", "ya", "todavia", "aun", "asi", "bien", "mal", "despacio", "deprisa",
    "muy", "mucho", "poco", "bastante", "demasiado", "mas", "menos", "tan", "tanto",
    "apenas", "casi", "medio", "tambien", "cierto", "claro", "exacto", "obvio",
    "no", "tampoco", "quiza", "quizas", "acaso",
    "bueno", "malo", "mejor", "peor", "mayor", "menor", "grande", "pequeno", "nuevo", "viejo",
    "facil", "dificil", "bonito", "feo", "rapido", "lento", "solo", "solamente"
]);

// ==========================================
// 1. DICCIONARIO DE SINÓNIMOS
// ==========================================
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
    ["exterior", "externo", "interperie", "afuera"],
    ["interior", "interno", "dentro", "adentro"],
    ["mono", "monofásico", "monofásica"],
    ["cablecanal", "canaleta", "cableducto", "canal", "moldura"], 
    ["apto", "certificado", "epec", "alta", "ersep"]
];

document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    cargarExcel();

    // ==========================================
    // LÓGICA DEL MENÚ FLOTANTE SUPERIOR
    // ==========================================
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        document.addEventListener('click', (e) => {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // LÓGICA DEL MODO DÍA / MODO NOCHE
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        if (temaGuardado === 'light') iconTema.classList.replace('fa-sun', 'fa-moon');

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
        
        // --- SELECCIÓN AUTOMÁTICA SOLO DESPUÉS DE BUSCAR ---
        searchInput.addEventListener("focus", function() {
            if (seleccionPendiente) {
                this.select();
                seleccionPendiente = false; // Se resetea para que no vuelva a seleccionar al seguir escribiendo
            }
        });
        
        searchInput.addEventListener("click", function() {
            if (seleccionPendiente) {
                this.select();
                seleccionPendiente = false;
            }
        });

        // Escucha al escribir
        searchInput.addEventListener("input", () => {
            seleccionPendiente = false; // Si se pone a escribir, cancelamos cualquier selección pendiente
            btnBuscar.disabled = searchInput.value.trim().length === 0;

            const text = searchInput.value;
            const words = text.split(/\s+/);
            const lastWord = words[words.length - 1]; // La palabra que el usuario está escribiendo ahora

            if (lastWord.length >= 3) {
                mostrarSugerencias(lastWord, words);
            } else {
                suggestionsList.classList.add("oculto");
            }
        });

        btnBuscar.addEventListener("click", () => {
            const textoOriginal = btnBuscar.innerHTML;
            btnBuscar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            suggestionsList.classList.add("oculto"); // Cierra al buscar
            
            // Al hacer una búsqueda, marcamos que el próximo toque a la caja debe seleccionar todo
            seleccionPendiente = true;

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

    // ==========================================
    // --- LÓGICA CLON FLOTANTE CTA ---
    // ==========================================
    const ctaOriginal = document.querySelector('.cta-escritorio');
    const colDerecha = document.querySelector('.col-derecha');
    
    if (ctaOriginal && colDerecha) {
        // Clonamos el CTA Original y le cambiamos su comportamiento
        const ctaClone = ctaOriginal.cloneNode(true);
        ctaClone.classList.add('cta-flotante-clone');
        ctaClone.classList.remove('separador-bloque'); // Quitamos margenes extra
        document.body.appendChild(ctaClone);

        let isColDerechaVisible = false;
        
        // El Observer se da cuenta cuando llegamos al fondo original
        const observer = new IntersectionObserver((entries) => {
            isColDerechaVisible = entries[0].isIntersecting;
            actualizarCtaFlotante();
        }, { threshold: 0.05 }); // Con que se vea apenas el 5% de la caja real, frena
        
        observer.observe(colDerecha);
        window.addEventListener('scroll', actualizarCtaFlotante, { passive: true });

        function actualizarCtaFlotante() {
            // Se inactiva en PC (pantallas grandes) porque la columna siempre está al lado
            if (window.innerWidth >= 1024) return;
            
            // Aparece si el usuario scrolleó bastante (ej. leyendo resultados) Y aún no llegó abajo
            if (window.scrollY > 300 && !isColDerechaVisible) {
                ctaClone.classList.add('visible');
            } else {
                ctaClone.classList.remove('visible'); // Se oculta suave para no tapar los demás elementos
            }
        }
    }
});

// ==========================================
// FUNCIONES DE AUTOCOMPLETADO Y SUGERENCIAS
// ==========================================
function mostrarSugerencias(lastWord, allWords) {
    const suggestionsList = document.getElementById('suggestionsList');
    const searchInput = document.getElementById("searchInput");
    
    const lastWordNorm = lastWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const lastWordFonetica = normalizarFoneticaYPlural(lastWordNorm);
    
    let matches = new Set(); // Evita palabras duplicadas automáticamente
    
    // Motor de detección para sugerencias (evalúa typos y fonética)
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
            const sinonimos = obtenerSinonimos(palabra);
            sinonimos.forEach(s => matches.add(s));
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
            // Reemplaza la última palabra por la correcta seleccionada y agrega espacio
            allWords[allWords.length - 1] = match;
            searchInput.value = allWords.join(' ') + ' ';
            suggestionsList.classList.add("oculto");
            
            // Habilitamos el botón buscar
            document.getElementById("btnBuscar").disabled = false;

            // Focuseamos y aseguramos que el cursor quede al final (para seguir escribiendo)
            searchInput.focus();
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);
        });
        suggestionsList.appendChild(li);
    });
    suggestionsList.classList.remove('oculto');
}

// Función que extrae las palabras únicas del Excel para el diccionario
function construirDiccionarioSugerencias() {
    let palabras = new Set();
    allData.forEach(item => {
        let textoLimpio = item.concepto.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, ' ');
        let tokens = textoLimpio.split(/\s+/);
        
        tokens.forEach(word => {
            let w = word.toLowerCase();
            if (w.length >= 3 && !palabrasVacias.has(w)) {
                palabras.add(w);
            }
        });
    });
    diccionarioSugerencias = Array.from(palabras);
}

// Carga Inicial del Excel
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

// --------------------------------------------------------------------
// NORMALIZA FONÉTICA, PLURALES Y LETRAS CONFUSAS
// --------------------------------------------------------------------
function normalizarFoneticaYPlural(texto) {
    return texto.split(/\s+/).map(p => {
        p = p.replace(/ll/g, "y");       
        p = p.replace(/y/g, "i");        
        p = p.replace(/v/g, "b");        
        p = p.replace(/z/g, "s");        
        p = p.replace(/ce/g, "se");      
        p = p.replace(/ci/g, "si");      
        p = p.replace(/ch/g, "x");       
        p = p.replace(/h/g, "");         
        p = p.replace(/x/g, "ch");       
        
        if (p.length > 4 && p.endsWith("es")) {
            p = p.slice(0, -2);
        } else if (p.length > 3 && p.endsWith("s")) {
            p = p.slice(0, -1);
        }
        
        return p;
    }).join(" ");
}

function obtenerPalabrasClave(texto) {
    let txt = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
    let palabras = txt.split(/\s+/).filter(p => p.length > 0);
    
    for (let i = 0; i < palabras.length; i++) {
        if (palabras[i] === "cable" && palabras[i+1] === "canal") {
            palabras[i] = "cablecanal";
            palabras.splice(i+1, 1);
            i--; 
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

// LÓGICA PARA DETECTAR ERRORES DE TIPEO
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

 // --------------------------------------------------------------------
// MOTOR DE BÚSQUEDA (SE EJECUTA AL DAR CLICK EN "BUSCAR")
// --------------------------------------------------------------------
function ejecutarBusqueda() {
    const rawQuery = document.getElementById("searchInput").value;
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (rawQuery.trim() === "") return;

    const palabrasBusqueda = obtenerPalabrasClave(rawQuery)
        .filter(p => !palabrasVacias.has(p))
        .slice(0, 5);

    if (palabrasBusqueda.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">Por favor ingresá términos técnicos más específicos.<br><span style="font-size:0.75rem; font-weight:normal; color:var(--ngc-text-muted); display:block; margin-top:10px;">Ej: "tablero", "boca", "jabalina"</span></div>`;
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
        } 
        else if (conceptoNormalizadoFonetico.includes(busquedaCompletaNorm)) {
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
                    } 
                    else if (opcionFonetica === conceptoFonetico) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, opcion === palabraBuscada ? 9 : 6);
                    }
                    else if (sonSimilares(opcion, palabraConcepto)) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, 4);
                    }
                    else if (sonSimilares(opcionFonetica, conceptoFonetico)) {
                        palabraEncontrada = true;
                        mejorPuntajePalabra = Math.max(mejorPuntajePalabra, 3);
                    }
                }
            }

            if (!palabraEncontrada) {
                cumpleTodas = false;
                break; 
            }
            score += mejorPuntajePalabra;
        }

        if (cumpleTodas) {
            coincidencias.push({ item: item, score: score });
        }
    }

    coincidencias.sort((a, b) => b.score - a.score);
    const mejoresResultados = coincidencias.slice(0, 10).map(c => c.item);

    if (mejoresResultados.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron precios referenciales.<br><span style="font-size:0.75rem; font-weight:normal; color:var(--ngc-text-muted); display:block; margin-top:10px;">Intentá usar palabras más cortas o generales. (Ej: "tablero", "boca", "jabalina")</span></div>`;
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

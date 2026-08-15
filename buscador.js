// Variable global para almacenar los datos del Excel
let excelData = [];

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const fileInput = document.getElementById("excelFileInput");
    const btnBuscar = document.getElementById("btnBuscar");

    // 1. Intentar cargar el archivo automáticamente al abrir la página
    cargarExcelAutomatico();

    // 2. Escuchar la carga manual
    fileInput.addEventListener("change", manejarCargaManual);

    // 3. Habilitar el botón SOLO si hay más de 2 letras escritas Y el Excel está cargado
    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim().length >= 2 && excelData.length > 0) {
            btnBuscar.disabled = false;
        } else {
            btnBuscar.disabled = true;
        }
    });

    // 4. Ejecutar la búsqueda al hacer clic en el botón
    btnBuscar.addEventListener("click", realizarBusqueda);

    // 5. Permitir buscar presionando la tecla "Enter"
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !btnBuscar.disabled) {
            realizarBusqueda();
        }
    });
});

// Función para cargar automáticamente 'PRESUPUESTO V 5.xlsx'
async function cargarExcelAutomatico() {
    const statusMessage = document.getElementById("statusMessage");
    const fileUploadContainer = document.getElementById("fileUploadContainer");
    const btnBuscar = document.getElementById("btnBuscar");
    const searchInput = document.getElementById("searchInput");

    try {
        const response = await fetch('PRESUPUESTO V 5.xlsx');
        if (!response.ok) throw new Error("No se pudo descargar el archivo.");
        
        const arrayBuffer = await response.arrayBuffer();
        procesarBufferExcel(arrayBuffer);
        
        statusMessage.textContent = "✓ Base de datos conectada correctamente.";
        statusMessage.style.color = "var(--gnc-success)";
        
        // Si el usuario ya había escrito antes de que cargara, habilitamos el botón
        if (searchInput.value.trim().length >= 2) {
            btnBuscar.disabled = false;
        }

    } catch (error) {
        console.warn("Carga automática fallida. Requiere carga manual.");
        statusMessage.textContent = "⚠ Por favor, selecciona el archivo PRESUPUESTO V 5.xlsx manualmente.";
        statusMessage.style.color = "#ffc107";
        fileUploadContainer.style.display = "flex";
    }
}

// Función para manejar el botón de carga manual
function manejarCargaManual(evento) {
    const file = evento.target.files[0];
    const statusMessage = document.getElementById("statusMessage");
    const btnBuscar = document.getElementById("btnBuscar");
    const searchInput = document.getElementById("searchInput");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        procesarBufferExcel(arrayBuffer);
        
        statusMessage.textContent = "✓ Base de datos cargada manualmente.";
        statusMessage.style.color = "var(--gnc-success)";
        document.getElementById("fileUploadContainer").style.display = "none";
        
        // Si el usuario ya había escrito antes de subir el archivo, habilitamos el botón
        if (searchInput.value.trim().length >= 2) {
            btnBuscar.disabled = false;
        }
    };
    reader.readAsArrayBuffer(file);
}

// Función central para leer el Excel mediante SheetJS
function procesarBufferExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeraHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[primeraHoja];
    
    // Convertir hoja a JSON mapeando columnas a letras
    excelData = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
}

// Lógica del buscador manual
function realizarBusqueda() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    if (searchInput.length < 2) {
        resultsContainer.innerHTML = "";
        return;
    }

    // Dividir palabras, limpiar espacios vacíos y limitar estrictamente a 5 palabras
    let palabrasClave = searchInput.toLowerCase().split(/\s+/).filter(p => p.length > 0);
    if (palabrasClave.length > 5) {
        palabrasClave = palabrasClave.slice(0, 5);
    }

    const resultados = [];

    // Iterar saltando la fila 0 (encabezado del Excel)
    for (let i = 1; i < excelData.length; i++) {
        const fila = excelData[i];
        
        // RESTRICCIÓN ABSOLUTA: Leer y buscar ÚNICAMENTE en la columna D (Concepto)
        const conceptoColumnaD = String(fila['D'] || "").toLowerCase();

        // Chequear que todas las palabras ingresadas existan dentro de la celda D
        const coincidenciaExacta = palabrasClave.every(palabra => conceptoColumnaD.includes(palabra));

        if (coincidenciaExacta) {
            resultados.push(fila);
            // Límite de 6 resultados
            if (resultados.length >= 6) break; 
        }
    }

    renderizarResultados(resultados, palabrasClave);
}

// Resaltador optimizado para no romper etiquetas HTML
function resaltarTexto(texto, palabrasClave) {
    if (!texto) return "";
    
    // Escapar caracteres especiales y ordenar de mayor a menor longitud
    const palabrasValidas = palabrasClave
        .filter(p => p.length > 0)
        .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length);

    if (palabrasValidas.length === 0) return texto;

    const regex = new RegExp(`(${palabrasValidas.join('|')})`, 'gi');
    return texto.replace(regex, `<span class="gnc-highlight">$1</span>`);
}

// Generar el HTML de las tarjetas
function renderizarResultados(resultados, palabrasClave) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    // Volver a inicializar los iconos en caso de que se necesiten
    if(window.lucide) { lucide.createIcons(); }

    if (resultados.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron resultados para esta búsqueda.</div>`;
        return;
    }

    resultados.forEach(fila => {
        // ASIGNACIÓN DE TODAS LAS COLUMNAS REQUERIDAS (A HASTA F)
        const colA = fila['A'] || "-";
        const organizacion = fila['B'] || "No especificado";
        const tema = fila['C'] || "General";
        const concepto = fila['D'] || "Mano de obra";
        const precio = fila['E'] || "Consultar";
        const observaciones = fila['F'] || "Sin observaciones.";

        // Aplicar el resaltado SOLO al Concepto (Columna D)
        const conceptoResaltado = resaltarTexto(concepto, palabrasClave);

        // Crear tarjeta
        const card = document.createElement("div");
        card.className = "result-card";
        
        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${conceptoResaltado}</span>
                <span class="result-price">$ ${precio}</span>
            </div>
            <div class="result-body">
                <p><span class="tag">CÓDIGO (Col A):</span> ${colA}</p>
                <p><span class="tag">ORGANIZACIÓN (Col B):</span> ${organizacion}</p>
                <p><span class="tag">TEMA (Col C):</span> ${tema}</p>
                <p style="margin-top: 8px; border-top: 1px dashed rgba(0,212,255,0.2); padding-top: 8px;">
                    <span class="tag" style="display:block; margin-bottom:4px;">OBSERVACIONES (Col F):</span>
                    ${observaciones}
                </p>
            </div>
        `;

        resultsContainer.appendChild(card);
    });
}

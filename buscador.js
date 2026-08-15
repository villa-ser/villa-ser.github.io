// Variable global para almacenar los datos del Excel
let excelData = [];

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const fileInput = document.getElementById("excelFileInput");

    // 1. Intentar cargar el archivo automáticamente al abrir la página
    cargarExcelAutomatico();

    // 2. Escuchar la carga manual (por si falla la automática)
    fileInput.addEventListener("change", manejarCargaManual);

    // 3. Escuchar cada vez que se teclea en el buscador
    searchInput.addEventListener("input", realizarBusqueda);
});

// Función para cargar automáticamente 'PRESUPUESTO V 5.xlsx'
async function cargarExcelAutomatico() {
    const statusMessage = document.getElementById("statusMessage");
    const searchInput = document.getElementById("searchInput");
    const fileUploadContainer = document.getElementById("fileUploadContainer");

    try {
        const response = await fetch('PRESUPUESTO V 5.xlsx');
        if (!response.ok) throw new Error("No se pudo descargar el archivo.");
        
        const arrayBuffer = await response.arrayBuffer();
        procesarBufferExcel(arrayBuffer);
        
        statusMessage.textContent = "✓ Base de datos conectada correctamente.";
        statusMessage.style.color = "var(--gnc-success)";
        searchInput.disabled = false; // Habilitar buscador

    } catch (error) {
        console.warn("Carga automática fallida. Requiere carga manual.");
        statusMessage.textContent = "⚠ Por favor, selecciona el archivo PRESUPUESTO V 5.xlsx manualmente.";
        statusMessage.style.color = "#ffc107"; // Amarillo de alerta
        fileUploadContainer.style.display = "flex"; // Mostrar input file
    }
}

// Función para manejar el botón de carga manual
function manejarCargaManual(evento) {
    const file = evento.target.files[0];
    const statusMessage = document.getElementById("statusMessage");
    const searchInput = document.getElementById("searchInput");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        procesarBufferExcel(arrayBuffer);
        statusMessage.textContent = "✓ Base de datos cargada manualmente.";
        statusMessage.style.color = "var(--gnc-success)";
        searchInput.disabled = false;
        document.getElementById("fileUploadContainer").style.display = "none";
    };
    reader.readAsArrayBuffer(file);
}

// Función central para leer el Excel mediante SheetJS
function procesarBufferExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeraHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[primeraHoja];
    
    // Convertir hoja a JSON mapeando columnas a letras (A, B, C...)
    excelData = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
}

// Lógica del buscador
function realizarBusqueda() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    if (searchInput === "") {
        resultsContainer.innerHTML = "";
        return;
    }

    // Máximo 5 palabras clave
    const palabrasClave = searchInput.toLowerCase().split(/\s+/).slice(0, 5);
    const resultados = [];

    // Iterar saltando la fila 0 (asumiendo que es el encabezado del Excel)
    for (let i = 1; i < excelData.length; i++) {
        const fila = excelData[i];
        
        // BÚSQUEDA RESTRINGIDA: EXCLUSIVAMENTE en columna D (Concepto)
        const textoBusqueda = String(fila['D'] || "").toLowerCase();

        // Chequear coincidencia de todas las palabras clave en la columna D
        const coincidenciaExacta = palabrasClave.every(palabra => textoBusqueda.includes(palabra));

        if (coincidenciaExacta) {
            resultados.push(fila);
            // AMPLIACIÓN: Límite de 6 resultados
            if (resultados.length >= 6) break; 
        }
    }

    renderizarResultados(resultados, palabrasClave);
}

// Función para envolver las palabras coincidentes en una etiqueta HTML de resaltado
function resaltarTexto(texto, palabrasClave) {
    if (!texto) return "";
    let textoResaltado = texto;
    
    // Filtrar palabras vacías por seguridad
    const palabrasValidas = palabrasClave.filter(p => p.length > 0);

    palabrasValidas.forEach(palabra => {
        // Expresión regular insensible a mayúsculas/minúsculas (gi)
        const regex = new RegExp(`(${palabra})`, 'gi');
        textoResaltado = textoResaltado.replace(regex, `<span class="gnc-highlight">$1</span>`);
    });

    return textoResaltado;
}

// Generar el HTML de las tarjetas de resultados
function renderizarResultados(resultados, palabrasClave) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (resultados.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron resultados para esta búsqueda.</div>`;
        return;
    }

    resultados.forEach(fila => {
        // Asignación de títulos correspondientes
        const organizacion = fila['B'] || "No especificado";
        const tema = fila['C'] || "General";
        const concepto = fila['D'] || "Mano de obra";
        const precio = fila['E'] || "Consultar";
        const observaciones = fila['F'] || "Sin observaciones.";

        // Aplicar el resaltado a las columnas para evidenciar el texto buscado
        const conceptoResaltado = resaltarTexto(concepto, palabrasClave);
        const observacionesResaltadas = resaltarTexto(observaciones, palabrasClave);

        // Crear tarjeta
        const card = document.createElement("div");
        card.className = "result-card";
        
        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${conceptoResaltado}</span>
                <span class="result-price">$ ${precio}</span>
            </div>
            <div class="result-body">
                <p><span class="tag">TEMA:</span> ${tema}</p>
                <p><span class="tag">ORGANIZACIÓN:</span> ${organizacion}</p>
                <p style="margin-top: 8px; border-top: 1px dashed rgba(0,212,255,0.2); padding-top: 8px;">
                    <span class="tag" style="display:block; margin-bottom:4px;">OBSERVACIONES:</span>
                    ${observacionesResaltadas}
                </p>
            </div>
        `;

        resultsContainer.appendChild(card);
    });
        }
        

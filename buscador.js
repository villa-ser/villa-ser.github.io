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
        console.warn("Carga automática fallida (probablemente bloqueado por CORS o archivo faltante). Requiere carga manual.");
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
    // Leer el libro de trabajo
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeraHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[primeraHoja];
    
    // Convertir hoja a JSON. header: "A" mapea las columnas a las letras reales de Excel
    excelData = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
    
    // excelData ahora es un array de objetos: { A: "...", B: "...", C: "..." }
}

// Lógica del buscador
function realizarBusqueda() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    // Limpiar resultados si el input está vacío
    if (searchInput === "") {
        resultsContainer.innerHTML = "";
        return;
    }

    // Dividir la entrada en palabras clave, máximo 5, ignorando mayúsculas
    const palabrasClave = searchInput.toLowerCase().split(/\s+/).slice(0, 5);
    const resultados = [];

    // Iterar sobre los datos (empezando desde el índice 1 para saltar la posible fila de títulos)
    for (let i = 1; i < excelData.length; i++) {
        const fila = excelData[i];
        
        // Extraer texto de las columnas B, C, D y F asegurando que sean Strings
        const colB = String(fila['B'] || "").toLowerCase();
        const colC = String(fila['C'] || "").toLowerCase();
        const colD = String(fila['D'] || "").toLowerCase();
        const colF = String(fila['F'] || "").toLowerCase();

        const textoBusqueda = `${colB} ${colC} ${colD} ${colF}`;

        // Chequear si TODAS las palabras clave ingresadas existen en la fila
        const coincidenciaExacta = palabrasClave.every(palabra => textoBusqueda.includes(palabra));

        if (coincidenciaExacta) {
            resultados.push(fila);
            if (resultados.length >= 5) break; // Detenerse al encontrar 5 resultados
        }
    }

    renderizarResultados(resultados);
}

// Generar el HTML de las tarjetas de resultados
function renderizarResultados(resultados) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (resultados.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron resultados para esta búsqueda.</div>`;
        return;
    }

    resultados.forEach(fila => {
        // Formatear datos, mostrando valores por defecto si la celda está vacía
        const fuente = fila['B'] || "No especificado";
        const tema = fila['C'] || "General";
        const concepto = fila['D'] || "Mano de obra";
        const precio = fila['E'] || "Consultar";
        const descripcion = fila['F'] || "Sin descripción adicional.";

        // Crear tarjeta (Card)
        const card = document.createElement("div");
        card.className = "result-card";
        
        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${concepto}</span>
                <span class="result-price">$ ${precio}</span>
            </div>
            <div class="result-body">
                <p><span class="tag">TEMA:</span> ${tema}</p>
                <p><span class="tag">FUENTE:</span> ${fuente}</p>
                <p style="margin-top: 8px; border-top: 1px dashed rgba(0,212,255,0.2); padding-top: 8px;">
                    ${descripcion}
                </p>
            </div>
        `;

        resultsContainer.appendChild(card);
    });
          }


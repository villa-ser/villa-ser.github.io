// Variable global que se llenará con los datos de tu archivo.json
let baseDeDatos = [];

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");
    const resultsContainer = document.getElementById("resultsContainer");

    // 1. CARGAR EL ARCHIVO JSON EXTERNO
    cargarDatosJSON();

    // 2. Habilitar el botón SOLO si hay más de 2 letras escritas y los datos cargaron
    searchInput.addEventListener("input", () => {
        btnBuscar.disabled = searchInput.value.trim().length < 2 || baseDeDatos.length === 0;
    });

    // 3. Ejecutar la búsqueda al hacer clic
    btnBuscar.addEventListener("click", realizarBusqueda);

    // 4. Permitir buscar presionando la tecla "Enter"
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !btnBuscar.disabled) {
            realizarBusqueda();
        }
    });
});

async function cargarDatosJSON() {
    const searchInput = document.getElementById("searchInput");
    const resultsContainer = document.getElementById("resultsContainer");

    try {
        // Asegúrate de que el nombre aquí coincida exactamente con tu archivo
        const respuesta = await fetch('archivo.json');
        
        if (!respuesta.ok) {
            throw new Error("No se pudo acceder al archivo JSON.");
        }

        baseDeDatos = await respuesta.json();
        
        // Desbloquear el buscador para el usuario
        searchInput.disabled = false;
        searchInput.placeholder = "Ej: armado pilar trifásico...";

    } catch (error) {
        console.error("Error al cargar el JSON:", error);
        
        // Mensaje de advertencia si lo abre localmente sin servidor
        resultsContainer.innerHTML = `
            <div class="no-results" style="border-color: #ffc107; color: #ffc107;">
                <i data-lucide="alert-triangle" style="margin-bottom:10px;"></i><br>
                <b>No se pudo cargar 'archivo.json'.</b><br><br>
                Si estás abriendo este archivo HTML directamente desde tu computadora (con doble clic), el navegador bloquea la lectura del JSON por seguridad.<br><br>
                Para que funcione, debes subir los archivos a tu servidor web, o usar un servidor local (como Live Server).
            </div>
        `;
        if (window.lucide) { lucide.createIcons(); }
    }
}

function realizarBusqueda() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    if (searchInput.length < 2) return;

    // Extraer hasta 5 palabras clave
    let palabrasClave = searchInput.toLowerCase().split(/\s+/).filter(p => p.length > 0).slice(0, 5);
    const resultados = [];

    // Iterar sobre nuestra base de datos JSON
    for (const fila of baseDeDatos) {
        
        // RESTRICCIÓN ABSOLUTA: Buscar ÚNICAMENTE en el Concepto
        // Se incluyen varias opciones por si el convertidor JSON usó diferentes nombres de columna
        const conceptoOriginal = fila.concepto || fila.Concepto || fila['D'] || fila['d'] || "";
        const textoConcepto = String(conceptoOriginal).toLowerCase();

        // Verificar que TODAS las palabras ingresadas estén dentro del concepto
        const coincidenciaExacta = palabrasClave.every(palabra => textoConcepto.includes(palabra));

        if (coincidenciaExacta) {
            resultados.push(fila);
            if (resultados.length >= 6) break; // Límite de 6 resultados
        }
    }

    renderizarResultados(resultados, palabrasClave);
}

// Resaltador de palabras clave en color cian (Estilo NGC)
function resaltarTexto(texto, palabrasClave) {
    if (!texto) return "";
    
    const palabrasValidas = palabrasClave
        .filter(p => p.length > 0)
        .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) 
        .sort((a, b) => b.length - a.length);

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
        // Extraemos los datos previendo los nombres de columnas que suele generar un convertidor de Excel a JSON
        const codigo = fila.codigo || fila.Codigo || fila['A'] || "-";
        const organizacion = fila.organizacion || fila.Organizacion || fila['B'] || "No especificado";
        const tema = fila.tema || fila.Tema || fila['C'] || "General";
        const concepto = fila.concepto || fila.Concepto || fila['D'] || "Mano de obra";
        
        const valorPrecio = fila.precio || fila.Precio || fila['E'];
        let precio = valorPrecio ? `$ ${valorPrecio}` : "$ Consultar";
        
        const observaciones = fila.observaciones || fila.Observaciones || fila['F'] || "Sin observaciones.";

        // Resaltar palabras solo en el concepto
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

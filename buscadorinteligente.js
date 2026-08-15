let allData = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarExcel();

    const searchInput = document.getElementById("searchInput");
    const btnBuscar = document.getElementById("btnBuscar");

    // Habilitar botón si hay texto
    searchInput.addEventListener("input", () => {
        btnBuscar.disabled = searchInput.value.trim().length === 0;
    });

    // Ejecutar búsqueda al hacer clic
    btnBuscar.addEventListener("click", ejecutarBusqueda);

    // Permitir Enter
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !btnBuscar.disabled) {
            ejecutarBusqueda();
        }
    });
});

// Cargar archivo.xlsx de forma automática
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
                organizacion: String(fila['B'] || "").trim() || "General",  // Columna B
                tema: String(fila['C'] || "").trim() || "General",          // Columna C
                concepto: concepto,                                         // Columna D
                precio: fila['E'],                                          // Columna E
                observaciones: String(fila['F'] || "").trim()               // Columna F
            });
        }
        
        statusMsg.style.display = "none";
        searchInput.disabled = false;
        searchInput.placeholder = "Ej: pilar trifasico...";

    } catch (error) {
        statusMsg.innerText = "Error al leer 'archivo.xlsx'. Verifique que esté en la carpeta.";
        statusMsg.style.color = "var(--error-red)";
        console.error(error);
    }
}

// Ejecutar búsqueda estricta sobre la Columna D (Concepto)
function ejecutarBusqueda() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (query === "") return;

    // Tomar hasta 5 palabras clave separadas por espacio
    const palabras = query.split(/\s+/).filter(p => p.length > 0).slice(0, 5);

    const coincidencias = [];

    for (const item of allData) {
        const textoConcepto = item.concepto.toLowerCase();
        
        // Verificar que TODAS las palabras ingresadas se encuentren en el concepto (Columna D)
        const cumpleTodas = palabras.every(palabra => textoConcepto.includes(palabra));

        if (cumpleTodas) {
            coincidencias.push(item);
            if (coincidencias.length >= 5) break; // Máximo 5 resultados
        }
    }

    if (coincidencias.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron conceptos coincidentes.</div>`;
        return;
    }

    // Renderizar los hasta 5 resultados
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

        // Mensaje pre-armado para WhatsApp
        const mensajeWp = encodeURIComponent(`Hola, necesito asesoramiento / presupuesto sobre el servicio: "${item.concepto}" con precio referencial de ${precioFormat} (${item.organizacion}).`);
        const urlWp = `https://wa.me/543513559347?text=${mensajeWp}`;

        card.innerHTML = `
            <div class="result-header">
                <span class="result-concept">${item.concepto}</span>
                <span class="result-price">${precioFormat}</span>
            </div>
            <div class="result-obs">
                ${item.observaciones ? item.observaciones : "Sin observaciones."}
            </div>
            <div class="result-details">
                <div class="detail-row" style="margin-top: 8px;">
                    <span class="detail-label">Organización:</span> ${item.organizacion}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tema / Categoría:</span> ${item.tema}
                </div>
                <a href="${urlWp}" target="_blank" class="btn-whatsapp">
                    <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> Consultar por WhatsApp
                </a>
            </div>
        `;

        // Al hacer clic en la tarjeta, se despliegan los detalles y el botón de WhatsApp
        card.addEventListener("click", (e) => {
            // Evitar conflicto si hace clic directamente en el enlace de WhatsApp
            if (e.target.closest('.btn-whatsapp')) return;
            card.classList.toggle("active");
        });

        resultsContainer.appendChild(card);
    });
          }


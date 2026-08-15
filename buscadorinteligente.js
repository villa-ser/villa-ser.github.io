let allData = [];

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

function ejecutarBusqueda() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (query === "") return;

    // Extraer hasta 5 palabras clave
    const palabras = query.split(/\s+/).filter(p => p.length > 0).slice(0, 5);
    const coincidencias = [];

    for (const item of allData) {
        const textoConcepto = item.concepto.toLowerCase();
        
        // La fila debe contener TODAS las palabras ingresadas (sin importar el orden)
        const cumpleTodas = palabras.every(palabra => textoConcepto.includes(palabra));

        if (cumpleTodas) {
            coincidencias.push(item);
            if (coincidencias.length >= 5) break; // Límite de 5 resultados
        }
    }

    if (coincidencias.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No se encontraron resultados para su búsqueda.<br><span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.5);">Intenta usando menos palabras o sinónimos.</span></div>`;
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

        // Mensaje pre-armado para WhatsApp
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
                    <span class="wsp-leyenda">¿Queres un presupuesto completo, y a la medida?</span>
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
    lucide.createIcons();
}
    

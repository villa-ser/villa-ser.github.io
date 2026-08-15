let allData = [];
let selectedFuentes = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarExcel();
});

// 1. CARGAR ARCHIVO.XLSX Y LEER LA PESTAÑA "Precios"
async function cargarExcel() {
    const statusMsg = document.getElementById("status-message");
    
    try {
        const response = await fetch('archivo.xlsx');
        if (!response.ok) throw new Error("No se pudo cargar archivo.xlsx");
        
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Seleccionar estrictamente la pestaña "Precios"
        const nombreHoja = workbook.SheetNames.includes('Precios') ? 'Precios' : workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];
        
        const jsonRaw = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
        
        allData = [];
        for (let i = 1; i < jsonRaw.length; i++) {
            const fila = jsonRaw[i];
            
            // Validar que existan datos en Organización y Concepto
            const org = String(fila['B'] || "").trim();
            const concepto = String(fila['D'] || "").trim();
            const precio = String(fila['E'] || "").trim();
            
            if (!org || !concepto) continue;
            
            // Omitir filas de cabecera de sección (ej. "Importe Neto" en la columna de precio)
            if (precio.toLowerCase().includes("importe neto") || precio === "") continue;

            allData.push({
                codigo: String(fila['A'] || "").trim() || "-",
                fuente: org,                                    // Columna B: Organización
                tema: String(fila['C'] || "").trim() || "General", // Columna C: Tema
                concepto: concepto,                             // Columna D: Concepto
                precio: fila['E'],                              // Columna E: Precio
                notas: String(fila['F'] || "").trim()           // Columna F: Observaciones
            });
        }
        
        if (statusMsg) statusMsg.style.display = "none";
        iniciarUI();

    } catch (error) {
        if (statusMsg) {
            statusMsg.innerText = "Error: No se encontró 'archivo.xlsx' en la carpeta.";
            statusMsg.style.color = "var(--error-red)";
        }
        console.error(error);
    }
}

// 2. INICIAR INTERFAZ Y BOTONES DE ORGANIZACIÓN (Columna B)
function iniciarUI() {
    const fuentesUnicas = [...new Set(allData.map(d => d.fuente))].filter(f => f).sort();
    const container = document.getElementById('fuente-container');
    if (!container) return;
    container.innerHTML = '';

    // Botón TODOS
    const btnAll = document.createElement('button');
    btnAll.className = 'fuente-btn active';
    btnAll.innerText = 'TODOS';
    btnAll.id = 'btn-fuente-all';
    btnAll.onclick = () => selectFuente('ALL', btnAll);
    container.appendChild(btnAll);
    
    selectedFuentes = [...fuentesUnicas];

    fuentesUnicas.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'fuente-btn active';
        btn.innerText = f;
        btn.onclick = () => selectFuente(f, btn);
        container.appendChild(btn);
    });

    updateTemas();
}

function selectFuente(fuente, btn) {
    const btnAll = document.getElementById('btn-fuente-all');
    const allButtons = document.querySelectorAll('.fuente-btn');

    if (fuente === 'ALL') {
        const becomingActive = !btn.classList.contains('active');
        allButtons.forEach(b => {
            becomingActive ? b.classList.add('active') : b.classList.remove('active');
        });
        selectedFuentes = becomingActive ? [...new Set(allData.map(d => d.fuente))].filter(f => f) : [];
    } else {
        btn.classList.toggle('active');
        if (btnAll) btnAll.classList.remove('active');

        if (btn.classList.contains('active')) {
            selectedFuentes.push(fuente);
        } else {
            selectedFuentes = selectedFuentes.filter(f => f !== fuente);
        }
    }
    
    resetDropdownsCascade();
    updateTemas();
}

// 3. ACTUALIZAR TEMA GENERAL (Columna C)
function updateTemas() {
    const filteredByFuente = allData.filter(d => selectedFuentes.includes(d.fuente));
    const temas = [...new Set(filteredByFuente.map(d => d.tema))].filter(t => t).sort();
    
    const listTema = document.getElementById('list-tema');
    const displayTema = document.getElementById('display-tema');
    if (!listTema || !displayTema) return;
    
    displayTema.innerText = '-- Seleccionar Categoría --';
    displayTema.style.color = "white";
    listTema.innerHTML = '';
    
    temas.forEach(t => {
        let item = document.createElement('div');
        item.innerText = t;
        item.onclick = function() {
            selectOption('display-tema', 'val-tema', t);
            closeAllDropdowns();
            updateSubtema();
        };
        listTema.appendChild(item);
    });
}

// 4. ACTUALIZAR CONCEPTO ESPECÍFICO (Columna D)
function updateSubtema() {
    const temaSelected = document.getElementById('val-tema').value;
    const listSub = document.getElementById('list-subtema');
    const displaySub = document.getElementById('display-subtema');
    if (!listSub || !displaySub) return;
    
    displaySub.innerText = '-- Seleccionar Concepto --';
    displaySub.style.color = "white";
    document.getElementById('val-subtema').value = '';
    listSub.innerHTML = '';
    
    allData.filter(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected).forEach(d => {
        if(d.concepto) {
            let item = document.createElement('div');
            item.innerText = d.concepto;
            item.onclick = function() {
                selectOption('display-subtema', 'val-subtema', d.concepto);
                closeAllDropdowns();
                showDetails();
            };
            listSub.appendChild(item);
        }
    });
    
    const resCard = document.getElementById('result-card');
    if (resCard) resCard.style.display = 'none';
}

// 5. MOSTRAR PRECIO (Columna E) Y OBSERVACIONES (Columna F)
function showDetails() {
    const temaSelected = document.getElementById('val-tema').value;
    const subSelected = document.getElementById('val-subtema').value;
    
    const item = allData.find(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto === subSelected);

    if (item) {
        document.getElementById('res-concepto-full').innerText = item.concepto;
        document.getElementById('res-tema').innerText = item.tema;
        document.getElementById('res-org').innerText = item.fuente;
        document.getElementById('res-notes-content').innerText = item.notas || 'Sin observaciones.';
        
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "") {
            document.getElementById('res-precio').innerText = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else {
            document.getElementById('res-precio').innerText = `$ ${item.precio || "Consultar"}`;
        }

        const resCard = document.getElementById('result-card');
        if (resCard) resCard.style.display = 'block';
    }
}

function resetDropdownsCascade() {
    document.getElementById('val-tema').value = '';
    const dTema = document.getElementById('display-tema');
    if (dTema) {
        dTema.innerText = '-- Seleccionar Categoría --';
        dTema.style.color = "rgba(255,255,255,0.5)";
    }
    
    document.getElementById('val-subtema').value = '';
    const dSub = document.getElementById('display-subtema');
    if (dSub) {
        dSub.innerText = 'Seleccione tema primero';
        dSub.style.color = "rgba(255,255,255,0.5)";
    }
    
    const listSub = document.getElementById('list-subtema');
    if (listSub) listSub.innerHTML = '';
    const resCard = document.getElementById('result-card');
    if (resCard) resCard.style.display = 'none';
}

function resetForm() {
    const allButtons = document.querySelectorAll('.fuente-btn');
    allButtons.forEach(b => b.classList.add('active'));
    selectedFuentes = [...new Set(allData.map(d => d.fuente))].filter(f => f);
    
    resetDropdownsCascade();
    updateTemas();
    closeAllDropdowns();
}

function toggleDropdown(listId, displayId, groupId) {
    const list = document.getElementById(listId);
    const display = document.getElementById(displayId);
    const group = document.getElementById(groupId);
    const isShowing = list.classList.contains('show');

    closeAllDropdowns();

    if (!isShowing) {
        list.classList.add('show');
        display.classList.add('select-arrow-active');
        group.classList.add('active');
    }
}

function selectOption(displayId, inputId, value) {
    const display = document.getElementById(displayId);
    display.innerText = value;
    display.style.color = "var(--primary-neon)";
    document.getElementById(inputId).value = value;
}

function closeAllDropdowns() {
    const lists = document.getElementsByClassName('select-items');
    const displays = document.getElementsByClassName('select-selected');
    const groups = document.getElementsByClassName('input-group');
    
    for (let i = 0; i < lists.length; i++) lists[i].classList.remove('show');
    for (let i = 0; i < displays.length; i++) displays[i].classList.remove('select-arrow-active');
    for (let i = 0; i < groups.length; i++) groups[i].classList.remove('active');
}

document.addEventListener("click", function(event) {
    if (!event.target.matches('.select-selected')) {
        closeAllDropdowns();
    }
});
        

let allData = [];
let selectedFuentes = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarExcel();
});

// 1. CARGAR ARCHIVO.XLSX AUTOMÁTICAMENTE
async function cargarExcel() {
    const statusMsg = document.getElementById("status-message");
    
    try {
        const response = await fetch('archivo.xlsx');
        if (!response.ok) throw new Error("No se pudo cargar archivo.xlsx");
        
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const primeraHoja = workbook.SheetNames[0];
        const hoja = workbook.Sheets[primeraHoja];
        
        // Mapeo automático de columnas A, B, C...
        const jsonRaw = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
        
        allData = [];
        // Saltamos la fila 0 (Títulos) y procesamos el resto
        for (let i = 1; i < jsonRaw.length; i++) {
            const fila = jsonRaw[i];
            
            // Si la fila no tiene Organización, Tema ni Concepto, la ignoramos
            if (!fila['B'] && !fila['C'] && !fila['D']) continue;

            allData.push({
                codigo: String(fila['A']).trim() || "-",
                fuente: String(fila['B']).trim() || "General",  // Organización
                tema: String(fila['C']).trim() || "Sin Tema",   // Tema
                concepto: String(fila['D']).trim(),             // Concepto
                precio: fila['E'] || "",                        // Precio
                notas: String(fila['F']).trim() || ""           // Observaciones
            });
        }
        
        statusMsg.style.display = "none";
        iniciarUI();

    } catch (error) {
        statusMsg.innerText = "Error: No se encontró 'archivo.xlsx'. Asegúrate de subirlo al servidor.";
        statusMsg.style.color = "var(--error-red)";
        console.error(error);
    }
}

// 2. INICIAR INTERFAZ Y BOTONES DE ORGANIZACIÓN
function iniciarUI() {
    const fuentesUnicas = [...new Set(allData.map(d => d.fuente))].filter(f => f).sort();
    const container = document.getElementById('fuente-container');
    container.innerHTML = '';

    // Botón TODOS
    const btnAll = document.createElement('button');
    btnAll.className = 'fuente-btn active';
    btnAll.innerText = 'TODOS';
    btnAll.id = 'btn-fuente-all';
    btnAll.onclick = () => selectFuente('ALL', btnAll);
    container.appendChild(btnAll);
    
    selectedFuentes = [...fuentesUnicas]; // Iniciar con todas activas

    fuentesUnicas.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'fuente-btn active';
        btn.innerText = f;
        btn.onclick = () => selectFuente(f, btn);
        container.appendChild(btn);
    });

    updateTemas();
}

// 3. LÓGICA DE SELECCIÓN DE ORGANIZACIÓN
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
        btnAll.classList.remove('active');

        if (btn.classList.contains('active')) {
            selectedFuentes.push(fuente);
        } else {
            selectedFuentes = selectedFuentes.filter(f => f !== fuente);
        }
    }
    
    resetDropdownsCascade();
    updateTemas();
}

// 4. ACTUALIZAR LISTA DE TEMAS (Columna C)
function updateTemas() {
    const filteredByFuente = allData.filter(d => selectedFuentes.includes(d.fuente));
    const temas = [...new Set(filteredByFuente.map(d => d.tema))].filter(t => t).sort();
    
    const listTema = document.getElementById('list-tema');
    const displayTema = document.getElementById('display-tema');
    
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

// 5. ACTUALIZAR LISTA DE CONCEPTOS (Columna D)
function updateSubtema() {
    const temaSelected = document.getElementById('val-tema').value;
    const listSub = document.getElementById('list-subtema');
    const displaySub = document.getElementById('display-subtema');
    
    displaySub.innerText = '-- Seleccionar Concepto --';
    displaySub.style.color = "white";
    document.getElementById('val-subtema').value = '';
    listSub.innerHTML = '';
    
    // Filtrar por fuentes activas y tema seleccionado
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
    
    document.getElementById('result-card').style.display = 'none';
}

// 6. MOSTRAR RESULTADOS (Columna E y F)
function showDetails() {
    const temaSelected = document.getElementById('val-tema').value;
    const subSelected = document.getElementById('val-subtema').value;
    
    const item = allData.find(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto === subSelected);

    if (item) {
        document.getElementById('res-concepto-full').innerText = item.concepto;
        document.getElementById('res-tema').innerText = item.tema;
        document.getElementById('res-org').innerText = item.fuente;
        document.getElementById('res-notes-content').innerText = item.notas || 'Sin observaciones.';
        
        // Interpretar precio (número o texto "Consultar")
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "") {
            document.getElementById('res-precio').innerText = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else {
            document.getElementById('res-precio').innerText = `$ ${item.precio || "Consultar"}`;
        }

        document.getElementById('result-card').style.display = 'block';
    }
}

// 7. LIMPIEZA Y MENÚS DESPLEGABLES
function resetDropdownsCascade() {
    document.getElementById('val-tema').value = '';
    const dTema = document.getElementById('display-tema');
    dTema.innerText = '-- Seleccionar Categoría --';
    dTema.style.color = "rgba(255,255,255,0.5)";
    
    document.getElementById('val-subtema').value = '';
    const dSub = document.getElementById('display-subtema');
    dSub.innerText = 'Seleccione tema primero';
    dSub.style.color = "rgba(255,255,255,0.5)";
    
    document.getElementById('list-subtema').innerHTML = '';
    document.getElementById('result-card').style.display = 'none';
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

// Cierra los menús si tocas cualquier parte de la pantalla
document.addEventListener("click", function(event) {
    if (!event.target.matches('.select-selected')) {
        closeAllDropdowns();
    }
});
        

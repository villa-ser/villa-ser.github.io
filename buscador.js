let allData = [];
let selectedFuentes = [];

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("excelFileInput");
    
    // 1. Intentar cargar el archivo localmente primero
    cargarExcelAutomatico();

    // 2. Escucha manual en caso de que el navegador bloquee la auto-carga
    fileInput.addEventListener("change", manejarCargaManual);
});

// --- LÓGICA DE CARGA DE EXCEL ---
async function cargarExcelAutomatico() {
    const statusMessage = document.getElementById("statusMessage");
    const fileUploadContainer = document.getElementById("fileUploadContainer");

    try {
        const response = await fetch('archivo.xlsx');
        if (!response.ok) throw new Error("Archivo no encontrado");
        
        const arrayBuffer = await response.arrayBuffer();
        procesarBufferExcel(arrayBuffer);
        
        statusMessage.style.display = "none"; // Ocultar mensaje si cargó bien

    } catch (error) {
        console.warn("Carga automática bloqueada (CORS). Requiere carga manual.");
        statusMessage.textContent = "⚠ Selecciona tu 'archivo.xlsx' manualmente para comenzar.";
        statusMessage.style.color = "var(--gnc-warning)";
        fileUploadContainer.style.display = "flex";
    }
}

function manejarCargaManual(evento) {
    const file = evento.target.files[0];
    const statusMessage = document.getElementById("statusMessage");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        procesarBufferExcel(e.target.result);
        statusMessage.style.display = "none";
        document.getElementById("fileUploadContainer").style.display = "none";
    };
    reader.readAsArrayBuffer(file);
}

function procesarBufferExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeraHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[primeraHoja];
    
    // Leer todo el excel basado en columnas de la A a la F
    const jsonRaw = XLSX.utils.sheet_to_json(hoja, { header: "A", defval: "" });
    
    allData = [];
    // Empezamos en i=1 asumiendo que la fila 0 son los Títulos (Código, Org, Tema, etc)
    for (let i = 1; i < jsonRaw.length; i++) {
        const fila = jsonRaw[i];
        
        // Evitar filas vacías
        if (!fila['B'] && !fila['C'] && !fila['D']) continue;

        allData.push({
            codigo: String(fila['A'] || "").trim(),
            fuente: String(fila['B'] || "").trim() || "General",
            tema: String(fila['C'] || "").trim() || "Sin Categoría",
            concepto: String(fila['D'] || "").trim(),
            precio: fila['E'] || "",
            notas: String(fila['F'] || "").trim()
        });
    }

    iniciarFiltrosUI();
}

// --- LÓGICA DE FILTROS EN CASCADA ---
function iniciarFiltrosUI() {
    // 1. Extraer fuentes únicas
    const fuentesUnicas = [...new Set(allData.map(d => d.fuente))].filter(f => f).sort();
    const container = document.getElementById('fuente-container');
    container.innerHTML = '';

    // Botón "TODOS"
    const btnAll = document.createElement('button');
    btnAll.className = 'fuente-btn active';
    btnAll.innerText = 'TODOS';
    btnAll.id = 'btn-fuente-all';
    btnAll.onclick = () => selectFuente('ALL', btnAll);
    container.appendChild(btnAll);
    
    selectedFuentes = [...fuentesUnicas]; // Inician todos activos

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

function updateSubtema() {
    const temaSelected = document.getElementById('val-tema').value;
    const listSub = document.getElementById('list-subtema');
    const displaySub = document.getElementById('display-subtema');
    
    displaySub.innerText = '-- Seleccionar Concepto --';
    displaySub.style.color = "white";
    document.getElementById('val-subtema').value = '';
    listSub.innerHTML = '';
    
    // Filtrar base de datos
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

// --- MOSTRAR RESULTADO FINAL ---
function showDetails() {
    const temaSelected = document.getElementById('val-tema').value;
    const subSelected = document.getElementById('val-subtema').value;
    
    const item = allData.find(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto === subSelected);

    if (item) {
        document.getElementById('res-concepto-full').innerText = item.concepto;
        document.getElementById('res-tema').innerText = item.tema;
        document.getElementById('res-org').innerText = item.fuente;
        document.getElementById('res-notes-content').innerText = item.notas || 'Sin observaciones.';
        
        // Formatear precio
        let priceNum = Number(item.precio);
        if (!isNaN(priceNum) && item.precio !== "") {
            document.getElementById('res-precio').innerText = `$ ${priceNum.toLocaleString('es-AR')}`;
        } else {
            document.getElementById('res-precio').innerText = `$ ${item.precio || "Consultar"}`;
        }

        document.getElementById('result-card').style.display = 'block';
    }
}

// --- LIMPIEZA Y RESETS ---
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

// --- LÓGICA GRÁFICA DEL MENÚ DESPLEGABLE ---
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
    display.style.color = "var(--gnc-neon)";
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

// Cerrar al hacer clic afuera
document.addEventListener("click", function(event) {
    if (!event.target.matches('.select-selected')) {
        closeAllDropdowns();
    }
});
        

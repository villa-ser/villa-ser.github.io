// --- LÓGICA DE TEMA AUTOMÁTICO EN TIEMPO REAL ---
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
    
    if (temaGuardado === 'system') {
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
});

// =======================================================
// LÓGICA DE CÁLCULO Y GOOGLE CHARTS (MÓDULO COSTOS)
// =======================================================
const sheetId = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
let allData = [];
let selectedFuentes = [];

// Elementos de la interfaz 
const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');
const detTema = document.getElementById('detTema');
const sumTema = document.getElementById('sumTema');
const detConcepto = document.getElementById('detConcepto');
const sumConcepto = document.getElementById('sumConcepto');
const resCard = document.getElementById('result-card');

// Inicializar Google Charts
google.charts.load('current', {packages:['corechart']});
google.charts.setOnLoadCallback(init);

function init() {
    const query = new google.visualization.Query(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&headers=1`);
    query.send(handleResponse);
}

function handleResponse(response) {
    if (response.isError()) {
        document.getElementById('loading').innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--error-red); font-size: 3rem; margin-bottom: 15px;"></i>
            <br><span style="color: var(--ngc-text-main); font-weight:bold;">Error de conexión.</span>
            <p style="font-size:0.8rem; color:var(--ngc-text-faded);">No se pudo cargar la base de datos.</p>
        `;
        return;
    }
    
    const data = response.getDataTable();
    const rows = data.getNumberOfRows();
    
    allData = [];
    for (let i = 0; i < rows; i++) {
        allData.push({
            tema: data.getValue(i, 0),      // Columna A (Rubro)
            concepto: data.getValue(i, 1),  // Columna B (Trabajo)
            precio: data.getValue(i, 2),    // Columna C (Precio)
            notas: data.getValue(i, 3),     // Columna D (Notas)
            codigo: data.getValue(i, 5),    // Columna F (Codigo)
            fuente: data.getValue(i, 9),    // Columna J (Fuente)
            org: data.getValue(i, 9)        // Columna J (Org Específica si existe)
        });
    }

    // 1. Crear Selector de Fuentes (Filtros)
    const fuentesUnicas = [...new Set(allData.map(d => d.fuente))].filter(f => f).sort();
    const container = document.getElementById('fuente-container');
    container.innerHTML = '';

    // Función constructora del nuevo diseño (Nombre a izq, Switch a der)
    function createToggleRow(labelText, value, isAll = false) {
        const row = document.createElement('div');
        row.className = 'fuente-row';
        
        const label = document.createElement('span');
        label.className = 'fuente-label';
        label.innerText = labelText;
        
        const toggle = document.createElement('label');
        toggle.className = 'corp-toggle';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = true; // Empiezan prendidos
        
        if (isAll) {
            input.id = 'toggle-fuente-all';
            input.onchange = () => selectFuente('ALL', input);
        } else {
            input.className = 'toggle-fuente-item';
            input.onchange = () => selectFuente(value, input);
        }
        
        const slider = document.createElement('span');
        slider.className = 'corp-toggle-slider';
        
        toggle.appendChild(input);
        toggle.appendChild(slider);
        row.appendChild(label);
        row.appendChild(toggle);
        
        return row;
    }

    // Fila "TODOS"
    container.appendChild(createToggleRow('TODOS', 'ALL', true));
    selectedFuentes = [...fuentesUnicas]; 

    // Filas Individuales Dinámicas
    fuentesUnicas.forEach(f => {
        container.appendChild(createToggleRow(f, f, false));
    });

    // Iniciar desplegables y mostrar App
    updateTemas();
    document.getElementById('loading').classList.add('oculto');
    document.getElementById('app').classList.remove('oculto');
}

function selectFuente(fuente, checkbox) {
    const checkAll = document.getElementById('toggle-fuente-all');
    const allChecks = document.querySelectorAll('.toggle-fuente-item');

    if (fuente === 'ALL') {
        const isNowActive = checkbox.checked;
        if (isNowActive) {
            allChecks.forEach(c => c.checked = true);
            selectedFuentes = [...new Set(allData.map(d => d.fuente))].filter(f => f);
        } else {
            allChecks.forEach(c => c.checked = false);
            selectedFuentes = [];
        }
    } else {
        checkAll.checked = false;

        if (checkbox.checked) {
            selectedFuentes.push(fuente);
        } else {
            selectedFuentes = selectedFuentes.filter(f => f !== fuente);
        }
        
        const fuentesTotales = [...new Set(allData.map(d => d.fuente))].filter(f => f);
        if (selectedFuentes.length === fuentesTotales.length && fuentesTotales.length > 0) {
            checkAll.checked = true;
        }
    }
    
    resetDropdownsCascade();
    updateTemas();
}

function showDetails() {
    const temaSelected = selTema.value;
    const subSelected = selConcepto.value;
    
    if (!subSelected) {
        resCard.classList.add('oculto');
        return;
    }
    
    // Buscar el ítem exacto
    const item = allData.find(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto === subSelected);

    if (item) {
        document.getElementById('res-codigo').innerText = item.codigo || 'S/C';
        document.getElementById('res-concepto-full').innerText = item.concepto;
        document.getElementById('res-tema').innerText = item.tema;
        document.getElementById('res-precio').innerText = `$ ${Number(item.precio || 0).toLocaleString('es-AR')}`;
        document.getElementById('res-org').innerText = item.fuente || item.org || 'General';
        document.getElementById('res-notes-content').innerText = item.notas || 'Sin notas aclaratorias adicionales para este concepto.';
        
        // Mostrar con pequeña animación
        resCard.style.opacity = '0';
        resCard.style.transform = 'translateY(10px)';
        resCard.classList.remove('oculto');
        
        setTimeout(() => { 
            resCard.style.opacity = '1'; 
            resCard.style.transform = 'translateY(0)';
        }, 50);

        // MAGIA UX: Cerrar el acordeón de filtros automáticamente para dar visión completa
        const acordeon = document.getElementById('acordeonFiltros');
        if(acordeon && acordeon.open) {
            acordeon.removeAttribute('open');
        }
    }
}

function updateTemas() {
    // Filtrar data global según las fuentes prendidas
    const filteredByFuente = allData.filter(d => selectedFuentes.includes(d.fuente));
    const temas = [...new Set(filteredByFuente.map(d => d.tema))].filter(t => t).sort();
    
    const listTema = document.getElementById('listTema');
    listTema.innerHTML = '';
    selTema.value = ''; // Borra el valor del input oculto
    
    if (temas.length > 0) {
        detTema.removeAttribute('disabled');
        sumTema.innerText = '-- Seleccionar Categoría --';
        
        temas.forEach(t => {
            const opt = document.createElement('div');
            opt.className = 'corp-select-option';
            opt.innerText = t;
            opt.onclick = () => {
                selTema.value = t; 
                sumTema.innerText = t; 
                detTema.removeAttribute('open'); 
                updateSubtema(); 
            };
            listTema.appendChild(opt);
        });
    } else {
        detTema.setAttribute('disabled', 'true');
        sumTema.innerText = 'No hay datos para esta fuente';
    }
}

function updateSubtema() {
    const temaSelected = selTema.value;
    const listConcepto = document.getElementById('listConcepto');
    
    listConcepto.innerHTML = '';
    selConcepto.value = '';
    resCard.classList.add('oculto');
    
    if (!temaSelected) {
        detConcepto.setAttribute('disabled', 'true');
        sumConcepto.innerText = 'Seleccione categoría primero...';
        return;
    }
    
    detConcepto.removeAttribute('disabled');
    sumConcepto.innerText = '-- Seleccionar Concepto --';
    
    const subtemas = allData.filter(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto);
    
    subtemas.forEach(d => {
        const opt = document.createElement('div');
        opt.className = 'corp-select-option';
        opt.innerText = d.concepto;
        opt.onclick = () => {
            selConcepto.value = d.concepto;
            sumConcepto.innerText = d.concepto;
            detConcepto.removeAttribute('open');
            showDetails();
        };
        listConcepto.appendChild(opt);
    });
}

function resetDropdownsCascade() {
    selTema.value = '';
    sumTema.innerText = '-- Seleccionar Categoría --';
    detTema.removeAttribute('open');
    
    selConcepto.value = '';
    sumConcepto.innerText = 'Seleccione categoría primero...';
    detConcepto.setAttribute('disabled', 'true');
    detConcepto.removeAttribute('open');
    
    resCard.classList.add('oculto');
}

function resetForm() {
    const checkAll = document.getElementById('toggle-fuente-all');
    if(checkAll) checkAll.checked = true;
    
    const allChecks = document.querySelectorAll('.toggle-fuente-item');
    allChecks.forEach(c => c.checked = true);
    
    selectedFuentes = [...new Set(allData.map(d => d.fuente))].filter(f => f);
    
    resetDropdownsCascade();
    updateTemas();

    // Al limpiar la búsqueda, abrimos el acordeón nuevamente para que el usuario pueda volver a buscar
    const acordeon = document.getElementById('acordeonFiltros');
    if(acordeon) acordeon.setAttribute('open', 'true');
}

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '#', active: true },
        { nombre: 'Proveedores', icon: 'fa-solid fa-truck-fast', url: '../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-solid fa-book-open', url: '../catalogos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});

// ==========================================
// COMPORTAMIENTO INTELIGENTE DE ACORDEONES
// ==========================================
document.addEventListener('click', (event) => {
    // Cierra el acordeón de Categoría y Concepto (pero NO el de Parámetros Globales) si se toca afuera
    const details = document.querySelectorAll('details.corp-custom-select');
    details.forEach(det => {
        if (det.open && !det.contains(event.target)) {
            det.removeAttribute('open');
        }
    });
});

document.querySelectorAll('details.corp-custom-select').forEach(det => {
    det.addEventListener('toggle', (e) => {
        if (det.open) {
            document.querySelectorAll('details.corp-custom-select').forEach(other => {
                if (other !== det) other.removeAttribute('open');
            });
        }
    });
});
           

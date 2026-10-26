// =======================================================
// LÓGICA DE CÁLCULO Y GOOGLE CHARTS (MÓDULO COSTOS)
// =======================================================
const sheetId = '1prJUdOspEx0AHh7PEAx_i5mQ7in8wGtshL6AO293fgk';
let allData = [];
let selectedFuentes = [];

// Elementos de la interfaz
const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');
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
            codigo: data.getValue(i, 0),    
            fuente: data.getValue(i, 1),    // Columna B (Fuente)
            tema: data.getValue(i, 2),      // Columna C (Rubro)
            concepto: data.getValue(i, 3),  // Columna D (Trabajo)
            precio: data.getValue(i, 4),    // Columna E (Precio)
            notas: data.getValue(i, 5),     // Columna F (Notas)
            org: data.getValue(i, 11)       // Columna L (Org Específica si existe)
        });
    }

    // 1. Crear Selector de Fuentes (Filtros)
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
    
    selectedFuentes = [...fuentesUnicas]; // Inicialmente todos seleccionados

    fuentesUnicas.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'fuente-btn active';
        btn.innerText = f;
        btn.onclick = () => selectFuente(f, btn);
        container.appendChild(btn);
    });

    // Iniciar desplegables y mostrar App
    updateTemas();
    document.getElementById('loading').classList.add('oculto');
    document.getElementById('app').classList.remove('oculto');
}

function selectFuente(fuente, btn) {
    const btnAll = document.getElementById('btn-fuente-all');
    const allButtons = document.querySelectorAll('.fuente-btn:not(#btn-fuente-all)');

    if (fuente === 'ALL') {
        const isNowActive = !btn.classList.contains('active');
        if (isNowActive) {
            btn.classList.add('active');
            allButtons.forEach(b => b.classList.add('active'));
            selectedFuentes = [...new Set(allData.map(d => d.fuente))].filter(f => f);
        } else {
            btn.classList.remove('active');
            allButtons.forEach(b => b.classList.remove('active'));
            selectedFuentes = [];
        }
    } else {
        btn.classList.toggle('active');
        btnAll.classList.remove('active'); // Si toca uno individual, "TODOS" se desmarca visualmente

        if (btn.classList.contains('active')) {
            selectedFuentes.push(fuente);
        } else {
            selectedFuentes = selectedFuentes.filter(f => f !== fuente);
        }
        
        // Si activó todos manualmente uno por uno, volver a marcar "TODOS"
        const fuentesTotales = [...new Set(allData.map(d => d.fuente))].filter(f => f);
        if (selectedFuentes.length === fuentesTotales.length && fuentesTotales.length > 0) {
            btnAll.classList.add('active');
        }
    }
    
    // Resetear cascada al cambiar filtros
    resetDropdownsCascade();
    updateTemas();
}

function updateTemas() {
    // Filtrar data global según las fuentes prendidas
    const filteredByFuente = allData.filter(d => selectedFuentes.includes(d.fuente));
    const temas = [...new Set(filteredByFuente.map(d => d.tema))].filter(t => t).sort();
    
    selTema.innerHTML = '<option value="">-- Seleccionar Categoría --</option>';
    
    if (temas.length > 0) {
        selTema.disabled = false;
        temas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.innerText = t;
            selTema.appendChild(opt);
        });
    } else {
        selTema.disabled = true;
        selTema.innerHTML = '<option value="">No hay datos para esta fuente</option>';
    }
}

function updateSubtema() {
    const temaSelected = selTema.value;
    
    selConcepto.innerHTML = '<option value="">-- Seleccionar Concepto --</option>';
    resCard.classList.add('oculto');
    
    if (!temaSelected) {
        selConcepto.disabled = true;
        return;
    }
    
    selConcepto.disabled = false;
    
    // Filtrar por fuentes activas Y por tema seleccionado
    const subtemas = allData.filter(d => selectedFuentes.includes(d.fuente) && d.tema === temaSelected && d.concepto);
    
    subtemas.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.concepto;
        opt.innerText = d.concepto;
        selConcepto.appendChild(opt);
    });
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
    }
}

function resetDropdownsCascade() {
    selTema.value = '';
    selConcepto.value = '';
    selConcepto.disabled = true;
    selConcepto.innerHTML = '<option value="">Seleccione categoría primero...</option>';
    resCard.classList.add('oculto');
}

function resetForm() {
    // Resetear fuentes a estado inicial (Todas)
    const allButtons = document.querySelectorAll('.fuente-btn');
    allButtons.forEach(b => b.classList.add('active'));
    selectedFuentes = [...new Set(allData.map(d => d.fuente))].filter(f => f);
    
    resetDropdownsCascade();
    updateTemas();
          }

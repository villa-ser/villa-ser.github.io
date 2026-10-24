// =======================================================
// 1. CONFIGURACIÓN Y ESTADO
// =======================================================
const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM';
const URL_MAT = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Materiales`;
const URL_CLI = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=NombresClientes`;

let dataMat = [], dataCli = [];
let listaItems = []; // Array central que guarda el estado de la lista

const selCliente = document.getElementById('selCliente');
const selects = [
    document.getElementById('sel0'), document.getElementById('sel1'), 
    document.getElementById('sel2'), document.getElementById('sel3'), 
    document.getElementById('sel4'), document.getElementById('sel5')
];

// =======================================================
// 2. INICIALIZACIÓN, TEMA Y MEMORIA
// =======================================================
window.onload = async () => {
    // A. Detectar Tema Visual
    const temaGuardado = localStorage.getItem('temaVillaser');
    const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (temaGuardado === 'light' || (!temaGuardado && prefiereClaro)) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // B. Cargar Cerebro Cliente Global y Borrador local
    cargarClienteGlobal();
    cargarEstadoGuardado();
    
    // C. Cargar Base de datos
    await init();
};

async function init() {
    try {
        const [resMat, resCli] = await Promise.all([fetch(URL_MAT), fetch(URL_CLI)]);
        dataMat = parseCSV(await resMat.text());
        dataCli = parseCSV(await resCli.text());
        
        document.getElementById('status').style.display = "none";
        
        poblarClientes(dataCli);
        fillSelect(0, [...new Set(dataMat.map(item => item.c0))].filter(v => v));
        selects[0].disabled = false;

        setupEventListeners();
    } catch (e) { 
        document.getElementById('status').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error de conexión.'; 
        console.error(e);
    }
}

// Limpieza profunda de comillas y espacios de Google Sheets
function parseCSV(text) {
    return text.split('\n').slice(1).map(line => {
        const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => {
            let val = c.trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            return val.replace(/""/g, '"').trim();
        });
        return { c0: cells[0]||"", c1: cells[1]||"", c2: cells[2]||"", c3: cells[3]||"", c4: cells[4]||"", c5: cells[5]||"" };
    }).filter(item => item.c0);
}

function setupEventListeners() {
    selCliente.addEventListener('change', fillClientData);
    selects.forEach((sel, index) => {
        sel.addEventListener('change', () => updateDropdown(index + 1));
    });
}

// =======================================================
// 3. SINCRONIZACIÓN DE CLIENTES (GLOBAL)
// =======================================================
function cargarClienteGlobal() {
    const clienteStr = localStorage.getItem('villaser_cliente_global');
    if (clienteStr) {
        const cliente = JSON.parse(clienteStr);
        let recuperado = false;
        
        if (cliente.nombre) { document.getElementById('cliNombre').value = cliente.nombre; recuperado = true; }
        if (cliente.direccion) { document.getElementById('cliDir').value = cliente.direccion; recuperado = true; }
        if (cliente.proyecto) { document.getElementById('cliObs').value = cliente.proyecto; recuperado = true; }
        if (cliente.telefono) { document.getElementById('cliTel').value = cliente.telefono; recuperado = true; }
        
        const estadoStr = localStorage.getItem('materiales_estado_actual');
        const estado = estadoStr ? JSON.parse(estadoStr) : { items: [] };
        
        if (recuperado && (!estado.items || estado.items.length === 0)) {
            mostrarToast("Datos del cliente recuperados");
        }
    }
}

function guardarClienteGlobal() {
    const clienteObj = {
        nombre: document.getElementById('cliNombre').value.trim(),
        direccion: document.getElementById('cliDir').value.trim(),
        proyecto: document.getElementById('cliObs').value.trim(),
        telefono: document.getElementById('cliTel').value.trim()
    };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clienteObj));
    guardarEstado(); 
}

function mostrarToast(mensaje) {
    const toast = document.getElementById('toastCliente');
    document.getElementById('toastMsg').innerText = mensaje;
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 100);
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }, 5000);
}

// =======================================================
// 4. MEMORIA CONTINUA (Borrador Local)
// =======================================================
function guardarEstado() {
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliTel: document.getElementById('cliTel').value,
        cliDir: document.getElementById('cliDir').value,
        cliObs: document.getElementById('cliObs').value,
        items: listaItems
    };
    localStorage.setItem('materiales_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('materiales_estado_actual');
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        if (estado.cliNombre) document.getElementById('cliNombre').value = estado.cliNombre;
        if (estado.cliTel) document.getElementById('cliTel').value = estado.cliTel;
        if (estado.cliDir) document.getElementById('cliDir').value = estado.cliDir;
        if (estado.cliObs) document.getElementById('cliObs').value = estado.cliObs;
        
        listaItems = estado.items || [];
        if (listaItems.length > 0) {
            document.getElementById('section-client').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            document.getElementById('btnNuevoListado').classList.remove('hidden');
            renderItems();
        }
    }
}

function nuevoListado() {
    if(confirm("¿Estás seguro de iniciar una nueva lista? Se borrará el borrador actual.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliTel').value = '';
        document.getElementById('cliDir').value = '';
        document.getElementById('cliObs').value = '';
        listaItems = [];
        guardarEstado();
        
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('section-client').classList.remove('hidden');
        document.getElementById('btnNuevoListado').classList.add('hidden');
        renderItems();
    }
}

// =======================================================
// 5. LÓGICA DE MATERIALES Y CLIENTES
// =======================================================
function poblarClientes(lista) {
    selCliente.innerHTML = '<option value="">-- SELECCIONE CLIENTE --</option>';
    lista.forEach(c => { 
        const opt = document.createElement('option');
        opt.value = dataCli.indexOf(c);
        opt.textContent = c.c0;
        selCliente.appendChild(opt);
    });
}

function filtrarClientes() {
    const textoBuscado = document.getElementById('buscarCliente').value.toLowerCase();
    const listaFiltrada = dataCli.filter(c => c.c0.toLowerCase().includes(textoBuscado));
    poblarClientes(listaFiltrada);
    fillClientData();
}

function fillClientData() {
    const idx = selCliente.value;
    if (idx === "") return;
    const c = dataCli[idx];
    document.getElementById('cliNombre').value = c.c0;
    document.getElementById('cliTel').value = c.c1;
    document.getElementById('cliDir').value = c.c2;
    document.getElementById('cliObs').value = c.c3;
}

function updateDropdown(index) {
    for (let i = index; i < selects.length; i++) { 
        selects[i].innerHTML = '<option value="">-- Selección --</option>';
        selects[i].value = ""; selects[i].disabled = true;
    }
    if (index >= selects.length) return; 

    const filtered = dataMat.filter(item => {
        for (let i = 0; i < index; i++) { if (item[`c${i}`] !== selects[i].value) return false; }
        return true;
    });
    
    const uniqueVals = [...new Set(filtered.map(item => item[`c${index}`]))].filter(v => v);
    if (uniqueVals.length > 0) {
        selects[index].disabled = false;
        fillSelect(index, uniqueVals);
    }
}

function fillSelect(index, vals) {
    const sel = selects[index];
    sel.innerHTML = '<option value="">-- Selección --</option>';
    vals.forEach(v => { 
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v; sel.appendChild(opt);
    });
}

function changeQty(v) {
    const input = document.getElementById('cantidad');
    input.value = Math.max(1, parseInt(input.value || 0) + v);
}

// =======================================================
// 6. GESTIÓN DE LA LISTA VISUAL
// =======================================================
function renderItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    
    listaItems.forEach(i => {
        const div = document.createElement('div');
        let className = i.type === 'CLI' ? 'client-header' : (i.type === 'OBS' ? 'general-header' : '');
        div.className = "row-item " + className;
        div.setAttribute('data-raw', i.raw);
        div.innerHTML = `<div style="flex:1; overflow:hidden; text-overflow:ellipsis;">${i.html}</div>
                         <button class="btn-delete" aria-label="Eliminar ítem" onclick="borrarItem(${i.id})"><i class="fa-solid fa-trash"></i></button>`;
        container.appendChild(div);
    });
    
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) {
    listaItems = listaItems.filter(i => i.id !== id);
    guardarEstado(); renderItems();
}

function addClientToList() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if (!nombre) { alert("Por favor, ingrese el nombre del cliente."); document.getElementById('cliNombre').focus(); return; }
    
    const tel = document.getElementById('cliTel').value;
    const dir = document.getElementById('cliDir').value;
    const fecha = new Date().toLocaleDateString('es-AR');
    
    guardarClienteGlobal();
    listaItems = listaItems.filter(i => i.type !== 'CLI'); // Solo un cliente a la vez
    
    listaItems.unshift({ 
        id: Date.now(), type: 'CLI', 
        raw: `CLI\t${nombre}\t${tel}\t${dir}`, 
        html: `<strong style="color:var(--success-green); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> ${fecha} - ${nombre}</strong>` 
    });
    
    guardarEstado(); renderItems();
    
    const b = document.getElementById('btnCli'); 
    b.innerHTML = "<i class='fa-solid fa-check'></i> ¡LISTO!"; 
    b.style.background = 'var(--success-green)';
    b.style.color = '#fff';
    
    setTimeout(() => { 
        document.getElementById('section-client').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('btnNuevoListado').classList.remove('hidden');
    }, 500);
}

function addGeneralObs() {
    const obs = document.getElementById('obsGenerales').value;
    if (!obs.trim()) return;
    
    listaItems.push({ id: Date.now(), type: 'OBS', raw: `OBS\t${obs}`, html: `<i style="color:var(--ngc-text-main); opacity:0.8;">Nota: ${obs}</i>` });
    document.getElementById('obsGenerales').value = "";
    guardarEstado(); renderItems(); btnAlert('btnGen', '<i class="fa-solid fa-thumbtack"></i> Fijar');
}

function addItem() {
    let textParts = [];
    selects.forEach(s => { if (s.value) textParts.push(s.value); });
    if (textParts.length === 0) return;
    
    const cant = document.getElementById('cantidad').value;
    const unit = document.querySelector('input[name="um"]:checked').value;
    const obs = document.getElementById('observaciones').value;
    
    listaItems.push({ 
        id: Date.now(), type: 'ITM', 
        raw: `ITM\t${cant}\t${unit}\t${textParts.join(' ')}\t${obs}`, 
        html: `<b>${cant} ${unit.substring(0,3).toUpperCase()}</b> | ${textParts.join('/')} ${obs ? `<span style="color:var(--ngc-neon);">[${obs}]</span>` : ''}` 
    });
    
    selects[0].value = ""; updateDropdown(1); 
    document.getElementById('observaciones').value = ""; document.getElementById('cantidad').value = "1";
    guardarEstado(); renderItems();
    btnAlert('btnMat', '<i class="fa-solid fa-cart-plus"></i> Agregar');
}

function agregarItemManual() {
    const descripcion = prompt("Nombre o descripción del material libre:");
    if (!descripcion || descripcion.trim() === "") return;

    const cant = parseInt(prompt("Cantidad:", document.getElementById('cantidad').value || "1")) || 1;
    const unRadio = document.querySelector('input[name="um"]:checked');
    const unidadDefault = unRadio ? unRadio.value : "Unidades";
    
    const unidadBruta = prompt("Unidad (Ej: Unidades, Metros, Rollo):", unidadDefault) || unidadDefault;
    const unit = unidadBruta.charAt(0).toUpperCase() + unidadBruta.slice(1).toLowerCase();
    const obs = prompt("Notas del ítem (Opcional):", document.getElementById('observaciones').value || "") || "";

    listaItems.push({ 
        id: Date.now(), type: 'ITM', 
        raw: `ITM\t${cant}\t${unit}\t${descripcion.trim()}\t${obs.trim()}`, 
        html: `<b>${cant} ${unit.substring(0,3).toUpperCase()}</b> | ${descripcion.trim()} ${obs.trim() ? `<span style="color:var(--ngc-neon);">[${obs.trim()}]</span>` : ''}` 
    });

    document.getElementById('observaciones').value = ""; document.getElementById('cantidad').value = "1";
    guardarEstado(); renderItems();
}

function btnAlert(id, htmlOriginal) {
    const b = document.getElementById(id); 
    b.innerHTML = "<i class='fa-solid fa-check'></i> ¡LISTO!"; 
    b.style.background = 'var(--success-green)'; b.style.color = '#fff'; b.style.borderColor = 'var(--success-green)';
    setTimeout(() => { b.innerHTML = htmlOriginal; b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; }, 800);
}

// =======================================================
// 7. COMPOSICIÓN Y GENERACIÓN DE PDF PROFESIONAL
// =======================================================
function sincronizarVistaPreviaPDF() {
    // Traer datos corporativos guardados en Configuración Global (App Principal)
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '¡Electricidad Segura, Hogar Tranquilo!';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';

    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (imgPdf && txtPdf) {
        if (profLogo && profLogo.startsWith('data:image')) {
            imgPdf.src = profLogo; imgPdf.style.display = 'block'; txtPdf.style.display = 'none';
        } else {
            imgPdf.style.display = 'none'; txtPdf.innerText = profNombre.toUpperCase(); txtPdf.style.display = 'block';
        }
    }

    let clienteNombre = document.getElementById('cliNombre').value || "Cliente";
    let clienteTel = document.getElementById('cliTel').value || "";
    let notasAcumuladas = "";
    
    const tbody = document.getElementById('pdf-tbody');
    if(!tbody) return;
    tbody.innerHTML = ''; 

    listaItems.forEach((i) => {
        const raw = i.raw.split('\t');
        if (raw[0] === 'CLI') {
            clienteNombre = raw[1]; clienteTel = raw[2];
        } else if (raw[0] === 'OBS') {
            notasAcumuladas += `• ${raw[1]}<br>`;
        } else if (raw[0] === 'ITM') {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="text-align: center; font-weight: bold;">${raw[1]}</td><td style="text-align: center;">${raw[2].substring(0,4).toUpperCase()}</td><td>${raw[3]}</td><td style="font-size: 10.5px; color: #555;">${raw[4] || '-'}</td>`;
            tbody.appendChild(tr);
        }
    });

    if (document.getElementById('pdf-cliente')) document.getElementById('pdf-cliente').innerText = clienteNombre;
    if (document.getElementById('pdf-tel')) document.getElementById('pdf-tel').innerText = clienteTel;
    if (document.getElementById('pdf-fecha')) document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    
    if (document.getElementById('pdf-slogan')) document.getElementById('pdf-slogan').innerText = profSlogan;
    if (document.getElementById('pdf-tel-footer')) document.getElementById('pdf-tel-footer').innerText = profTel ? `📞 ${profTel}` : '';
    
    const boxNotas = document.getElementById('pdf-notas-box');
    if(notasAcumuladas && boxNotas) {
        document.getElementById('pdf-notas').innerHTML = notasAcumuladas;
        boxNotas.style.display = 'block';
    } else if (boxNotas) {
        boxNotas.style.display = 'none';
    }
}

async function generarPDF() {
    if (listaItems.length <= 1) { alert("Agrega materiales para generar el PDF."); return; }
    sincronizarVistaPreviaPDF();

    const element = document.getElementById('plantilla-pdf');
    const originalDisplay = getComputedStyle(element).display;
    if (originalDisplay === 'none') element.style.display = 'block';
    
    window.scrollTo(0, 0); 
    const clienteNombre = document.getElementById('cliNombre').value || "Cliente";
    
    const opt = {
        margin:       0, 
        filename:     `${clienteNombre.replace(/ /g, '_')}_Materiales.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    btnAlert('btnGenerarPDF', '<i class="fa-solid fa-file-pdf"></i> Generando...');
    try { await html2pdf().set(opt).from(element).save(); } 
    catch (error) { console.error("Error PDF: ", error); alert("Hubo un error al generar el PDF."); } 
    finally { if (window.innerWidth < 992) element.style.display = 'none'; }
}

// =======================================================
// 8. EXPORTACIÓN TXT Y CAPTURAS E IMÁGENES
// =======================================================
function takeScreenshot() {
    const area = document.getElementById('captureSection');
    const deletes = area.querySelectorAll('.btn-delete');
    deletes.forEach(b => b.style.visibility = 'hidden');
    
    const nameToUse = document.getElementById('cliNombre').value || "Lista";
    const isLightMode = document.body.classList.contains('light-mode');
    const bgColor = isLightMode ? "#ffffff" : "#181818";
    area.style.color = isLightMode ? "#1a1a1a" : "#ffffff";
    area.style.border = "none";
    window.scrollTo(0, 0);

    html2canvas(area, { backgroundColor: bgColor, scale: 2, useCORS: true, scrollY: 0 }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL("image/png"); link.download = `${nameToUse}_materiales.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        
        deletes.forEach(b => b.style.visibility = 'visible');
        area.style.color = ""; area.style.border = "";
    });
}

function exportToTxt() {
    if (listaItems.length === 0) { alert("La lista está vacía."); return; }
    const content = listaItems.map(i => i.raw).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (document.getElementById('cliNombre').value.trim() || "Lista") + "_Borrador_Villaser.txt";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    mostrarToast("Borrador descargado con éxito");
}

function importFromTxt(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        listaItems = [];
        
        lines.forEach(line => {
            if (!line.trim()) return;
            const raw = line.split('\t');
            if (raw[0] === 'CLI') {
                document.getElementById('cliNombre').value = raw[1] || '';
                document.getElementById('cliTel').value = raw[2] || '';
                document.getElementById('cliDir').value = raw[3] || '';
                listaItems.push({ id: Date.now() + Math.random(), type: 'CLI', raw: line, html: `<strong style="color:var(--success-green); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> ${new Date().toLocaleDateString('es-AR')} - ${raw[1]}</strong>` });
            } else if (raw[0] === 'OBS') {
                listaItems.push({ id: Date.now() + Math.random(), type: 'OBS', raw: line, html: `<i style="color:var(--ngc-text-main); opacity:0.8;">Nota: ${raw[1]}</i>` });
            } else if (raw[0] === 'ITM') {
                listaItems.push({ id: Date.now() + Math.random(), type: 'ITM', raw: line, html: `<b>${raw[1]} ${raw[2].substring(0,3).toUpperCase()}</b> | ${raw[3]} ${raw[4] ? `<span style="color:var(--ngc-neon);">[${raw[4]}]</span>` : ''}` });
            }
        });
        
        event.target.value = ""; guardarEstado(); renderItems();
        document.getElementById('section-client').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('btnNuevoListado').classList.remove('hidden');
        mostrarToast("Borrador cargado correctamente");
    };
    reader.readAsText(file);
}

function sendWSP() {
    const tel = document.getElementById('cliTel').value.trim();
    if (listaItems.length <= 1) { alert("Agrega materiales primero."); return; }
    
    let text = "*VILLASER - MATERIALES SOLICITADOS*\n";
    listaItems.forEach(i => {
        const raw = i.raw.split('\t');
        if (raw[0] === 'CLI') text += `\n*CLIENTE:* ${raw[1]}\n`;
        else if (raw[0] === 'OBS') text += `*NOTA:* ${raw[1]}\n`;
        else text += `• ${raw[1]} ${raw[2]} - ${raw[3]} ${raw[4] ? '('+raw[4]+')' : ''}\n`;
    });
    
    let cleanNumber = tel.replace(/\D/g, '');
    if (!cleanNumber) { alert("El cliente no tiene teléfono asignado, completa ese campo primero."); return; }

    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.location.href = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
    setTimeout(() => { if (document.hasFocus()) window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`, '_blank'); }, 500);
}

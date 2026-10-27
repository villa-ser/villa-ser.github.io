const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM';
const URL_MAT = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Materiales`;

let dataMat = [];
let listaItems = []; 

const selects = [
    document.getElementById('sel0'), document.getElementById('sel1'), 
    document.getElementById('sel2'), document.getElementById('sel3'), 
    document.getElementById('sel4'), document.getElementById('sel5')
];

window.onload = async () => {
    inicializarClienteMemoria();
    await init();
};

async function init() {
    try {
        const resMat = await fetch(URL_MAT);
        dataMat = parseCSV(await resMat.text());
        
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.classList.add('oculto');
        
        const sectionClient = document.getElementById('section-client');
        if (sectionClient) sectionClient.classList.remove('oculto');
        
        fillSelect(0, [...new Set(dataMat.map(item => item.c0))].filter(v => v));
        if(selects[0]) selects[0].disabled = false;

        setupEventListeners();
    } catch (e) { 
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error de conexión.'; 
        console.error(e);
    }
}

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
    selects.forEach((sel, index) => {
        if(sel) sel.addEventListener('change', () => updateDropdown(index + 1));
    });
}

function inicializarClienteMemoria() {
    const clienteStr = localStorage.getItem('villaser_cliente_global');
    const estadoStr = localStorage.getItem('materiales_estado_actual');
    const estado = estadoStr ? JSON.parse(estadoStr) : { items: [] };

    const modalRecuperar = document.getElementById('modalRecuperarCliente');

    if (clienteStr && estado.items.length === 0 && !estado.cliNombre) {
        window.clienteTemporal = JSON.parse(clienteStr);
        if (modalRecuperar) modalRecuperar.classList.remove('oculto');
    } else {
        cargarEstadoGuardado();
    }
}

function usarClienteMemoria() {
    if(document.getElementById('cliNombre')) document.getElementById('cliNombre').value = window.clienteTemporal.nombre || '';
    if(document.getElementById('cliDir')) document.getElementById('cliDir').value = window.clienteTemporal.direccion || '';
    if(document.getElementById('cliObs')) document.getElementById('cliObs').value = window.clienteTemporal.proyecto || '';
    
    guardarClienteGlobal();
    const modalRecuperar = document.getElementById('modalRecuperarCliente');
    if (modalRecuperar) modalRecuperar.classList.add('oculto');
}

function limpiarClienteMemoria() {
    const modalRecuperar = document.getElementById('modalRecuperarCliente');
    if (modalRecuperar) modalRecuperar.classList.add('oculto');
}

function guardarClienteGlobal() {
    const nombre = document.getElementById('cliNombre') ? document.getElementById('cliNombre').value.trim() : '';
    const direccion = document.getElementById('cliDir') ? document.getElementById('cliDir').value.trim() : '';
    const proyecto = document.getElementById('cliObs') ? document.getElementById('cliObs').value.trim() : '';
    
    const clienteObj = { nombre, direccion, proyecto };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clienteObj));
    guardarEstado(); 
}

function guardarEstado() {
    const estado = {
        cliNombre: document.getElementById('cliNombre') ? document.getElementById('cliNombre').value : '',
        cliDireccion: document.getElementById('cliDir') ? document.getElementById('cliDir').value : '',
        cliProyecto: document.getElementById('cliObs') ? document.getElementById('cliObs').value : '',
        obsGenerales: document.getElementById('obsGenerales') ? document.getElementById('obsGenerales').value : '',
        items: listaItems
    };
    localStorage.setItem('materiales_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('materiales_estado_actual');
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        if (estado.cliNombre && document.getElementById('cliNombre')) document.getElementById('cliNombre').value = estado.cliNombre;
        if (estado.cliDireccion && document.getElementById('cliDir')) document.getElementById('cliDir').value = estado.cliDireccion;
        if (estado.cliProyecto && document.getElementById('cliObs')) document.getElementById('cliObs').value = estado.cliProyecto;
        if (estado.obsGenerales && document.getElementById('obsGenerales')) document.getElementById('obsGenerales').value = estado.obsGenerales;
        
        listaItems = estado.items || [];
        if (listaItems.length > 0) {
            if (document.getElementById('section-client')) document.getElementById('section-client').classList.add('oculto');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.classList.remove('oculto');
                mainContent.classList.add('flex-column');
            }
            if (document.getElementById('btnNuevoListado')) document.getElementById('btnNuevoListado').classList.remove('oculto');
            renderItems();
        }
    }
}

function nuevoListado() {
    if(confirm("¿Estás seguro de iniciar una nueva lista? Se borrará el borrador actual.")) {
        if (document.getElementById('cliNombre')) document.getElementById('cliNombre').value = '';
        if (document.getElementById('cliDir')) document.getElementById('cliDir').value = '';
        if (document.getElementById('cliObs')) document.getElementById('cliObs').value = '';
        if (document.getElementById('obsGenerales')) document.getElementById('obsGenerales').value = '';
        
        listaItems = [];
        guardarEstado();
        guardarClienteGlobal();
        
        if (document.getElementById('main-content')) document.getElementById('main-content').classList.add('oculto');
        if (document.getElementById('section-client')) document.getElementById('section-client').classList.remove('oculto');
        if (document.getElementById('btnNuevoListado')) document.getElementById('btnNuevoListado').classList.add('oculto');
        renderItems();
    }
}

function updateDropdown(index) {
    for (let i = index; i < selects.length; i++) { 
        if(!selects[i]) continue;
        selects[i].innerHTML = '<option value="">-- Selección --</option>';
        selects[i].value = ""; selects[i].disabled = true;
    }
    if (index >= selects.length) return; 

    const filtered = dataMat.filter(item => {
        for (let i = 0; i < index; i++) { 
            if (!selects[i]) continue;
            if (item[`c${i}`] !== selects[i].value) return false; 
        }
        return true;
    });
    
    const uniqueVals = [...new Set(filtered.map(item => item[`c${index}`]))].filter(v => v);
    if (uniqueVals.length > 0 && selects[index]) {
        selects[index].disabled = false;
        fillSelect(index, uniqueVals);
    }
}

function fillSelect(index, vals) {
    const sel = selects[index];
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Selección --</option>';
    vals.forEach(v => { 
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v; sel.appendChild(opt);
    });
}
    
function changeQty(v) {
    const input = document.getElementById('cantidad');
    if (input) input.value = Math.max(1, parseInt(input.value || 0) + v);
}

function renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    listaItems.forEach(i => {
        const div = document.createElement('div');
        let className = i.type === 'CLI' ? 'client-header' : '';
        div.className = "row-item " + className;
        div.setAttribute('data-raw', i.raw);
        div.innerHTML = `<div style="flex:1; overflow:hidden; text-overflow:ellipsis;">${i.html}</div>
                         <button class="btn-delete" aria-label="Eliminar ítem" onclick="borrarItem(${i.id})"><i class="fa-solid fa-trash"></i></button>`;
        container.appendChild(div);
    });

    const obsEl = document.getElementById('obsGenerales');
    const og = obsEl ? obsEl.value : '';
    if(og) {
        const div = document.createElement('div');
        div.className = "row-item general-header";
        div.innerHTML = `<div style="flex:1;"><i style="color:var(--ngc-text-main); opacity:0.8;">Notas Globales: ${og}</i></div>`;
        container.appendChild(div);
    }
    
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) {
    listaItems = listaItems.filter(i => i.id !== id);
    guardarEstado(); renderItems();
}

function addClientToList() {
    const nombreEl = document.getElementById('cliNombre');
    const nombre = nombreEl ? nombreEl.value.trim() : '';
    if (!nombre) { alert("Por favor, ingrese el nombre del cliente."); if (nombreEl) nombreEl.focus(); return; }
    
    const dirEl = document.getElementById('cliDir');
    const dir = dirEl ? dirEl.value : '';
    const fecha = new Date().toLocaleDateString('es-AR');
    
    guardarClienteGlobal();
    listaItems = listaItems.filter(i => i.type !== 'CLI'); 
    
    listaItems.unshift({ 
        id: Date.now(), type: 'CLI', 
        raw: `CLI\t${nombre}\t${dir}`, 
        html: `<strong style="color:var(--success-green); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> ${fecha} - ${nombre}</strong>` 
    });
    
    guardarEstado(); renderItems();
    
    const b = document.getElementById('btnCli'); 
    if (b) {
        b.innerHTML = "<i class='fa-solid fa-check'></i> ¡LISTO!"; 
        b.style.background = 'var(--success-green)'; b.style.color = '#fff'; b.style.borderColor = 'var(--success-green)';
        
        setTimeout(() => { 
            if (document.getElementById('section-client')) document.getElementById('section-client').classList.add('oculto');
            const main = document.getElementById('main-content');
            if (main) {
                main.classList.remove('oculto');
                main.classList.add('flex-column');
            }
            if (document.getElementById('btnNuevoListado')) document.getElementById('btnNuevoListado').classList.remove('oculto');
            b.innerHTML = "<i class='fa-solid fa-play'></i> Iniciar Lista";
            b.style.background = ''; b.style.color = ''; b.style.borderColor = '';
        }, 500);
    }
}

function addItem() {
    let textParts = [];
    selects.forEach(s => { if (s && s.value) textParts.push(s.value); });
    if (textParts.length === 0) return;
    
    const cantEl = document.getElementById('cantidad');
    const cant = cantEl ? cantEl.value : '1';
    
    const unRadio = document.querySelector('input[name="um"]:checked');
    const unit = unRadio ? unRadio.value : 'Unidades';
    
    const obsEl = document.getElementById('observaciones');
    const obs = obsEl ? obsEl.value : '';
    
    listaItems.push({ 
        id: Date.now(), type: 'ITM', 
        raw: `ITM\t${cant}\t${unit}\t${textParts.join(' ')}\t${obs}`, 
        html: `<b>${cant} ${unit.substring(0,3).toUpperCase()}</b> | ${textParts.join('/')} ${obs ? `<span style="color:var(--ngc-neon);">[${obs}]</span>` : ''}` 
    });
    
    if (selects[0]) selects[0].value = ""; 
    updateDropdown(1); 
    if (obsEl) obsEl.value = ""; 
    if (cantEl) cantEl.value = "1";
    
    guardarEstado(); renderItems();
    btnAlert('btnMat', '<i class="fa-solid fa-cart-plus"></i> Agregar');
}

function agregarItemManual() {
    const descripcion = prompt("Nombre o descripción del material libre:");
    if (!descripcion || descripcion.trim() === "") return;

    const cantEl = document.getElementById('cantidad');
    const cant = parseInt(prompt("Cantidad:", cantEl ? cantEl.value || "1" : "1")) || 1;
    
    const unRadio = document.querySelector('input[name="um"]:checked');
    const unidadDefault = unRadio ? unRadio.value : "Unidades";
    
    const unidadBruta = prompt("Unidad (Ej: Unidades, Metros, Rollo):", unidadDefault) || unidadDefault;
    const unit = unidadBruta.charAt(0).toUpperCase() + unidadBruta.slice(1).toLowerCase();
    
    const obsEl = document.getElementById('observaciones');
    const obs = prompt("Notas del ítem (Opcional):", obsEl ? obsEl.value || "" : "") || "";

    listaItems.push({ 
        id: Date.now(), type: 'ITM', 
        raw: `ITM\t${cant}\t${unit}\t${descripcion.trim()}\t${obs.trim()}`, 
        html: `<b>${cant} ${unit.substring(0,3).toUpperCase()}</b> | ${descripcion.trim()} ${obs.trim() ? `<span style="color:var(--ngc-neon);">[${obs.trim()}]</span>` : ''}` 
    });

    if (obsEl) obsEl.value = ""; 
    if (cantEl) cantEl.value = "1";
    guardarEstado(); renderItems();
}

function btnAlert(id, htmlOriginal) {
    const b = document.getElementById(id); 
    if(!b) return;
    b.innerHTML = "<i class='fa-solid fa-check'></i> ¡LISTO!"; 
    b.style.background = 'var(--success-green)'; b.style.color = '#fff'; b.style.borderColor = 'var(--success-green)';
    setTimeout(() => { b.innerHTML = htmlOriginal; b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; }, 800);
}

function sincronizarVistaPreviaPDF() {
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

    const nombreEl = document.getElementById('cliNombre');
    let clienteNombre = nombreEl ? nombreEl.value : "Cliente";
    
    const dirEl = document.getElementById('cliDir');
    const obsEl = document.getElementById('cliObs');
    let clienteDireccion = (dirEl ? dirEl.value : '') || (obsEl ? obsEl.value : '') || "-";
    
    const tbody = document.getElementById('pdf-tbody');
    if(tbody) {
        tbody.innerHTML = ''; 
        listaItems.forEach((i) => {
            const raw = i.raw.split('\t');
            if (raw[0] === 'CLI') {
                clienteNombre = raw[1]; clienteDireccion = raw[2];
            } else if (raw[0] === 'ITM') {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="text-align: center; font-weight: bold;">${raw[1]}</td><td style="text-align: center;">${raw[2].substring(0,4).toUpperCase()}</td><td>${raw[3]}</td><td style="font-size: 10.5px; color: #555; text-align: left;">${raw[4] || '-'}</td>`;
                tbody.appendChild(tr);
            }
        });
    }

    if (document.getElementById('pdf-cliente')) document.getElementById('pdf-cliente').innerText = clienteNombre;
    if (document.getElementById('pdf-direccion')) document.getElementById('pdf-direccion').innerText = clienteDireccion;
    if (document.getElementById('pdf-fecha')) document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    if (document.getElementById('pdf-slogan')) document.getElementById('pdf-slogan').innerText = profSlogan;
    if (document.getElementById('pdf-tel-footer')) document.getElementById('pdf-tel-footer').innerText = profTel ? `📞 ${profTel}` : '';
    
    const boxNotas = document.getElementById('pdf-notas-box');
    const ogEl = document.getElementById('obsGenerales');
    const og = ogEl ? ogEl.value : '';

    if(og && boxNotas) {
        if (document.getElementById('pdf-notas')) document.getElementById('pdf-notas').innerText = og;
        boxNotas.style.display = 'block';
    } else if (boxNotas) {
        boxNotas.style.display = 'none';
    }
}

async function generarPDF() {
    if (listaItems.length <= 1) { alert("Agrega materiales para generar el PDF."); return; }
    sincronizarVistaPreviaPDF();

    const element = document.getElementById('plantilla-pdf');
    if(!element) return;
    
    const originalDisplay = getComputedStyle(element).display;
    if (originalDisplay === 'none') element.style.display = 'block';
    
    window.scrollTo(0, 0); 
    const nombreEl = document.getElementById('cliNombre');
    const clienteNombre = (nombreEl ? nombreEl.value : "Cliente") || "Cliente";
    
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

function takeScreenshot() {
    const area = document.getElementById('captureSection');
    if(!area) return;
    
    const deletes = area.querySelectorAll('.btn-delete');
    deletes.forEach(b => b.style.visibility = 'hidden');
    
    const nombreEl = document.getElementById('cliNombre');
    const nameToUse = (nombreEl ? nombreEl.value : "Lista") || "Lista";
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
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
    const ogEl = document.getElementById('obsGenerales');
    const obsGen = ogEl ? ogEl.value.replace(/\n/g, '\\n') : '';
    if (listaItems.length === 0 && !obsGen) { alert("La lista está vacía."); return; }

    let content = listaItems.map(i => i.raw).join('\n');
    if (obsGen) content += `\nGLOBAL_OBS\t${obsGen}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const nombreEl = document.getElementById('cliNombre');
    link.download = ((nombreEl ? nombreEl.value.trim() : "") || "Lista") + "_Borrador.txt";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function importFromTxt(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        listaItems = [];
        const ogEl = document.getElementById('obsGenerales');
        if (ogEl) ogEl.value = ""; 
        
        lines.forEach(line => {
            if (!line.trim()) return;
            const raw = line.split('\t');
            if (raw[0] === 'CLI') {
                if (document.getElementById('cliNombre')) document.getElementById('cliNombre').value = raw[1] || '';
                if (document.getElementById('cliDir')) document.getElementById('cliDir').value = raw[2] || '';
                listaItems.push({ id: Date.now() + Math.random(), type: 'CLI', raw: line, html: `<strong style="color:var(--success-green); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> ${new Date().toLocaleDateString('es-AR')} - ${raw[1]}</strong>` });
            } else if (raw[0] === 'ITM') {
                listaItems.push({ id: Date.now() + Math.random(), type: 'ITM', raw: line, html: `<b>${raw[1]} ${raw[2].substring(0,3).toUpperCase()}</b> | ${raw[3]} ${raw[4] ? `<span style="color:var(--ngc-neon);">[${raw[4]}]</span>` : ''}` });
            } else if (raw[0] === 'GLOBAL_OBS') {
                if (ogEl) ogEl.value = raw[1].replace(/\\n/g, '\n');
            }
        });
        
        event.target.value = ""; guardarEstado(); renderItems();
        guardarClienteGlobal();
        if (document.getElementById('section-client')) document.getElementById('section-client').classList.add('oculto');
        const main = document.getElementById('main-content');
        if (main) {
            main.classList.remove('oculto');
            main.classList.add('flex-column');
        }
        if (document.getElementById('btnNuevoListado')) document.getElementById('btnNuevoListado').classList.remove('oculto');
    };
    reader.readAsText(file);
}

function sendWSP() {
    const tel = prompt("Ingresá el número de WhatsApp del cliente (Ej: 3511234567):");
    if(!tel) return;

    if (listaItems.length <= 1) { alert("Agrega materiales primero."); return; }
    
    let text = "*VILLASER - MATERIALES SOLICITADOS*\n";
    listaItems.forEach(i => {
        const raw = i.raw.split('\t');
        if (raw[0] === 'CLI') text += `\n*CLIENTE:* ${raw[1]}\n`;
        else if (raw[0] === 'ITM') text += `• ${raw[1]} ${raw[2]} - ${raw[3]} ${raw[4] ? '('+raw[4]+')' : ''}\n`;
    });

    const ogEl = document.getElementById('obsGenerales');
    const obsGen = ogEl ? ogEl.value : '';
    if (obsGen) text += `\n*NOTAS GLOBALES:*\n${obsGen}\n`;
    
    let cleanNumber = tel.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.location.href = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
    setTimeout(() => { if (document.hasFocus()) window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`, '_blank'); }, 500);
                                                                                                                                                   }

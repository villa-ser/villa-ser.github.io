// ==========================================
// CONFIGURACIÓN Y ESTADO
// ==========================================
const SHEET_ID = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
const URL_PRECIOS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbPrecios = [];
let diccionarioSugerencias = [];
let listaItems = [];
let notasOriginales = "";
let nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;

let conceptoEditado = null;
let precioEditado = null;

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');
const buscadorTrabajo = document.getElementById('buscadorTrabajo');
const sugerenciasTrabajo = document.getElementById('sugerenciasTrabajo');

// Diccionarios de búsqueda
const palabrasVacias = new Set(["electrico", "electrica", "el", "la", "los", "las", "un", "una", "unos", "unas", "a", "ante", "con", "contra", "de", "desde", "en", "entre", "hacia", "hasta", "para", "por", "sin", "sobre", "y", "e", "ni", "o", "u", "pero", "mas", "como", "si", "que", "yo", "tu", "el", "ella", "nosotros", "este", "ese", "aquel", "esta", "esa", "esto", "eso", "muy", "mucho", "poco", "mas", "menos", "nuevo", "viejo", "solo"]);

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.onload = () => {
    cargarEstadoGuardado();
    fetchData();
};

async function fetchData() {
    try {
        const resPre = await fetch(URL_PRECIOS);
        const txtPre = await resPre.text();
        const jPre = JSON.parse(txtPre.substring(txtPre.indexOf("{"), txtPre.lastIndexOf("}") + 1));
        
        dbPrecios = jPre.table.rows.filter(r => r.c[1] && r.c[1].v !== "Concepto").map(r => ({ 
            tema: r.c[0]?.v || 'Gral', 
            concepto: r.c[1]?.v || '', 
            precio: typeof r.c[2]?.v === 'number' ? r.c[2].v : 0, 
            notas: r.c[3]?.v || '' 
        }));
        
        construirDiccionarioSugerencias();
        poblarTemas();
        setupEventListeners();
        
        document.getElementById('loading').classList.add('oculto'); 
        document.getElementById('app').classList.remove('oculto');

        if (listaItems.length > 0) iniciarPresupuesto();

    } catch (e) { 
        document.getElementById('loading').innerHTML = `⚠️ Error de conexión a la base de datos.<br><br><button class="ngc-btn" onclick="location.reload()">Reintentar</button>`;
        console.error(e);
    }
}

function setupEventListeners() {
    selTema.addEventListener('change', cambioTema);
    selConcepto.addEventListener('change', cargarDetallePrecios);
    
    buscadorTrabajo.addEventListener("input", manejarBuscador);
    document.addEventListener("click", (e) => {
        if(e.target !== buscadorTrabajo && !sugerenciasTrabajo.contains(e.target)) {
            sugerenciasTrabajo.classList.add("oculto");
        }
    });
}

// ==========================================
// ESTADO LOCAL (Borrador)
// ==========================================
function guardarEstado() {
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        nro: nroPresupuestoGlobal
    };
    localStorage.setItem('presupuesto_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('presupuesto_estado_actual');
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        document.getElementById('cliNombre').value = estado.cliNombre || '';
        document.getElementById('cliDireccion').value = estado.cliDireccion || '';
        document.getElementById('cliProyecto').value = estado.cliProyecto || '';
        document.getElementById('obsGenerales').value = estado.obsGenerales || '';
        listaItems = estado.items || [];
        if (estado.nro) nroPresupuestoGlobal = estado.nro;
    }
}

function nuevoPresupuesto() {
    if(confirm("¿Estás seguro de iniciar un nuevo presupuesto? Se borrará el borrador actual.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliDireccion').value = '';
        document.getElementById('cliProyecto').value = '';
        document.getElementById('obsGenerales').value = '';
        listaItems = [];
        nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;
        guardarEstado();
        
        document.getElementById('step-trabajo').classList.add('oculto');
        document.getElementById('step-cliente').classList.remove('oculto');
        renderTabla();
    }
}

function iniciarPresupuesto() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) {
        alert("Por favor, ingresá al menos el Nombre del Cliente.");
        document.getElementById('cliNombre').focus();
        return;
    }
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    guardarEstado();
    renderTabla();
}

// ==========================================
// FUNCIONES DE ÍTEMS Y CÁLCULOS
// ==========================================
function step(id, val) { 
    const el = document.getElementById(id); 
    let newValue = parseInt(el.value || 0) + val;
    el.value = Math.max(el.min ? parseInt(el.min) : 0, newValue); 
}

function poblarTemas() { 
    selTema.innerHTML = '<option value="">-- SELECCIONE RUBRO --</option>';
    [...new Set(dbPrecios.map(i => i.tema))].sort().forEach(t => { 
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        selTema.appendChild(opt);
    }); 
}

function cambioTema() { 
    const t = selTema.value; 
    selConcepto.innerHTML = '<option value="">-- SELECCIONE TRABAJO --</option>';
    limpiarEdicionesTemporales();
    document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
    document.getElementById('obsManual').value = "";

    if(t) {
        selConcepto.disabled = false;
        dbPrecios.filter(i => i.tema === t).forEach(i => { 
            const opt = document.createElement('option');
            opt.value = i.concepto;
            opt.textContent = i.concepto;
            selConcepto.appendChild(opt);
        }); 
    } else {
        selConcepto.disabled = true;
    }
}

function limpiarEdicionesTemporales() {
    conceptoEditado = null;
    precioEditado = null;
    document.getElementById('badgeConcepto').style.display = 'none';
    document.getElementById('badgePrecio').style.display = 'none';
    document.getElementById('btnEditConcepto').style.display = 'none';
    document.getElementById('btnEditPrecio').style.display = 'none';
}

function cargarDetallePrecios() { 
    const item = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value); 
    const inputObs = document.getElementById('obsManual');
    limpiarEdicionesTemporales();
    
    if(item) { 
        document.getElementById('unitarioLabel').innerText = `Unit: $ ${item.precio.toLocaleString('es-AR')}`; 
        inputObs.value = item.notas; 
        notasOriginales = item.notas; 
        inputObs.readOnly = true; 
        document.getElementById('btnEditConcepto').style.display = 'inline-block';
        document.getElementById('btnEditPrecio').style.display = 'inline-block';
    } else {
        document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
        inputObs.value = "";
    }
}

function editarConceptoTemporal() {
    const itemActual = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if (!itemActual) return;
    const valorBase = conceptoEditado !== null ? conceptoEditado : itemActual.concepto;
    const nuevoTexto = prompt("Editar nombre del trabajo:", valorBase);
    if (nuevoTexto !== null && nuevoTexto.trim() !== "") {
        conceptoEditado = nuevoTexto.trim();
        document.getElementById('badgeConcepto').style.display = 'block';
    }
}

function editarPrecioTemporal() {
    const itemActual = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if (!itemActual) return;
    const valorBase = precioEditado !== null ? precioEditado : itemActual.precio;
    const nuevoPrecioStr = prompt("Editar precio unitario:", valorBase);
    if (nuevoPrecioStr !== null) {
        const nuevoPrecio = parseFloat(nuevoPrecioStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isNaN(nuevoPrecio)) {
            precioEditado = nuevoPrecio;
            document.getElementById('unitarioLabel').innerText = `Unit: $ ${nuevoPrecio.toLocaleString('es-AR')}`;
            document.getElementById('badgePrecio').style.display = 'block';
        }
    }
}

function habilitarEdicionObs() { document.getElementById('obsManual').readOnly = false; document.getElementById('obsManual').focus(); }
function volverNotasOriginales() { document.getElementById('obsManual').value = notasOriginales; document.getElementById('obsManual').readOnly = true; }
function borrarTodasNotas() { document.getElementById('obsManual').value = ""; }

function agregarTrabajo() {
    const itemOriginal = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if(!itemOriginal) { alert("Seleccione un trabajo para agregar."); return; }
    
    const finalConcepto = conceptoEditado !== null ? conceptoEditado : itemOriginal.concepto;
    const finalPrecio = precioEditado !== null ? precioEditado : itemOriginal.precio;
    const qty = parseInt(document.getElementById('cantidad').value) || 1;
    const desc = parseInt(document.getElementById('porcentajeDesc').value) || 0;
    const finalTotal = (finalPrecio * qty) * (1 - desc / 100);
          
    listaItems.push({ id: Date.now(), concepto: finalConcepto, obs: document.getElementById('obsManual').value, qty, total: finalTotal, unitario: finalPrecio, desc });
    
    guardarEstado();
    renderTabla(); 
    
    document.getElementById('obsManual').value = ""; 
    document.getElementById('cantidad').value = 1; 
    document.getElementById('porcentajeDesc').value = 0;
    buscadorTrabajo.value = "";
    selConcepto.value = ""; 
    limpiarEdicionesTemporales();
    document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
}

// ==========================================
// RENDERIZADO VISUAL Y CREADOR PDF
// ==========================================
function renderTabla() {
    const tbody = document.getElementById('cuerpoTabla'); 
    tbody.innerHTML = ''; 
    let total = 0;
    
    const cliNombre = document.getElementById('cliNombre').value || 'Sin Nombre';
    const cliProy = document.getElementById('cliProyecto').value || 'Presupuesto General';
    const fecha = new Date().toLocaleDateString('es-AR');
    
    const rHeader = tbody.insertRow(); 
    rHeader.innerHTML = `<td colspan="4" style="color:var(--ngc-neon); font-size:0.85rem; padding-bottom:15px; line-height: 1.4;"><b>CLIENTE:</b> ${cliNombre}<br><b>PROYECTO:</b> ${cliProy} <br><b>FECHA:</b> ${fecha}</td>`; 
    
    listaItems.forEach(i => { 
        total += i.total; 
        const r = tbody.insertRow(); 
        r.innerHTML = `
            <td>
                <b>${i.concepto}</b>
                <span style="display:block; font-size:0.8rem; color:var(--ngc-text-faded);">Unit: $${i.unitario.toLocaleString('es-AR')}${i.desc > 0 ? ` <strong style="color:var(--ngc-warning)">(-${i.desc}%)</strong>` : ''}</span>
                ${i.obs ? `<small style="display:block; opacity:0.8; white-space: pre-wrap; margin-top:4px;">${i.obs}</small>` : ''}
            </td>
            <td align="center" style="font-weight:bold;">x${i.qty}</td>
            <td align="right" style="color:var(--ngc-neon); font-weight:bold; font-size:1.05rem;">$${i.total.toLocaleString('es-AR')}</td>
            <td align="right" style="width: 40px;"><button class="trash-icon" onclick="borrarItem(${i.id})"><i class="fa-solid fa-trash"></i></button></td>
        `; 
    });
    
    const og = document.getElementById('obsGenerales').value; 
    if(og) { 
        const r = tbody.insertRow(); 
        r.innerHTML = `<td colspan="4" style="font-size:0.9rem; color:var(--ngc-text-faded); padding-top:15px; font-style:italic;">Nota: ${og}</td>`; 
    }
    
    document.getElementById('totalDisplay').innerText = `TOTAL: $ ${total.toLocaleString('es-AR')}`;
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) { 
    listaItems = listaItems.filter(i => i.id !== id); 
    guardarEstado(); renderTabla(); 
}

function actualizarPDFHeaders() {
    // Aquí EXTRAEMOS los datos configurados en el panel del menú principal
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';
    // Correo (puedes añadir este campo al config luego, lo simulamos para el PDF)
    const profEmail = localStorage.getItem('villaser_conf_email') || '';

    document.getElementById('headerMembrete').innerText = profNombre.toUpperCase();
    
    document.getElementById('pdf-slogan').innerText = profSlogan;
    document.getElementById('pdf-tel').innerText = profTel ? `📞 ${profTel}` : '';
    document.getElementById('pdf-email').innerText = profEmail ? `✉️ ${profEmail}` : '';

    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (profLogo && profLogo.startsWith('data:image')) {
        imgPdf.src = profLogo;
        imgPdf.style.display = 'block';
        txtPdf.style.display = 'none';
    } else {
        imgPdf.style.display = 'none';
        txtPdf.innerText = profNombre.toUpperCase();
        txtPdf.style.display = 'block';
    }
}

function sincronizarVistaPreviaPDF() {
    actualizarPDFHeaders();

    document.getElementById('pdf-nro').innerText = nroPresupuestoGlobal;
    document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    document.getElementById('pdf-cliente').innerText = document.getElementById('cliNombre').value || 'Sin Nombre';
    document.getElementById('pdf-direccion').innerText = document.getElementById('cliDireccion').value || 'A coordinar';
    document.getElementById('pdf-proyecto').innerText = document.getElementById('cliProyecto').value || '-';

    const tbody = document.getElementById('pdf-tbody');
    tbody.innerHTML = '';
    
    let subtotalPuro = 0; let totalDescuentos = 0; let notasAcumuladas = '';

    listaItems.forEach((i, index) => {
        const codigoItem = `0${index + 1}-0${Math.floor(Math.random() * 5) + 1}`; 
        const subtotalFilaPuro = i.unitario * i.qty;
        const descuentoFila = subtotalFilaPuro - i.total;

        subtotalPuro += subtotalFilaPuro; totalDescuentos += descuentoFila;

        let textoConcepto = i.concepto;
        if (i.desc > 0) textoConcepto += ` <strong style="color: #ffc107;">(-${i.desc}%)</strong>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${codigoItem}</td><td>${textoConcepto}</td><td>${i.qty}</td><td>$&nbsp;${i.unitario.toLocaleString('es-AR')}</td><td>$&nbsp;${subtotalFilaPuro.toLocaleString('es-AR')}</td>`;
        tbody.appendChild(tr);

        if(i.obs) notasAcumuladas += `<b>${codigoItem}</b> ${i.obs.replace(/\n/g, ' ')}\n`;
    });

    const og = document.getElementById('obsGenerales').value;
    if(og) notasAcumuladas += `\n<b>Gral:</b> ${og}`;

    document.getElementById('pdf-subtotal').innerText = `$ ${subtotalPuro.toLocaleString('es-AR')}`;
    document.getElementById('pdf-descuentos').innerText = `-$ ${totalDescuentos.toLocaleString('es-AR')}`;
    document.getElementById('pdf-total').innerText = `$ ${(subtotalPuro - totalDescuentos).toLocaleString('es-AR')}`;
    document.getElementById('pdf-notas').innerHTML = notasAcumuladas ? notasAcumuladas.replace(/\n/g, '<br>') : 'Sin notas aclaratorias.';
}

// ==========================================
// EXPORTACIÓN, IMPORTACIÓN Y CAPTURA
// ==========================================
function exportarJSON() {
    if (listaItems.length === 0) return alert("No hay datos para exportar.");
    const estado = JSON.parse(localStorage.getItem('presupuesto_estado_actual') || '{}');
    const jsonString = JSON.stringify(estado, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const cliNombre = document.getElementById('cliNombre').value.split(' ')[0] || 'Cliente';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presupuesto_${cliNombre}_Backup.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importarJSON(e) {
    const file = e.target.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            localStorage.setItem('presupuesto_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado();
            
            document.getElementById('step-cliente').classList.add('oculto');
            document.getElementById('step-trabajo').classList.remove('oculto');
            document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
            renderTabla();
        } catch(err) { alert("Archivo JSON no válido"); }
    };
    reader.readAsText(file); e.target.value = '';
}

async function tomarCaptura() { 
    const zona = document.getElementById('zonaCaptura'); 
    document.querySelectorAll('.trash-icon').forEach(b => b.style.display = 'none'); 
    zona.style.color = "#ffffff";
    const scrollY = window.scrollY; window.scrollTo(0, 0);

    const canvas = await html2canvas(zona, { backgroundColor: "#1e1e1e", scale: 2, useCORS: true, scrollY: 0 }); 
    window.scrollTo(0, scrollY);
    
    const link = document.createElement('a'); 
    const n = document.getElementById('cliNombre').value.split(' ')[0] || 'Cliente';
    link.download = `Resumen_${n}.png`; link.href = canvas.toDataURL(); link.click(); 
    
    document.querySelectorAll('.trash-icon').forEach(b => b.style.display = 'inline-block'); 
    zona.style.color = ""; 
}

async function generarPDF() {
    if (listaItems.length === 0) return alert("Agregá trabajos para generar el PDF.");
    sincronizarVistaPreviaPDF();

    const element = document.getElementById('plantilla-pdf');
    const originalDisplay = getComputedStyle(element).display;
    if (originalDisplay === 'none') element.style.display = 'block';
    window.scrollTo(0, 0);

    const cliNombre = document.getElementById('cliNombre').value.replace(/ /g, '_') || 'Cliente';
    const opt = {
        margin:       0, 
        filename:     `${cliNombre}_Presupuesto.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) { alert("Error al generar el PDF."); } 
    finally { if (window.innerWidth < 992) element.style.display = 'none'; }
}
function enviarWhatsApp() { 
    const tel = prompt("Ingresá el número de WhatsApp del cliente (Ej: 3511234567):");
    if(!tel) return;
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PRESUPUESTO';
    let m = `*${profNombre.toUpperCase()}*\nProyecto: ${document.getElementById('cliProyecto').value}\n\n`; 
    listaItems.forEach(i => { m += `• ${i.concepto} (x${i.qty}) -> *$${i.total.toLocaleString('es-AR')}*\n`; }); 
    m += `\n*TOTAL: ${document.getElementById('totalDisplay').innerText.split(': ')[1]}*`; 
    window.open(`https://wa.me/549${tel.replace(/\D/g, '')}?text=${encodeURIComponent(m)}`, '_blank'); 
}

async function copiarTitulo() {
    const n = document.getElementById('cliNombre').value.split(' ')[0] || 'Cliente';
    const f = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const texto = `${n}_Presupuesto_${f}`;
    try { await navigator.clipboard.writeText(texto); alert("Título copiado"); } 
    catch (err) { alert("Navegador no soporta copiado"); }
}

// ==========================================
// MOTOR DE BÚSQUEDA AVANZADO
// ==========================================
function normalizarFonetica(texto) {
    return texto.split(/\s+/).map(p => {
        p = p.replace(/ll/g, "y").replace(/y/g, "i").replace(/v/g, "b").replace(/z/g, "s")
             .replace(/ce/g, "se").replace(/ci/g, "si").replace(/ch/g, "x").replace(/h/g, "").replace(/x/g, "ch");       
        if (p.length > 4 && p.endsWith("es")) p = p.slice(0, -2);
        else if (p.length > 3 && p.endsWith("s")) p = p.slice(0, -1);
        return p;
    }).join(" ");
}

function obtenerPalabrasClave(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(p => p.length > 0);
}

function construirDiccionarioSugerencias() {
    let palabras = new Set();
    dbPrecios.forEach(item => {
        let tokens = item.concepto.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, ' ').split(/\s+/);
        tokens.forEach(word => {
            let w = word.toLowerCase();
            if (w.length >= 3 && !palabrasVacias.has(w)) palabras.add(w);
        });
    });
    diccionarioSugerencias = Array.from(palabras);
}

function distanciaLevenshtein(a, b) {
    const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
    for (let j = 0; j <= b.length; j++) matriz[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const costo = a[i - 1] === b[j - 1] ? 0 : 1;
            matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + costo);
        }
    }
    return matriz[a.length][b.length];
}

function manejarBuscador() {
    const texto = buscadorTrabajo.value.trim().toLowerCase();
    sugerenciasTrabajo.innerHTML = '';
    if (texto.length < 3) { sugerenciasTrabajo.classList.add("oculto"); return; }

    const busquedaFonetica = normalizarFonetica(texto);
    const resultados = [];

    dbPrecios.forEach(item => {
        const conceptoNorm = item.concepto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const conceptoFon = normalizarFonetica(conceptoNorm);
        
        let score = 0;
        if (conceptoNorm.includes(texto)) score += 50;
        else if (conceptoFon.includes(busquedaFonetica)) score += 30;
        
        if (score === 0) {
            const pBuscadas = obtenerPalabrasClave(texto);
            const pConcepto = obtenerPalabrasClave(item.concepto);
            let matchCount = 0;
            
            pBuscadas.forEach(pb => {
                const pbFon = normalizarFonetica(pb);
                for (let pc of pConcepto) {
                    if (pc === pb || normalizarFonetica(pc) === pbFon || distanciaLevenshtein(pb, pc) <= 1) {
                        matchCount++; break;
                    }
                }
            });
            if (matchCount > 0 && matchCount >= pBuscadas.length - 1) score += 20;
        }
        if (score > 0) resultados.push({ item, score });
    });

    resultados.sort((a, b) => b.score - a.score);
    const topResultados = resultados.slice(0, 10);

    if (topResultados.length === 0) {
        sugerenciasTrabajo.innerHTML = '<li style="color:var(--ngc-text-faded);">No se encontraron coincidencias</li>';
    } else {
        topResultados.forEach(res => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${res.item.concepto}</strong> <br><small style="color:var(--ngc-neon)">${res.item.tema} - $${res.item.precio}</small>`;
            li.onclick = () => {
                selTema.value = res.item.tema;
                cambioTema(); 
                selConcepto.value = res.item.concepto;
                cargarDetallePrecios(); 
                buscadorTrabajo.value = "";
                sugerenciasTrabajo.classList.add("oculto");
                document.getElementById('cantidad').focus();
            };
            sugerenciasTrabajo.appendChild(li);
        });
    }
    sugerenciasTrabajo.classList.remove("oculto");
              }

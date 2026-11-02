// ==========================================
// MÓDULO MATERIALES - GLOBAL CSS MATCH
// ==========================================


let db = null;
const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM'; 
const URL_MATERIALES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbMateriales = [];
let listaItems = [];
let uidSeguro = null;

let clienteDesdeAgenda = false;
let permiteGuardarNube = true;

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');
const selNivel3 = document.getElementById('selNivel3');
const selNivel4 = document.getElementById('selNivel4');
const selNivel5 = document.getElementById('selNivel5');

const inputNombre = document.getElementById('cliNombre');

// ==========================================
// INICIALIZACIÓN
// ==========================================
function arrancarModulo() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            db = firebase.firestore();
            if (typeof firebase.auth === 'function') {
                firebase.auth().onAuthStateChanged(user => {
                    if (user) { uidSeguro = user.uid; window.currentUserUid = user.uid; }
                });
            }
        }
    } catch (e) { console.warn("Modo local.", e); }

    try { cargarEstadoGuardado(); } 
    catch (e) { localStorage.removeItem('materiales_estado_actual'); }

    fetchData();
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', arrancarModulo); } else { arrancarModulo(); }

function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof window.currentUserUid !== 'undefined' && window.currentUserUid) return window.currentUserUid;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function') { const user = firebase.auth().currentUser; if (user) return user.uid; }
    return null; 
}

// ==========================================
// FETCH Y CASCADA
// ==========================================
async function fetchData() {
    try {
        const res = await fetch(URL_MATERIALES);
        const txt = await res.text();
        const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
        
        dbMateriales = json.table.rows.map(r => ({ 
            tema: r.c[0]?.v || '', 
            concepto: r.c[1]?.v || '',
            nivel3: r.c[2]?.v || '', 
            nivel4: r.c[3]?.v || '', 
            nivel5: r.c[4]?.v || ''  
        })).filter(i => i.tema && i.concepto && i.concepto !== "Concepto");
        
        poblarTemas();
        if (selTema) selTema.addEventListener('change', cambioTema);
        if (selConcepto) selConcepto.addEventListener('change', cambioConcepto);
        if (selNivel3) selNivel3.addEventListener('change', cambioNivel3);
        if (selNivel4) selNivel4.addEventListener('change', cambioNivel4);
        
        document.getElementById('loading').classList.add('oculto'); 
        document.getElementById('app').classList.remove('oculto');

        if (listaItems.length > 0) avanzarPasoTrabajo();
    } catch (e) { 
        document.getElementById('loading').innerHTML = `⚠️ Error leyendo Google Sheets.<br><br><button class="corp-btn" onclick="location.reload()">Reintentar</button>`;
    }
}

function llenarSelect(selectEl, dataArray) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">-- SELECCIONE --</option>';
    const unicos = [...new Set(dataArray)].filter(Boolean).sort();
    unicos.forEach(val => selectEl.appendChild(new Option(val, val)));
    selectEl.disabled = unicos.length === 0;
}

function poblarTemas() { if(selTema) llenarSelect(selTema, dbMateriales.map(i => i.tema)); }
function cambioTema() { const t = selTema.value; llenarSelect(selConcepto, dbMateriales.filter(i => i.tema === t).map(i => i.concepto)); llenarSelect(selNivel3, []); llenarSelect(selNivel4, []); llenarSelect(selNivel5, []); }
function cambioConcepto() { const t = selTema.value; const c = selConcepto.value; llenarSelect(selNivel3, dbMateriales.filter(i => i.tema === t && i.concepto === c).map(i => i.nivel3)); llenarSelect(selNivel4, []); llenarSelect(selNivel5, []); }
function cambioNivel3() { const t = selTema.value; const c = selConcepto.value; const n3 = selNivel3.value; llenarSelect(selNivel4, dbMateriales.filter(i => i.tema === t && i.concepto === c && i.nivel3 === n3).map(i => i.nivel4)); llenarSelect(selNivel5, []); }
function cambioNivel4() { const t = selTema.value; const c = selConcepto.value; const n3 = selNivel3.value; const n4 = selNivel4.value; llenarSelect(selNivel5, dbMateriales.filter(i => i.tema === t && i.concepto === c && i.nivel3 === n3 && i.nivel4 === n4).map(i => i.nivel5)); }

// ==========================================
// AGENDA
// ==========================================
function marcarClienteManual() { clienteDesdeAgenda = false; permiteGuardarNube = true; }

function seleccionarContacto(nombre, dir) {
    document.getElementById('cliNombre').value = nombre; document.getElementById('cliDireccion').value = dir;
    clienteDesdeAgenda = true; permiteGuardarNube = true; guardarClienteGlobal(); cerrarModalAgendaGlobal();
    mostrarToast("Cliente Seleccionado", "Datos importados.");
}
function iniciarLista() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) { alert("Por favor, ingresá al menos el Nombre del Cliente."); document.getElementById('cliNombre').focus(); return; }
    if (!clienteDesdeAgenda) return document.getElementById('modalOpcionesCliente').classList.remove('oculto');
    avanzarPasoTrabajo();
}
function opcionBuscarAgenda() { document.getElementById('modalOpcionesCliente').classList.add('oculto'); abrirModalAgendaGlobal(); }
function opcionContinuarSinAgenda() { document.getElementById('modalOpcionesCliente').classList.add('oculto'); document.getElementById('modalAdvertenciaBorrador').classList.remove('oculto'); }
function confirmarListaTemporal() { permiteGuardarNube = false; document.getElementById('modalAdvertenciaBorrador').classList.add('oculto'); avanzarPasoTrabajo(); }
function cancelarListaTemporal() { document.getElementById('modalAdvertenciaBorrador').classList.add('oculto'); }

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    guardarClienteGlobal(); renderTabla();
}

// ==========================================
// BORRADORES EN NUBE
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false) {
    const uid = obtenerUid(); if (!uid || !db) return mostrarAlerta && alert("⚠️ Sesión no detectada.");
    if (!permiteGuardarNube) return mostrarAlerta && alert("⚠️ Acción bloqueada: Cliente no agendado.");
    if (listaItems.length === 0 && !document.getElementById('cliNombre').value) return;
    
    const estado = { cliNombre: document.getElementById('cliNombre').value, cliDireccion: document.getElementById('cliDireccion').value, cliProyecto: document.getElementById('cliProyecto').value, obsGenerales: document.getElementById('obsGenerales').value, items: listaItems, fechaGuardado: Date.now() };
    let docId = (estado.cliNombre || "Borrador").replace(/\s+/g, '_').toLowerCase();
    db.collection("perfiles").doc(uid).collection("materiales").doc(docId).set(estado)
      .then(() => { if (mostrarAlerta) mostrarToast("Guardado", "Sincronizado con la nube."); })
      .catch(e => console.error("Error: ", e));
}

function mostrarAlertaCorp(titulo, mensaje) {
    document.getElementById('modalAlertaTitulo').innerText = titulo;
    document.getElementById('modalAlertaMensaje').innerText = mensaje;
    document.getElementById('modalAlertaCorp').classList.remove('oculto');
}

function cerrarModalAlertaCorp() {
    document.getElementById('modalAlertaCorp').classList.add('oculto');
}

function abrirModalBorradores() {
    const uid = typeof obtenerUid === 'function' ? obtenerUid() : obtenerUidSeguro();
    if (!uid || !db) return;
    
    // CORRECCIÓN 1: Capturar el input correctamente usando document.getElementById
    const inputNombre = document.getElementById('cliNombre');
    const nombre = inputNombre ? inputNombre.value.trim() : '';

    // CORRECCIÓN 2: Validar y mostrar el cartel si está vacío
    if (!nombre) { 
        if (typeof mostrarAlertaCorp === 'function') {
            mostrarAlertaCorp("Falta Cliente", "Ingresá el Nombre del Cliente primero para buscar sus borradores.");
        } else {
            alert("⚠️ Falta Cliente: Ingresá el Nombre del Cliente primero para buscar sus borradores.");
        }
        // if (inputNombre) inputNombre.focus(); <-- ELIMINAR O COMENTAR ESTA LÍNEA
        return; 
    }

    document.getElementById('modalBorradores').classList.remove('oculto');
    const cont = document.getElementById('listaBorradores'); 
    cont.innerHTML = `<div style="text-align:center; padding: 15px;"><i class="fa-solid fa-circle-notch fa-spin" style="color: var(--ngc-neon);"></i> Buscando...</div>`;
    
    // Buscar en la colección de materiales en lugar de presupuestos
    db.collection("perfiles").doc(uid).collection("materiales").where("cliNombre", "==", nombre).get().then((snapshot) => {
          cont.innerHTML = '';
          if (snapshot.empty) { 
              cont.innerHTML = `<p style="text-align:center; color: var(--ngc-text-faded);">No hay borradores en nube.</p>`; 
              return; 
          }
          
          let borradores = []; 
          snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
          
          borradores.forEach((b) => {
              const f = b.data.fechaGuardado ? new Date(b.data.fechaGuardado).toLocaleDateString() : '';
              const nombreBor = b.data.nombreBorrador || b.data.cliNombre;
              const div = document.createElement('div'); 
              div.className = "modal-list-item"; 
              div.style.borderLeft = "3px solid var(--ngc-neon)";
              
              // Se aplica Flexbox estricto con quiebre de palabras para evitar el desborde visual
              div.innerHTML = `
                  <div style="flex: 1; min-width: 0; padding-right: 10px;">
                      <h4 style="word-break: break-word; line-height: 1.2; margin-bottom: 5px;">${nombreBor}</h4>
                      <small style="color: var(--ngc-text-faded);">Última vez: ${f}</small>
                  </div>
                  <div style="display:flex; gap:5px; flex-shrink: 0;">
                      <button class="corp-btn-small" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                      <button class="corp-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button>
                  </div>`;
              cont.appendChild(div);
          });
      });
}


function cargarBorradorNube(docId) {
    const uid = obtenerUid(); if (!uid || !db) return;
    db.collection("perfiles").doc(uid).collection("materiales").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data(); data.clienteDesdeAgenda = true; data.permiteGuardarNube = true;
            localStorage.setItem('materiales_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado(); guardarClienteGlobal(); avanzarPasoTrabajo(); cerrarModalBorradoresGlobal();
            mostrarToast("Abierto", "Datos cargados.");
        }
    });
}
function eliminarBorradorNube(docId, btnElement) {
    const uid = obtenerUid(); if (!uid || !db) return;
    if (confirm("¿Eliminar este borrador de la nube?")) db.collection("perfiles").doc(uid).collection("materiales").doc(docId).delete().then(() => btnElement.closest('.modal-list-item').remove());
}

// ==========================================
// MEMORIA LOCAL Y CARGA DE ITEMS
// ==========================================
function guardarClienteGlobal() { localStorage.setItem('villaser_cliente_global', JSON.stringify({ nombre: document.getElementById('cliNombre').value.trim(), direccion: document.getElementById('cliDireccion').value.trim(), proyecto: document.getElementById('cliProyecto').value.trim() })); guardarEstadoLocal(); }
function guardarEstadoLocal() { localStorage.setItem('materiales_estado_actual', JSON.stringify({ cliNombre: document.getElementById('cliNombre').value, cliDireccion: document.getElementById('cliDireccion').value, cliProyecto: document.getElementById('cliProyecto').value, obsGenerales: document.getElementById('obsGenerales').value, items: listaItems, clienteDesdeAgenda, permiteGuardarNube })); }
function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('materiales_estado_actual') || localStorage.getItem('villaser_cliente_global'); 
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        if (estado.cliNombre || estado.nombre) document.getElementById('cliNombre').value = estado.cliNombre || estado.nombre;
        if (estado.cliDireccion || estado.direccion) document.getElementById('cliDireccion').value = estado.cliDireccion || estado.direccion;
        if (estado.cliProyecto || estado.proyecto) document.getElementById('cliProyecto').value = estado.cliProyecto || estado.proyecto;
        if (estado.obsGenerales) document.getElementById('obsGenerales').value = estado.obsGenerales;
        listaItems = estado.items || [];
        if (estado.clienteDesdeAgenda !== undefined) clienteDesdeAgenda = estado.clienteDesdeAgenda;
        if (estado.permiteGuardarNube !== undefined) permiteGuardarNube = estado.permiteGuardarNube;
    }
}

function ejecutarNuevaLista() {
    cerrarModalConfirmarNuevoGlobal();
    
    document.getElementById('cliNombre').value = ''; 
    document.getElementById('cliDireccion').value = ''; 
    document.getElementById('cliProyecto').value = ''; 
    document.getElementById('obsGenerales').value = '';
    
    listaItems = []; 
    clienteDesdeAgenda = false; 
    permiteGuardarNube = true;
    
    guardarEstadoLocal(); 
    guardarClienteGlobal();
    
    document.getElementById('step-trabajo').classList.add('oculto'); 
    document.getElementById('step-cliente').classList.remove('oculto'); 
    renderTabla();
}

// TOAST GLOBAL CSS MATCH
function mostrarToast(titulo, mensaje) {
    document.getElementById('toastTitle').innerText = titulo; document.getElementById('toastMessage').innerText = mensaje;
    const toast = document.getElementById('toastCliente'); toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 50);
    setTimeout(() => { toast.classList.remove('mostrar'); setTimeout(() => toast.classList.add('oculto'), 400); }, 3000); 
}

function step(id, val) { const el = document.getElementById(id); if(el) el.value = Math.max(el.min ? parseInt(el.min) : 1, (parseInt(el.value || 0) + val)); }

function agregarTrabajo() {
    if(!selConcepto.value) return alert("Selecciona al menos un material.");
    const partes = [selTema.value, selConcepto.value, selNivel3.value, selNivel4.value, selNivel5.value];
    const nombreCompleto = partes.filter(Boolean).join(' | ');
    const qty = document.getElementById('cantidad').value;
    const nota = document.getElementById('obsManual').value.trim();
    const unidad = document.getElementById('tipoUnidad').value; // Extrae del select nuevo
    
    listaItems.push({ id: Date.now(), material: nombreCompleto, cantidad: qty, unidad: unidad, nota: nota });
    guardarEstadoLocal(); renderTabla(); 
    
    document.getElementById('obsManual').value = ""; document.getElementById('cantidad').value = 1; 
    selConcepto.value = ""; llenarSelect(selNivel3, []); llenarSelect(selNivel4, []); llenarSelect(selNivel5, []);
}

function renderTabla() {
    const tbody = document.getElementById('cuerpoTabla'); tbody.innerHTML = ''; 
    listaItems.forEach(i => {
        const div = document.createElement('div');
        div.className = 'modal-list-item'; // Mapeado a global.css
        div.style.cssText = 'border-left: 4px solid var(--ngc-neon); border-radius: 8px;';
        div.innerHTML = `
            <div style="flex:1;">
                <h4>${i.material}</h4>
                <small>${i.nota ? i.nota : 'Sin nota'}</small>
            </div>
            <div style="font-weight:bold; color:var(--ngc-neon); text-align:right; margin-right:10px; font-size:1rem;">
                ${i.cantidad} <span style="font-size:0.75rem;">${i.unidad}</span>
            </div>
            <button class="corp-btn-icon danger" style="width: 38px; height: 38px;" onclick="borrarItem(${i.id})">
                <i class="fa-solid fa-trash"></i>
            </button>`;
        tbody.appendChild(div);
    });
}
function borrarItem(id) { listaItems = listaItems.filter(i => i.id !== id); guardarEstadoLocal(); renderTabla(); }

// ==========================================
// DESCARGAS (WSP, PNG, PDF)
// ==========================================
let telClienteAgendado = null;

// Preparar envío WhatsApp (Materiales)
function prepararEnvioWhatsApp() {
    if(listaItems.length === 0) return alert("Agregá materiales primero.");
    
    // Armar el texto
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    let msg = `*${profNombre.toUpperCase()} - LISTA DE MATERIALES*\nProyecto: ${document.getElementById('cliProyecto').value || '-'}\n\n`; 
    listaItems.forEach(i => { msg += `• ${i.cantidad} ${i.unidad} | ${i.material} ${i.nota ? '('+i.nota+')' : ''}\n`; }); 
    const og = document.getElementById('obsGenerales').value; 
    if(og) msg += `\n*Notas:* ${og}`;

    // Buscar teléfono en Firestore y abrir global.js
    const uid = obtenerUid();
    const cliNombre = document.getElementById('cliNombre').value;
    
    if(uid && db && cliNombre) {
        db.collection("perfiles").doc(uid).collection("contactos").where("nombre", "==", cliNombre).get().then(snap => {
            let tel = null;
            if(!snap.empty) {
                const data = snap.docs[0].data();
                tel = data.tel || data.telefono; 
            }
            abrirModalWspGlobal(tel, msg);
        }).catch(() => abrirModalWspGlobal(null, msg));
    } else {
        abrirModalWspGlobal(null, msg);
    }
}

// ==========================================
// NUEVA LÓGICA DE CAPTURA DE PANTALLA
// ==========================================
let canvasGlobalParaDescarga = null;

async function tomarCaptura() { 
    const zona = document.getElementById('zonaCaptura'); 
    
    // Ocultar temporalmente los íconos de eliminar basurita visual
    document.querySelectorAll('.corp-btn-icon.danger').forEach(b => b.style.visibility = 'hidden'); 
    
    // Ajustar temporalmente el color de fondo para modo oscuro/claro
    zona.style.background = getComputedStyle(document.body).getPropertyValue('--bg-body');
    const scrollY = window.scrollY; window.scrollTo(0, 0);
    
    canvasGlobalParaDescarga = await html2canvas(zona, { backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-body'), scale: 2, useCORS: true, scrollY: 0 }); 
    window.scrollTo(0, scrollY);
    
    // Restaurar íconos y fondo
    document.querySelectorAll('.corp-btn-icon.danger').forEach(b => b.style.visibility = 'visible'); 
    zona.style.background = ''; 
    
    // Calcular el peso simulado de la imagen (KB)
    const dataUrl = canvasGlobalParaDescarga.toDataURL('image/png');
    const pesoKB = Math.round((dataUrl.length * 0.75) / 1024);
    document.getElementById('pesoCaptura').innerText = `(${pesoKB} KB)`;
    
    // Sugerir nombre dinámico
    const inputNombre = document.getElementById('cliNombre');
    const sugerido = inputNombre ? inputNombre.value.split(' ')[0] : 'Cliente';
    document.getElementById('nombreArchivoCaptura').value = `Materiales_${sugerido}`;
    
    // Mostrar modal
    document.getElementById('modalDescargarCaptura').classList.remove('oculto');
}

function cerrarModalCaptura() {
    document.getElementById('modalDescargarCaptura').classList.add('oculto');
}

function ejecutarDescargaCaptura() {
    if (!canvasGlobalParaDescarga) return;
    const nombre = document.getElementById('nombreArchivoCaptura').value.trim() || 'Materiales';
    const link = document.createElement('a'); 
    link.download = `${nombre}.png`; 
    link.href = canvasGlobalParaDescarga.toDataURL('image/png'); 
    link.click(); 
    cerrarModalCaptura();
}

// ==========================================
// LÓGICA DE GENERACIÓN DE PDF CON MODAL (MATERIALES)
// ==========================================
function generarPDF() {
    if(listaItems.length === 0) return alert("No hay materiales para generar el PDF.");
    
    // Sugerimos un nombre para el archivo
    const inputNombre = document.getElementById('cliNombre');
    const sugerido = inputNombre ? inputNombre.value.trim().replace(/ /g, '_') : 'Cliente';
    const uniqueSuffix = Math.floor(Math.random() * 9000) + 1000;
    
    // Pre-llenamos el input del modal
    document.getElementById('nombreArchivoPDF').value = `Materiales_${sugerido}_${uniqueSuffix}`;
    
    // Mostramos el modal
    document.getElementById('modalDescargarPDF').classList.remove('oculto');
}

function cerrarModalPDF() {
    document.getElementById('modalDescargarPDF').classList.add('oculto');
    document.getElementById('btnConfirmarDescargaPDF').innerHTML = "Descargar";
}

async function ejecutarDescargaPDF() {
    const btn = document.getElementById('btnConfirmarDescargaPDF');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando...';
    
    if(permiteGuardarNube) guardarBorradorFirebase(false);
    
    // Preparar los datos visuales del PDF
    document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    document.getElementById('pdf-cliente').innerText = document.getElementById('cliNombre').value || 'Sin nombre';
    document.getElementById('pdf-direccion').innerText = document.getElementById('cliDireccion').value || 'Sin dirección';
    document.getElementById('pdf-proyecto').innerText = document.getElementById('cliProyecto').value || '-';
    
    const tbody = document.getElementById('pdf-tbody'); 
    tbody.innerHTML = '';
    
    listaItems.forEach(i => { 
        tbody.appendChild(Object.assign(document.createElement('tr'), { innerHTML: `<td>${i.material}</td><td>${i.nota}</td><td>${i.cantidad}</td><td>${i.unidad}</td>` })); 
    });
    
    document.getElementById('pdf-notas').innerText = document.getElementById('obsGenerales').value || 'Sin notas.';
    
    const element = document.getElementById('plantilla-pdf'); 
    element.style.display = 'block'; 
    window.scrollTo(0, 0);
    
    const nombreFinal = document.getElementById('nombreArchivoPDF').value.trim() || 'Materiales';

    const opt = { 
        margin: 0, 
        filename: `${nombreFinal}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, scrollY: 0 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    try { 
        await html2pdf().set(opt).from(element).save();
        cerrarModalPDF();
    } 
    catch (e) { 
        alert("Error al generar PDF."); 
        btn.innerHTML = "Descargar";
    } 
    finally { 
        element.style.display = 'none'; 
    }
}

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '#', active: true },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Costos', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
        { nombre: 'Proveedores', icon: 'fa-solid fa-truck-fast', url: '../proveedores/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});
   

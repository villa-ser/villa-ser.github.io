let db = null;
const SHEET_ID = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
const URL_PRECIOS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbPrecios = [];
let listaItems = [];
let notasOriginales = "";
let nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;

let conceptoEditado = null;
let precioEditado = null;
let contactosAgenda = []; 
let totalMontoActual = 0; 

// Controles de Nube
let clienteDesdeAgenda = false;
let permiteGuardarNube = true;
let uidSeguro = null;

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');

// ==========================================
// INICIALIZACIÓN (MOTOR ULTRA BLINDADO)
// ==========================================
function arrancarModulo() {
    // 1. Intento seguro de Firebase (Si falla, se omite y la app sigue funcionando)
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            db = firebase.firestore();
            if (typeof firebase.auth === 'function') {
                firebase.auth().onAuthStateChanged(user => {
                    if (user) uidSeguro = user.uid;
                });
            }
        }
    } catch (e) {
        console.warn("Aviso: Firebase no pudo iniciar, funcionando en modo local.", e);
    }

    // 2. Intento seguro de Memoria (Si hay un archivo roto, lo resetea sin trabarse)
    try {
        inicializarClienteMemoria();
    } catch (e) {
        console.warn("Aviso: Memoria local reseteada por datos corruptos.");
        localStorage.removeItem('presupuesto_estado_actual');
    }

    // 3. Descarga de Google Sheets obligatoria
    fetchData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarModulo);
} else {
    arrancarModulo();
}

// ==========================================
// DESCARGA Y RENDERIZADO
// ==========================================
function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    if (typeof currentUserUid !== 'undefined' && currentUserUid) return currentUserUid;
    if (typeof window.currentUserUid !== 'undefined' && window.currentUserUid) return window.currentUserUid;
    return null;
}

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
        
        poblarTemas();
        setupEventListeners();
        
        document.getElementById('loading').classList.add('oculto'); 
        document.getElementById('app').classList.remove('oculto');

        if (listaItems.length > 0) avanzarPasoTrabajo();
    } catch (e) { 
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `⚠️ Error al leer los precios de Google Sheets.<br><br><button class="ngc-btn" onclick="location.reload()">Reintentar</button>`;
        }
        console.error(e);
    }
}

function setupEventListeners() {
    if (selTema) selTema.addEventListener('change', cambioTema);
    if (selConcepto) selConcepto.addEventListener('change', cargarDetallePrecios);
}

// ==========================================
// INTEGRACIÓN AGENDA (FIREBASE)
// ==========================================
function marcarClienteManual() {
    clienteDesdeAgenda = false;
    permiteGuardarNube = true; 
}

function abrirModalAgenda() {
    const uid = obtenerUid();
    if (!uid || !db) {
        alert("⚠️ No hay sesión detectada o falta inicializar Firebase en este módulo html.");
        return;
    }

    document.getElementById('modalAgenda').classList.remove('oculto');
    document.getElementById('buscadorAgenda').value = "";
    
    db.collection("perfiles").doc(uid).collection("contactos")
      .orderBy("nombre").get()
      .then((snapshot) => {
          contactosAgenda = [];
          snapshot.forEach((doc) => { contactosAgenda.push(doc.data()); });
          filtrarAgenda();
      })
      .catch((error) => {
          document.getElementById('listaAgenda').innerHTML = "<p style='color:var(--error-red); text-align:center;'>Error al cargar contactos.</p>";
      });
}

function cerrarModalAgenda() { document.getElementById('modalAgenda').classList.add('oculto'); }

function filtrarAgenda() {
    const texto = document.getElementById('buscadorAgenda').value.toLowerCase();
    const contenedor = document.getElementById('listaAgenda');
    contenedor.innerHTML = '';
    
    const filtrados = contactosAgenda.filter(c => 
        (c.nombre || '').toLowerCase().includes(texto) ||
        (c.dir || '').toLowerCase().includes(texto) ||
        (c.tel || '').toLowerCase().includes(texto)
    );
    
    if (filtrados.length === 0) {
        contenedor.innerHTML = "<p style='color:var(--ngc-text-faded); text-align:center;'>No se encontraron contactos.</p>";
        return;
    }
    
    filtrados.forEach(c => {
        const div = document.createElement('div');
        div.style.cssText = "background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
        div.innerHTML = `
            <div>
                <h4 style="margin: 0; font-size: 0.95rem; color: var(--ngc-text-main);">${c.nombre}</h4>
                <small style="color: var(--ngc-text-faded);"><i class="fa-solid fa-location-dot"></i> ${c.dir || 'Sin dirección'}</small>
            </div>
            <button class="ngc-btn-small" style="color: var(--ngc-neon); border-color: var(--ngc-neon); background: transparent;" onclick="seleccionarContacto('${c.nombre.replace(/'/g, "\\'")}', '${(c.dir || '').replace(/'/g, "\\'")}')">Usar</button>
        `;
        contenedor.appendChild(div);
    });
}

function seleccionarContacto(nombre, dir) {
    document.getElementById('cliNombre').value = nombre;
    document.getElementById('cliDireccion').value = dir;
    clienteDesdeAgenda = true;
    permiteGuardarNube = true; 
    guardarClienteGlobal();
    cerrarModalAgenda();
    mostrarToast("Cliente Seleccionado", "Datos de agenda importados.");
}

// ==========================================
// CONTROL DE FLUJO
// ==========================================
function iniciarPresupuesto() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) {
        alert("Por favor, ingresá al menos el Nombre del Cliente.");
        document.getElementById('cliNombre').focus();
        return;
    }
    if (!clienteDesdeAgenda) {
        document.getElementById('modalAgendarCliente').classList.remove('oculto');
        return; 
    }
    avanzarPasoTrabajo();
}

function opcionBuscarAgenda() {
    document.getElementById('modalAgendarCliente').classList.add('oculto');
    abrirModalAgenda();
}

function opcionContinuarSinAgenda() {
    if (confirm("⚠️ AVISO: Al no estar en tu agenda, este presupuesto NO podrá guardarse en la nube (solo podrás descargar el PDF o Imagen).\n\n¿Estás seguro de continuar?")) {
        permiteGuardarNube = false; 
        document.getElementById('modalAgendarCliente').classList.add('oculto');
        avanzarPasoTrabajo();
    }
}

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    guardarClienteGlobal();
    renderTabla();
}

// ==========================================
// NUBE (FIREBASE)
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false) {
    const uid = obtenerUid();
    if (!uid || !db) {
        if (mostrarAlerta) alert("⚠️ Sesión no detectada para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) alert("⚠️ Acción bloqueada: Este presupuesto pertenece a un cliente no agendado.");
        return;
    }
    if (listaItems.length === 0 && !document.getElementById('cliNombre').value) return;
    
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        nro: nroPresupuestoGlobal,
        totalMonto: totalMontoActual,
        fechaGuardado: Date.now()
    };
    
    let docId = (estado.cliNombre || "Borrador").replace(/\s+/g, '_').toLowerCase();
    db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).set(estado)
      .then(() => { if (mostrarAlerta) mostrarToast("Borrador Guardado", "Sincronizado con tu cuenta."); })
      .catch((error) => console.error("Error guardando en la nube: ", error));
}

function abrirModalBorradores() {
    const uid = obtenerUid();
    if (!uid || !db) {
        alert("⚠️ Sesión no detectada.");
        return;
    }
    const nombreClienteActual = document.getElementById('cliNombre').value.trim();
    if (!nombreClienteActual) {
        alert("⚠️ Primero ingresá el Nombre del Cliente para buscar sus borradores.");
        document.getElementById('cliNombre').focus();
        return;
    }

    const modal = document.getElementById('modalBorradores');
    modal.classList.remove('oculto');
    const contenedor = document.getElementById('listaBorradores');
    contenedor.innerHTML = `<div style="text-align: center; color: #e91e63;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando borradores...</div>`;
    
    db.collection("perfiles").doc(uid).collection("presupuestos")
      .where("cliNombre", "==", nombreClienteActual).get()
      .then((snapshot) => {
          contenedor.innerHTML = '';
          if (snapshot.empty) {
              contenedor.innerHTML = `<p style='color:var(--ngc-text-faded); text-align:center;'>No hay borradores guardados.</p>`;
              return;
          }
          let borradores = [];
          snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
          
          borradores.forEach((b) => {
              let p = b.data;
              const fechaStr = p.fechaGuardado ? new Date(p.fechaGuardado).toLocaleDateString() : 'Sin fecha';
              const div = document.createElement('div');
              div.style.cssText = "background: var(--ngc-bg-input); border-left: 3px solid #e91e63; padding: 12px; margin-bottom: 10px;";
              div.innerHTML = `
                  <div style="display: flex; justify-content: space-between;">
                      <strong style="color: var(--ngc-text-main);">${p.cliNombre || 'Sin Nombre'}</strong>
                      <span style="color: var(--success-green);">$${(p.totalMonto || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div style="color: var(--ngc-text-faded); font-size: 0.75rem; margin-bottom: 10px;">Última vez: ${fechaStr}</div>
                  <div style="display: flex; gap: 8px;">
                      <button class="ngc-btn-small" style="flex:1;" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                      <button class="ngc-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button>
                  </div>
              `;
              contenedor.appendChild(div);
          });
      });
}

function cerrarModalBorradores() { document.getElementById('modalBorradores').classList.add('oculto'); }

function cargarBorradorNube(docId) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            data.clienteDesdeAgenda = true;
            data.permiteGuardarNube = true;
            localStorage.setItem('presupuesto_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado();
            guardarClienteGlobal();
            avanzarPasoTrabajo();
            cerrarModalBorradores();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    });
}

function eliminarBorradorNube(docId, btnElement) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    if (confirm("¿Eliminar este borrador de la nube?")) {
        db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).delete().then(() => {
            btnElement.closest('div').parentElement.remove();
        });
    }
}

// ==========================================
// MEMORIA LOCAL Y TOAST
// ==========================================
function inicializarClienteMemoria() { cargarEstadoGuardado(); }

function guardarClienteGlobal() {
    const clienteObj = {
        nombre: document.getElementById('cliNombre').value.trim(),
        direccion: document.getElementById('cliDireccion').value.trim(),
        proyecto: document.getElementById('cliProyecto').value.trim()
    };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clienteObj));
    guardarEstadoLocal(); 
}

function guardarEstadoLocal() {
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        nro: nroPresupuestoGlobal,
        clienteDesdeAgenda: clienteDesdeAgenda,
        permiteGuardarNube: permiteGuardarNube
    };
    localStorage.setItem('presupuesto_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('presupuesto_estado_actual');
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        if (estado.cliNombre) document.getElementById('cliNombre').value = estado.cliNombre;
        if (estado.cliDireccion) document.getElementById('cliDireccion').value = estado.cliDireccion;
        if (estado.cliProyecto) document.getElementById('cliProyecto').value = estado.cliProyecto;
        if (estado.obsGenerales) document.getElementById('obsGenerales').value = estado.obsGenerales;
        listaItems = estado.items || [];
        if (estado.nro) nroPresupuestoGlobal = estado.nro;
        if (estado.clienteDesdeAgenda !== undefined) clienteDesdeAgenda = estado.clienteDesdeAgenda;
        if (estado.permiteGuardarNube !== undefined) permiteGuardarNube = estado.permiteGuardarNube;
    }
}

function nuevoPresupuesto() {
    if(confirm("¿Iniciar nuevo presupuesto?")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliDireccion').value = '';
        document.getElementById('cliProyecto').value = '';
        document.getElementById('obsGenerales').value = '';
        listaItems = [];
        nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;
        clienteDesdeAgenda = false;
        permiteGuardarNube = true;
        guardarEstadoLocal();
        guardarClienteGlobal();
        document.getElementById('step-trabajo').classList.add('oculto');
        document.getElementById('step-cliente').classList.remove('oculto');
        renderTabla();
    }
}

function mostrarToast(titulo, mensaje) {
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');
    const toast = document.getElementById('toastCliente');
    if (!titleEl || !msgEl || !toast) return;
    titleEl.innerText = titulo; msgEl.innerText = mensaje;
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 100);
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }, 4000); 
}

// ==========================================
// ÍTEMS Y CÁLCULOS
// ==========================================
function step(id, val) { 
    const el = document.getElementById(id); if(!el) return;
    let newValue = parseInt(el.value || 0) + val;
    el.value = Math.max(el.min ? parseInt(el.min) : 0, newValue); 
}

function poblarTemas() { 
    if(!selTema) return;
    selTema.innerHTML = '<option value="">-- SELECCIONE RUBRO --</option>';
    [...new Set(dbPrecios.map(i => i.tema))].sort().forEach(t => { 
        const opt = document.createElement('option'); opt.value = t; opt.textContent = t; selTema.appendChild(opt);
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
            const opt = document.createElement('option'); opt.value = i.concepto; opt.textContent = i.concepto; selConcepto.appendChild(opt);
        }); 
    } else { selConcepto.disabled = true; }
}

function limpiarEdicionesTemporales() {
    conceptoEditado = null; precioEditado = null;
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
        inputObs.value = item.notas; notasOriginales = item.notas; inputObs.readOnly = true; 
        document.getElementById('btnEditConcepto').style.display = 'inline-block';
        document.getElementById('btnEditPrecio').style.display = 'inline-block';
    } else {
        document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00"; inputObs.value = "";
    }
}

function editarConceptoTemporal() {
    const itemActual = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if (!itemActual) return;
    const valorBase = conceptoEditado !== null ? conceptoEditado : itemActual.concepto;
    const nuevoTexto = prompt("Editar nombre:", valorBase);
    if (nuevoTexto !== null && nuevoTexto.trim() !== "") {
        conceptoEditado = nuevoTexto.trim(); document.getElementById('badgeConcepto').style.display = 'block';
    }
}

function editarPrecioTemporal() {
    const itemActual = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if (!itemActual) return;
    const valorBase = precioEditado !== null ? precioEditado : itemActual.precio;
    const nuevoPrecioStr = prompt("Editar precio:", valorBase);
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
    if(!itemOriginal) { alert("Seleccione un trabajo."); return; }
    
    const finalConcepto = conceptoEditado !== null ? conceptoEditado : itemOriginal.concepto;
    const finalPrecio = precioEditado !== null ? precioEditado : itemOriginal.precio;
    const qty = parseInt(document.getElementById('cantidad').value) || 1;
    const desc = parseInt(document.getElementById('porcentajeDesc').value) || 0;
    const finalTotal = (finalPrecio * qty) * (1 - desc / 100);
          
    listaItems.push({ id: Date.now(), concepto: finalConcepto, obs: document.getElementById('obsManual').value, qty, total: finalTotal, unitario: finalPrecio, desc });
    guardarEstadoLocal(); renderTabla(); 
    
    document.getElementById('obsManual').value = ""; document.getElementById('cantidad').value = 1; document.getElementById('porcentajeDesc').value = 0;
    selConcepto.value = ""; limpiarEdicionesTemporales(); document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
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
    
    totalMontoActual = total;
    document.getElementById('totalDisplay').innerText = `TOTAL: $ ${total.toLocaleString('es-AR')}`;
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) { listaItems = listaItems.filter(i => i.id !== id); guardarEstadoLocal(); renderTabla(); }

function actualizarPDFHeaders() {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';
    const profEmail = localStorage.getItem('villaser_conf_email') || ''; 

    document.getElementById('headerMembrete').innerText = profNombre.toUpperCase();
    document.getElementById('pdf-slogan').innerText = profSlogan;
    document.getElementById('pdf-tel').innerText = profTel ? `📞 ${profTel}` : '';
    document.getElementById('pdf-email').innerText = profEmail ? `✉️ ${profEmail}` : '';

    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (profLogo && profLogo.startsWith('data:image')) {
        imgPdf.src = profLogo; imgPdf.style.display = 'block'; txtPdf.style.display = 'none';
    } else {
        imgPdf.style.display = 'none'; txtPdf.innerText = profNombre.toUpperCase(); txtPdf.style.display = 'block';
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
// EXPORTACIÓN, PDF Y CAPTURA
// ==========================================
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

    if(permiteGuardarNube) { guardarBorradorFirebase(false); }

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
        if(permiteGuardarNube) mostrarToast("Generado con Éxito", "PDF guardado y borrador respaldado.");
    } catch (error) { 
        alert("Error al generar el PDF."); 
    } 
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

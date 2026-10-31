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
let nombreBorradorActual = null; // Memoria del archivo abierto (Guardar Como...)
let telefonoClienteActual = "";

// Controles de Nube (Flujo Cliente Agendado)
let clienteDesdeAgenda = false;
let permiteGuardarNube = true;
let uidSeguro = null;

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');
const inputCliNombre = document.getElementById('cliNombre');

// ==========================================
// INICIALIZACIÓN
// ==========================================
function arrancarModulo() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            db = firebase.firestore();
            if (typeof firebase.auth === 'function') {
                firebase.auth().onAuthStateChanged(user => { if (user) uidSeguro = user.uid; });
            }
        }
    } catch (e) { console.warn("Firebase no inició, modo local.", e); }

    try { inicializarClienteMemoria(); } 
    catch (e) { localStorage.removeItem('presupuesto_estado_actual'); }

    fetchData();
    generarMenuInferior(); 
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', arrancarModulo); } 
else { arrancarModulo(); }

function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) { return firebase.auth().currentUser.uid; }
    if (typeof currentUserUid !== 'undefined' && currentUserUid) return currentUserUid;
    return null;
}

// ==========================================
// DESCARGA GOOGLE SHEETS
// ==========================================
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
        document.getElementById('loading').innerHTML = `⚠️ Error de conexión a la base de datos.<br><br><button class="corp-btn" onclick="location.reload()">Reintentar</button>`;
        console.error(e);
    }
}

function setupEventListeners() {
    if (selTema) selTema.addEventListener('change', cambioTema);
    if (selConcepto) selConcepto.addEventListener('change', cargarDetallePrecios);
    if (inputCliNombre) {
        inputCliNombre.addEventListener('input', () => {
            clienteDesdeAgenda = false; 
            permiteGuardarNube = false; 
        });
    }
}

// ==========================================
// NUEVOS MODALES DE ALERTA Y CONFIRMACIÓN
// ==========================================
function mostrarAlertaCorp(titulo, mensaje) {
    document.getElementById('modalAlertaTitulo').innerText = titulo;
    document.getElementById('modalAlertaMensaje').innerText = mensaje;
    document.getElementById('modalAlertaCorp').classList.remove('oculto');
}

function cerrarModalAlertaCorp() {
    document.getElementById('modalAlertaCorp').classList.add('oculto');
}
function filtrarAgenda() {
    const texto = document.getElementById('buscadorAgenda').value.toLowerCase();
    const contenedor = document.getElementById('listaAgenda'); contenedor.innerHTML = '';
    const filtrados = contactosAgenda.filter(c => (c.nombre || '').toLowerCase().includes(texto) || (c.dir || '').toLowerCase().includes(texto) || (c.telefono || '').includes(texto));
    
    if (filtrados.length === 0) { contenedor.innerHTML = "<p style='color:var(--ngc-text-faded);'>Sin resultados.</p>"; return; }
    
    filtrados.forEach(c => {
        const div = document.createElement('div'); div.className = "modal-list-item";
        div.innerHTML = `<div><h4>${c.nombre}</h4><small>${c.dir || 'Sin dirección'}</small></div>
            <button class="corp-btn-small" onclick="seleccionarContacto('${c.nombre.replace(/'/g, "\\'")}', '${(c.dir || '').replace(/'/g, "\\'")}', '${(c.telefono || '').replace(/'/g, "\\'")}')">Usar</button>`;
        contenedor.appendChild(div);
    });
}

function seleccionarContacto(nombre, dir, tel = "") {
    inputCliNombre.value = nombre; document.getElementById('cliDireccion').value = dir;
    telefonoClienteActual = tel; 
    clienteDesdeAgenda = true; permiteGuardarNube = true; 
    guardarEstadoLocal(); cerrarModalAgenda(); mostrarToast("Cliente Seleccionado", "Importado de agenda.");
}

function guardarEstadoLocal() {
    localStorage.setItem('presupuesto_estado_actual', JSON.stringify({ 
        cliNombre: inputCliNombre.value, 
        cliDireccion: document.getElementById('cliDireccion').value, 
        cliProyecto: document.getElementById('cliProyecto').value, 
        obsGenerales: document.getElementById('obsGenerales').value, 
        items: listaItems, nro: nroPresupuestoGlobal, clienteDesdeAgenda: clienteDesdeAgenda, 
        permiteGuardarNube: permiteGuardarNube, nombreBorradorActual: nombreBorradorActual,
        telefonoClienteActual: telefonoClienteActual
    }));
}

function cargarEstadoGuardado() {
    const str = localStorage.getItem('presupuesto_estado_actual');
    if (str) {
        const est = JSON.parse(str);
        if (est.cliNombre) inputCliNombre.value = est.cliNombre;
        if (est.cliDireccion) document.getElementById('cliDireccion').value = est.cliDireccion;
        if (est.cliProyecto) document.getElementById('cliProyecto').value = est.cliProyecto;
        if (est.obsGenerales) document.getElementById('obsGenerales').value = est.obsGenerales;
        listaItems = est.items || [];
        if (est.nro) nroPresupuestoGlobal = est.nro;
        if (est.clienteDesdeAgenda !== undefined) clienteDesdeAgenda = est.clienteDesdeAgenda;
        if (est.permiteGuardarNube !== undefined) permiteGuardarNube = est.permiteGuardarNube;
        if (est.nombreBorradorActual !== undefined) nombreBorradorActual = est.nombreBorradorActual;
        if (est.telefonoClienteActual !== undefined) telefonoClienteActual = est.telefonoClienteActual;
    }
}

// ==========================================
// INTEGRACIÓN AGENDA Y FLUJO
// ==========================================
function iniciarPresupuesto() {
    const nombre = inputCliNombre.value.trim();
    if(!nombre) { 
        mostrarAlertaCorp("Datos incompletos", "Por favor, ingresá al menos el Nombre del Cliente."); 
        inputCliNombre.focus(); 
        return; 
    }
    if (!clienteDesdeAgenda) { 
        document.getElementById('modalAgendarCliente').classList.remove('oculto'); 
        return; 
    }
    avanzarPasoTrabajo();
}

function accionAgendarCliente() {
    const nombre = encodeURIComponent(inputCliNombre.value.trim());
    const dir = encodeURIComponent(document.getElementById('cliDireccion').value.trim());
    window.location.href = `../agenda/index.html?nombre=${nombre}&dir=${dir}`;
}

function opcionBuscarAgenda() { 
    document.getElementById('modalAgendarCliente').classList.add('oculto'); 
    abrirModalAgenda(); 
}

function opcionContinuarSinAgenda() {
    document.getElementById('modalAgendarCliente').classList.add('oculto');
    document.getElementById('modalConfirmarSinAgenda').classList.remove('oculto');
}

function cerrarModalConfirmarSinAgenda() {
    document.getElementById('modalConfirmarSinAgenda').classList.add('oculto');
}

function ejecutarContinuarSinAgenda() {
    cerrarModalConfirmarSinAgenda();
    permiteGuardarNube = false;
    avanzarPasoTrabajo();
}

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    guardarClienteGlobal(); 
    renderTabla();
}

function abrirModalAgenda() {
    const uid = obtenerUid();
    if (!uid || !db) { 
        mostrarAlertaCorp("Error", "Sin sesión detectada."); 
        return; 
    }
    document.getElementById('modalAgenda').classList.remove('oculto');
    document.getElementById('buscadorAgenda').value = "";
    
    db.collection("perfiles").doc(uid).collection("contactos").orderBy("nombre").get().then((snapshot) => {
          contactosAgenda = [];
          snapshot.forEach((doc) => { contactosAgenda.push(doc.data()); });
          filtrarAgenda();
    }).catch(() => { document.getElementById('listaAgenda').innerHTML = "<p style='color:var(--error-red);'>Error.</p>"; });
}

function cerrarModalAgenda() { document.getElementById('modalAgenda').classList.add('oculto'); }

// ==========================================
// BORRADORES NUBE (Guardar Como... UI)
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
    const uid = obtenerUid();
    if (!uid || !db) {
        if (mostrarAlerta) mostrarAlertaCorp("Error de Sesión", "No se detectó sesión activa para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) mostrarAlertaCorp("Acción Bloqueada", "Este presupuesto pertenece a un cliente no agendado. No puede guardarse en la nube.");
        return;
    }
    if (listaItems.length === 0 && !inputCliNombre.value) return;

    // Generar nombre sugerido: Cliente_Proyecto_Fecha
    const nombreCli = (inputCliNombre.value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliProyecto').value.trim() || 'Presupuesto').replace(/\s+/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    let nombreSugerido = `${nombreCli}_${proyCli}_${fechaHoy}`;

    if (!autoGuardado) {
        // Guardado Manual: Abrir Modal en lugar de prompt()
        document.getElementById('inputNombreBorrador').value = nombreBorradorActual || nombreSugerido;
        document.getElementById('modalGuardarBorrador').classList.remove('oculto');
    } else {
        // Autoguardado: Directo a Firebase sin preguntar
        ejecutarGuardarNube(nombreBorradorActual || nombreSugerido, false);
    }
}

function cerrarModalGuardarBorrador() {
    document.getElementById('modalGuardarBorrador').classList.add('oculto');
}

function ejecutarGuardarBorrador() {
    const nombreIngresado = document.getElementById('inputNombreBorrador').value.trim();
    if (!nombreIngresado) {
        mostrarAlertaCorp("Faltan Datos", "Debes ingresar un nombre para el borrador.");
        return;
    }
    nombreBorradorActual = nombreIngresado;
    cerrarModalGuardarBorrador();
    ejecutarGuardarNube(nombreBorradorActual, true);
}

function ejecutarGuardarNube(nombreFinal, mostrarAlerta) {
    const uid = obtenerUid();
    const estado = { cliNombre: inputCliNombre.value, cliDireccion: document.getElementById('cliDireccion').value, cliProyecto: document.getElementById('cliProyecto').value, obsGenerales: document.getElementById('obsGenerales').value, items: listaItems, nro: nroPresupuestoGlobal, totalMonto: totalMontoActual, fechaGuardado: Date.now(), nombreBorrador: nombreFinal };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).set(estado)
      .then(() => { if (mostrarAlerta) mostrarToast("Borrador Guardado", "Sincronizado con tu cuenta."); })
      .catch((e) => console.error("Error guardando en la nube: ", e));
}

function abrirModalBorradores() {
    const uid = obtenerUid();
    if (!uid || !db) return;
    const nombre = inputCliNombre.value.trim();
    if (!nombre) { 
        mostrarAlertaCorp("Falta Cliente", "Ingresá el Nombre del Cliente primero para buscar sus borradores."); 
        inputCliNombre.focus(); 
        return; 
    }

    document.getElementById('modalBorradores').classList.remove('oculto');
    const cont = document.getElementById('listaBorradores'); 
    cont.innerHTML = `<div style="text-align:center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...</div>`;
    
    db.collection("perfiles").doc(uid).collection("presupuestos").where("cliNombre", "==", nombre).get().then((snapshot) => {
          cont.innerHTML = '';
          if (snapshot.empty) { cont.innerHTML = `<p style="text-align:center;">No hay borradores en nube.</p>`; return; }
          let borradores = []; snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
          
          borradores.forEach((b) => {
              const f = b.data.fechaGuardado ? new Date(b.data.fechaGuardado).toLocaleDateString() : '';
              const nombreBor = b.data.nombreBorrador || b.data.cliNombre;
              const div = document.createElement('div'); div.className = "modal-list-item"; div.style.borderLeft = "3px solid var(--ngc-neon)";
              div.innerHTML = `<div><h4>${nombreBor}</h4><small>$${(b.data.totalMonto || 0).toLocaleString()} | ${f}</small></div>
                  <div style="display:flex; gap:5px;"><button class="corp-btn-small" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                  <button class="corp-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button></div>`;
              cont.appendChild(div);
          });
      });
}

function cerrarModalBorradores() { document.getElementById('modalBorradores').classList.add('oculto'); }

function cargarBorradorNube(docId) {
    const uid = obtenerUid(); if (!uid || !db) return;
    db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data(); 
            data.clienteDesdeAgenda = true; 
            data.permiteGuardarNube = true;
            nombreBorradorActual = data.nombreBorrador || docId; // Recuperar el nombre del archivo
            localStorage.setItem('presupuesto_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado(); guardarClienteGlobal(); avanzarPasoTrabajo(); cerrarModalBorradores();
        }
    });
}
function eliminarBorradorNube(docId, btn) {
    const uid = obtenerUid(); if (!uid || !db) return;
    // La única excepción temporal será la confirmación de borrado
    if (confirm("¿Eliminar borrador en nube?")) { db.collection("perfiles").doc(uid).collection("presupuestos").doc(docId).delete().then(() => { btn.closest('div.modal-list-item').remove(); }); }
        }
  // ==========================================
// MEMORIA LOCAL Y UI
// ==========================================
function inicializarClienteMemoria() { cargarEstadoGuardado(); }

function guardarClienteGlobal() {
    const obj = { 
        nombre: inputCliNombre.value.trim(), 
        direccion: document.getElementById('cliDireccion').value.trim(), 
        proyecto: document.getElementById('cliProyecto').value.trim() 
    };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(obj)); 
    guardarEstadoLocal(); 
}

// ==========================================
// NUEVO PRESUPUESTO (MODAL CORPORATIVO)
// ==========================================
function nuevoPresupuesto() {
    document.getElementById('modalConfirmarNuevo').classList.remove('oculto');
}

function cerrarModalConfirmarNuevo() {
    document.getElementById('modalConfirmarNuevo').classList.add('oculto');
}

function ejecutarNuevoPresupuesto() {
    cerrarModalConfirmarNuevo();
    
    inputCliNombre.value = ''; 
    document.getElementById('cliDireccion').value = ''; 
    document.getElementById('cliProyecto').value = ''; 
    document.getElementById('obsGenerales').value = '';
    
    listaItems = []; 
    nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;
    clienteDesdeAgenda = false; 
    permiteGuardarNube = true;
    nombreBorradorActual = null;
    
    guardarEstadoLocal(); 
    document.getElementById('step-trabajo').classList.add('oculto'); 
    document.getElementById('step-cliente').classList.remove('oculto');
    
    const modalRecuperar = document.getElementById('modalRecuperarCliente');
    if(modalRecuperar) modalRecuperar.classList.add('oculto'); 
    
    renderTabla();
}

function mostrarToast(titulo, mensaje) {
    document.getElementById('toastTitle').innerText = titulo; 
    document.getElementById('toastMessage').innerText = mensaje;
    const toast = document.getElementById('toastCliente'); 
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 100); 
    setTimeout(() => { 
        toast.classList.remove('mostrar'); 
        setTimeout(() => toast.classList.add('oculto'), 400); 
    }, 4000); 
}

// ==========================================
// CÁLCULOS E ÍTEMS
// ==========================================
function step(id, val) { 
    const el = document.getElementById(id); if(!el) return;
    el.value = Math.max(el.min ? parseInt(el.min) : 0, parseInt(el.value || 0) + val); 
}

function poblarTemas() { 
    if(!selTema) return; selTema.innerHTML = '<option value="">-- SELECCIONE RUBRO --</option>';
    [...new Set(dbPrecios.map(i => i.tema))].sort().forEach(t => { 
        const opt = document.createElement('option'); opt.value = t; opt.textContent = t; selTema.appendChild(opt); 
    }); 
}

function cambioTema() { 
    const t = selTema.value; selConcepto.innerHTML = '<option value="">-- SELECCIONE TRABAJO --</option>';
    limpiarEdicionesTemporales(); 
    document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00"; 
    document.getElementById('obsManual').value = "";
    
    if(t) { 
        selConcepto.disabled = false; 
        dbPrecios.filter(i => i.tema === t).forEach(i => { 
            const opt = document.createElement('option'); opt.value = i.concepto; opt.textContent = i.concepto; selConcepto.appendChild(opt); 
        }); 
    } else { 
        selConcepto.disabled = true; 
    }
}

function limpiarEdicionesTemporales() {
    conceptoEditado = null; precioEditado = null;
    document.getElementById('badgeConcepto').classList.add('oculto'); 
    document.getElementById('badgePrecio').classList.add('oculto');
    document.getElementById('btnEditConcepto').classList.add('oculto'); 
    document.getElementById('btnEditPrecio').classList.add('oculto');
}

function cargarDetallePrecios() { 
    const item = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value); 
    const obs = document.getElementById('obsManual'); limpiarEdicionesTemporales();
    
    if(item) { 
        document.getElementById('unitarioLabel').innerText = `Unit: $ ${item.precio.toLocaleString('es-AR')}`; 
        obs.value = item.notas; 
        notasOriginales = item.notas; 
        obs.readOnly = true; 
        document.getElementById('btnEditConcepto').classList.remove('oculto'); 
        document.getElementById('btnEditPrecio').classList.remove('oculto');
    } else { 
        document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00"; obs.value = ""; 
    }
}

// ==========================================
// EDICIÓN TEMPORAL CON MODAL CORPORATIVO
// ==========================================
let tipoEdicionActual = null; 

function abrirModalEdicion(tipo, valorActual) {
    tipoEdicionActual = tipo;
    const titulo = tipo === 'concepto' ? 'Editar nombre:' : 'Editar precio:';
    document.getElementById('modalEdicionTitulo').innerText = titulo;
    
    const input = document.getElementById('modalEdicionInput');
    input.type = tipo === 'precio' ? 'number' : 'text';
    input.value = valorActual;
    
    document.getElementById('modalEdicionPersonalizada').classList.remove('oculto');
    setTimeout(() => input.focus(), 100);
}

function cerrarModalEdicion() {
    document.getElementById('modalEdicionPersonalizada').classList.add('oculto');
}

function guardarModalEdicion() {
    const valor = document.getElementById('modalEdicionInput').value;
    
    if (tipoEdicionActual === 'concepto') {
        if (valor && valor.trim() !== "") {
            conceptoEditado = valor.trim();
            document.getElementById('badgeConcepto').classList.remove('oculto');
        }
    } else if (tipoEdicionActual === 'precio') {
        if (valor) {
            const num = parseFloat(valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
            if (!isNaN(num)) {
                precioEditado = num;
                document.getElementById('unitarioLabel').innerText = `Unit: $ ${num.toLocaleString('es-AR')}`;
                document.getElementById('badgePrecio').classList.remove('oculto');
            }
        }
    }
    cerrarModalEdicion();
}

function editarConceptoTemporal() {
    const item = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value); 
    if (!item) return;
    abrirModalEdicion('concepto', conceptoEditado || item.concepto);
}

function editarPrecioTemporal() {
    const item = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value); 
    if (!item) return;
    abrirModalEdicion('precio', precioEditado !== null ? precioEditado : item.precio);
}

function habilitarEdicionObs() { document.getElementById('obsManual').readOnly = false; document.getElementById('obsManual').focus(); }
function volverNotasOriginales() { document.getElementById('obsManual').value = notasOriginales; document.getElementById('obsManual').readOnly = true; }
function borrarTodasNotas() { document.getElementById('obsManual').value = ""; }

function agregarTrabajo() {
    const itemOriginal = dbPrecios.find(i => i.tema === selTema.value && i.concepto === selConcepto.value);
    if(!itemOriginal) { 
        mostrarAlertaCorp("Atención", "Seleccione un trabajo primero."); 
        return; 
    }
    
    const qty = parseInt(document.getElementById('cantidad').value) || 1;
    const desc = parseInt(document.getElementById('porcentajeDesc').value) || 0;
    const fPrecio = precioEditado !== null ? precioEditado : itemOriginal.precio;
    const fTotal = (fPrecio * qty) * (1 - desc / 100);
          
    listaItems.push({ 
        id: Date.now(), 
        concepto: conceptoEditado || itemOriginal.concepto, 
        obs: document.getElementById('obsManual').value, 
        qty, 
        total: fTotal, 
        unitario: fPrecio, 
        desc 
    });
    
    guardarEstadoLocal(); 
    renderTabla(); 
    
    document.getElementById('obsManual').value = ""; 
    document.getElementById('cantidad').value = 1; 
    document.getElementById('porcentajeDesc').value = 0; 
    selConcepto.value = ""; 
    limpiarEdicionesTemporales(); 
    document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
}

// ==========================================
// RENDER TABLAS
// ==========================================
function renderTabla() {
    const tbody = document.getElementById('cuerpoTabla'); tbody.innerHTML = ''; let total = 0;
    const f = new Date().toLocaleDateString('es-AR');
    
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--ngc-neon); font-size:0.85rem; padding-bottom:15px; border:none;"><b>CLIENTE:</b> ${inputCliNombre.value || 'Sin Nombre'}<br><b>PROYECTO:</b> ${document.getElementById('cliProyecto').value || 'General'} <br><b>FECHA:</b> ${f}</td></tr>`; 
    
    listaItems.forEach(i => { 
        total += i.total; 
        tbody.innerHTML += `<tr>
            <td><b>${i.concepto}</b><span style="display:block; font-size:0.8rem; color:var(--ngc-text-faded);">Unit: $${i.unitario.toLocaleString('es-AR')}${i.desc > 0 ? ` <strong style="color:var(--ngc-warning)">(-${i.desc}%)</strong>` : ''}</span>${i.obs ? `<small style="display:block; opacity:0.8; white-space: pre-wrap; margin-top:4px;">${i.obs}</small>` : ''}</td>
            <td align="center">x${i.qty}</td>
            <td align="right" style="color:var(--ngc-neon); font-weight:bold;">$${i.total.toLocaleString('es-AR')}</td>
            <td align="right" style="width:40px;"><button class="corp-btn-icon danger" style="width:32px; height:32px;" onclick="borrarItem(${i.id})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`; 
    });
    const og = document.getElementById('obsGenerales').value; 
    if(og) tbody.innerHTML += `<tr><td colspan="4" style="font-size:0.9rem; color:var(--ngc-text-faded); padding-top:15px; font-style:italic;">Nota: ${og}</td></tr>`; 
    
    totalMontoActual = total; document.getElementById('totalDisplay').innerText = `TOTAL: $ ${total.toLocaleString('es-AR')}`;
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) { listaItems = listaItems.filter(i => i.id !== id); guardarEstadoLocal(); renderTabla(); }

// ==========================================
// EXPORTACIÓN, PDF Y CAPTURA
// ==========================================
function actualizarPDFHeaders() {
    document.getElementById('headerMembrete').innerText = (localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL').toUpperCase();
    document.getElementById('pdf-slogan').innerText = localStorage.getItem('villaser_conf_slogan') || '';
    const t = localStorage.getItem('villaser_conf_telefono'); document.getElementById('pdf-tel').innerText = t ? `📞 ${t}` : '';
    const e = localStorage.getItem('villaser_conf_email'); document.getElementById('pdf-email').innerText = e ? `✉️ ${e}` : '';
    const logo = localStorage.getItem('villaser_conf_logo');
    if (logo && logo.startsWith('data:image')) { 
        document.getElementById('pdf-img-logo').src = logo; 
        document.getElementById('pdf-img-logo').style.display = 'block'; 
        document.getElementById('pdf-text-logo').style.display = 'none'; 
    } else { 
        document.getElementById('pdf-img-logo').style.display = 'none'; 
        document.getElementById('pdf-text-logo').innerText = document.getElementById('headerMembrete').innerText; 
        document.getElementById('pdf-text-logo').style.display = 'block'; 
    }
}

function sincronizarVistaPreviaPDF() {
    actualizarPDFHeaders();
    document.getElementById('pdf-nro').innerText = nroPresupuestoGlobal; 
    document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    document.getElementById('pdf-cliente').innerText = inputCliNombre.value || 'Sin Nombre'; 
    document.getElementById('pdf-direccion').innerText = document.getElementById('cliDireccion').value || 'A coordinar'; 
    document.getElementById('pdf-proyecto').innerText = document.getElementById('cliProyecto').value || '-';
    
    const tbody = document.getElementById('pdf-tbody'); tbody.innerHTML = ''; let sub = 0; let desc = 0; let not = '';

    listaItems.forEach((i, idx) => {
        const cod = `0${idx + 1}-0${Math.floor(Math.random() * 5) + 1}`; const fSub = i.unitario * i.qty;
        sub += fSub; desc += (fSub - i.total);
        tbody.innerHTML += `<tr><td>${cod}</td><td>${i.concepto}${i.desc > 0 ? ` <strong style="color: #ffc107;">(-${i.desc}%)</strong>` : ''}</td><td>${i.qty}</td><td>$&nbsp;${i.unitario.toLocaleString('es-AR')}</td><td>$&nbsp;${fSub.toLocaleString('es-AR')}</td></tr>`;
        if(i.obs) not += `<b>${cod}</b> ${i.obs.replace(/\n/g, ' ')}<br>`;
    });
    const og = document.getElementById('obsGenerales').value; if(og) not += `<br><b>Gral:</b> ${og}`;

    document.getElementById('pdf-subtotal').innerText = `$ ${sub.toLocaleString('es-AR')}`; 
    document.getElementById('pdf-descuentos').innerText = `-$ ${desc.toLocaleString('es-AR')}`; 
    document.getElementById('pdf-total').innerText = `$ ${(sub - desc).toLocaleString('es-AR')}`; 
    document.getElementById('pdf-notas').innerHTML = not || 'Sin notas.';
}

async function tomarCaptura() { 
    const zona = document.getElementById('zonaCaptura'); document.querySelectorAll('.corp-btn-icon.danger').forEach(b => b.style.visibility = 'hidden'); 
    zona.style.background = getComputedStyle(document.body).getPropertyValue('--bg-body');
    const scrollY = window.scrollY; window.scrollTo(0, 0);
    
    const canvas = await html2canvas(zona, { backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-body'), scale: 2, useCORS: true, scrollY: 0 }); 
    window.scrollTo(0, scrollY);
    
    const link = document.createElement('a'); link.download = `Presupuesto_${inputCliNombre.value.split(' ')[0] || 'Cliente'}.png`; link.href = canvas.toDataURL(); link.click(); 
    document.querySelectorAll('.corp-btn-icon.danger').forEach(b => b.style.visibility = 'visible'); zona.style.background = ''; 
}

async function generarPDF() {
    if (listaItems.length === 0) {
        mostrarAlertaCorp("Faltan Trabajos", "Agregá trabajos para generar el PDF.");
        return;
    }
    sincronizarVistaPreviaPDF();
    
    // Auto-guardado silencioso en Nube al generar PDF
    if(permiteGuardarNube) { guardarBorradorFirebase(false, true); }
    
    const element = document.getElementById('plantilla-pdf'); element.style.display = 'block'; window.scrollTo(0, 0);
    const opt = { 
        margin: 0, 
        filename: `${inputCliNombre.value.replace(/ /g, '_')}_Presupuesto.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    try { 
        await html2pdf().set(opt).from(element).save(); 
        mostrarToast("Generado con Éxito", permiteGuardarNube ? "PDF guardado y respaldado en la nube." : "PDF guardado (Local temporal)"); 
    } 
    catch (e) { mostrarAlertaCorp("Error", "Error al generar el PDF."); } 
    finally { if (window.innerWidth < 992) element.style.display = 'none'; }
}

// ==========================================
// NUEVO SISTEMA WHATSAPP
// ==========================================
function enviarWhatsApp() { 
    document.getElementById('modalWhatsApp').classList.remove('oculto');
    const btnActual = document.getElementById('btnWspGuardado');
    
    if (telefonoClienteActual) {
        btnActual.innerHTML = `<i class="fa-brands fa-whatsapp" style="color: white;"></i> Enviar al Cliente (${telefonoClienteActual})`;
        btnActual.style.display = 'flex';
    } else {
        btnActual.style.display = 'none';
    }
}

function cerrarModalWsp() {
    document.getElementById('modalWhatsApp').classList.add('oculto');
}

function armarMensajeWsp() {
    let m = `*${(localStorage.getItem('villaser_conf_nombre') || 'PRESUPUESTO').toUpperCase()}*\nProyecto: ${document.getElementById('cliProyecto').value}\n\n`; 
    listaItems.forEach(i => { m += `• ${i.concepto} (x${i.qty}) -> *$${i.total.toLocaleString('es-AR')}*\n`; }); 
    m += `\n*TOTAL: ${document.getElementById('totalDisplay').innerText.split(': ')[1]}*`; 
    return m;
}

function enviarWspClienteActual() {
    if (!telefonoClienteActual) return;
    
    let cleanNumber = telefonoClienteActual.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    const msg = armarMensajeWsp();
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    cerrarModalWsp();
}

function buscarEnWhatsApp() {
    const msg = armarMensajeWsp();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    cerrarModalWsp();
}

// ==========================================
// NUEVO MENÚ INFERIOR SCROLL (ESTILO META/FB)
// ==========================================
function generarMenuInferior() {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '#', active: true },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Costos', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button'); btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; }; footer.appendChild(btn);
    });
                               }
                                                                                     

let db = null;
const SHEET_ID = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
const URL_PRECIOS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbPrecios = [];
let listaItems = [];
let notasOriginales = "";
let nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;
let telefonoClienteActual = "";
let nombreBorradorActual = null; 

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
            <button class="ngc-btn-small" style="color: var(--ngc-neon); border-color: var(--ngc-neon); background: transparent;" onclick="seleccionarContacto('${c.nombre.replace(/'/g, "\\'")}', '${(c.dir || '').replace(/'/g, "\\'")}', '${(c.tel || '').replace(/'/g, "\\'")}')">Usar</button>
        `;
        contenedor.appendChild(div);
    });
}

function seleccionarContacto(nombre, dir, tel = "") {
    document.getElementById('cliNombre').value = nombre;
    document.getElementById('cliDireccion').value = dir;
    telefonoClienteActual = tel; // Guardamos el teléfono
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
function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
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
    
    // Armar el nombre sugerido
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliProyecto').value.trim() || 'Presupuesto').replace(/\s+/g, '_');
    let nombreSugerido = `${nombreCli}_${proyCli}_borrador_presupuesto`;
    let nombreFinal = nombreSugerido;

    if (!autoGuardado) {
        // Guardado Manual: Preguntar nombre al usuario
        const nombreIngresado = prompt("Guardar borrador como:", nombreBorradorActual || nombreSugerido);
        if (nombreIngresado === null) return; // El usuario canceló
        nombreFinal = nombreIngresado.trim() || nombreSugerido;
        nombreBorradorActual = nombreFinal; // Memoria del archivo actual
    } else {
        // Autoguardado desde PDF: Usa el nombre actual o el sugerido sin preguntar
        nombreFinal = nombreBorradorActual || nombreSugerido;
    }

    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        nro: nroPresupuestoGlobal,
        totalMonto: totalMontoActual,
        fechaGuardado: Date.now(),
        nombreBorrador: nombreFinal // Se guarda el nombre del archivo
    };
    
    // El ID en Firebase será el nombre del archivo. Si usas el mismo nombre, se sobrescribe.
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
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
              contenedor.innerHTML = `<p style='color:var(--ngc-text-faded); text-align:center;'>No hay borradores guardados para este cliente.</p>`;
              return;
          }
          let borradores = [];
          snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
          
          borradores.forEach((b) => {
              let p = b.data;
              const fechaStr = p.fechaGuardado ? new Date(p.fechaGuardado).toLocaleDateString() : 'Sin fecha';
              
              // Detecta el nombre personalizado del archivo o arma uno predeterminado
              const nombreArchivo = p.nombreBorrador || `${p.cliNombre}_${p.cliProyecto || 'Presupuesto'}_borrador`.replace(/\s+/g, '_');
              
              const div = document.createElement('div');
              div.style.cssText = "background: var(--ngc-bg-input); border-left: 3px solid #e91e63; padding: 12px; margin-bottom: 10px;";
              div.innerHTML = `
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <strong style="color: var(--ngc-text-main); word-break: break-word; line-height: 1.2; font-size: 0.95rem;">${nombreArchivo}</strong>
                      <span style="color: var(--success-green); margin-left: 10px; font-weight: bold;">$${(p.totalMonto || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div style="color: var(--ngc-text-faded); font-size: 0.75rem; margin-top: 4px; margin-bottom: 10px;">Última vez: ${fechaStr}</div>
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
            
            // Le indicamos al sistema en qué archivo estamos trabajando
            nombreBorradorActual = data.nombreBorrador || null; 

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
        permiteGuardarNube: permiteGuardarNube,
        telefonoCliente: telefonoClienteActual
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
        if (estado.telefonoCliente !== undefined) telefonoClienteActual = estado.telefonoCliente;
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
        
        // Limpiamos el nombre del archivo actual para empezar de cero
        nombreBorradorActual = null; 
        
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


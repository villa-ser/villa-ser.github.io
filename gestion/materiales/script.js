let db = null;
const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM'; 
const URL_MATERIALES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbMateriales = [];
let listaItems = [];
let contactosAgenda = []; 
let uidSeguro = null;

let clienteDesdeAgenda = false;
let permiteGuardarNube = true;

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');

// ==========================================
// INICIALIZACIÓN (MOTOR ULTRA BLINDADO)
// ==========================================
function arrancarModulo() {
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
        console.warn("Aviso: Firebase funcionando en modo local.", e); 
    }

    try { cargarEstadoGuardado(); } 
    catch (e) { localStorage.removeItem('materiales_estado_actual'); }

    fetchData();
}

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', arrancarModulo); 
} else { 
    arrancarModulo(); 
}

// ==========================================
// RASTREADOR DE SESIÓN EN TIEMPO REAL
// ==========================================
function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    if (typeof window.currentUserUid !== 'undefined' && window.currentUserUid) return window.currentUserUid;
    return null;
}

async function fetchData() {
    try {
        const res = await fetch(URL_MATERIALES);
        const txt = await res.text();
        const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
        
        dbMateriales = json.table.rows.filter(r => r.c[1] && r.c[1].v !== "Concepto").map(r => ({ 
            tema: r.c[0]?.v || 'Gral', 
            concepto: r.c[1]?.v || '' 
        }));
        
        poblarTemas();
        if (selTema) selTema.addEventListener('change', cambioTema);
        
        document.getElementById('loading').classList.add('oculto'); 
        document.getElementById('app').classList.remove('oculto');

        if (listaItems.length > 0) avanzarPasoTrabajo();
    } catch (e) { 
        document.getElementById('loading').innerHTML = `⚠️ Error leyendo Google Sheets.<br><br><button class="corp-btn" onclick="location.reload()">Reintentar</button>`;
    }
}


// ==========================================
// AGENDA Y MODALES (Flujo idéntico a Presupuesto)
// ==========================================
function marcarClienteManual() {
    clienteDesdeAgenda = false;
    permiteGuardarNube = true; 
}

function abrirModalAgenda() {
    const uid = obtenerUid();
    if (!uid || !db) return alert("⚠️ No hay sesión detectada para la agenda.");

    document.getElementById('modalAgenda').classList.remove('oculto');
    document.getElementById('buscadorAgenda').value = "";
    
    db.collection("perfiles").doc(uid).collection("contactos").orderBy("nombre").get()
      .then((snapshot) => {
          contactosAgenda = [];
          snapshot.forEach((doc) => { contactosAgenda.push(doc.data()); });
          filtrarAgenda();
      })
      .catch((error) => { document.getElementById('listaAgenda').innerHTML = "<p style='color:var(--error-red); text-align:center;'>Error al cargar contactos.</p>"; });
}

function cerrarModalAgenda() { document.getElementById('modalAgenda').classList.add('oculto'); }

function filtrarAgenda() {
    const texto = document.getElementById('buscadorAgenda').value.toLowerCase();
    const contenedor = document.getElementById('listaAgenda');
    contenedor.innerHTML = '';
    
    const filtrados = contactosAgenda.filter(c => (c.nombre || '').toLowerCase().includes(texto) || (c.dir || '').toLowerCase().includes(texto));
    if (filtrados.length === 0) return contenedor.innerHTML = "<p style='color:var(--ngc-text-faded); text-align:center;'>No se encontraron contactos.</p>";
    
    filtrados.forEach(c => {
        const div = document.createElement('div');
        div.style.cssText = "background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
        div.innerHTML = `
            <div>
                <h4 style="margin: 0; color: var(--ngc-text-main); font-size: 0.95rem;">${c.nombre}</h4>
                <small style="color: var(--ngc-text-faded);"><i class="fa-solid fa-location-dot"></i> ${c.dir || 'Sin dirección'}</small>
            </div>
            <button class="corp-btn-small" style="color: var(--ngc-neon); border: 1px solid var(--ngc-neon); background: transparent;" onclick="seleccionarContacto('${c.nombre.replace(/'/g, "\\'")}', '${(c.dir || '').replace(/'/g, "\\'")}')">Usar</button>
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

function iniciarLista() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) {
        alert("Por favor, ingresá al menos el Nombre del Cliente.");
        document.getElementById('cliNombre').focus();
        return;
    }
    if (!clienteDesdeAgenda) return document.getElementById('modalOpcionesCliente').classList.remove('oculto');
    avanzarPasoTrabajo();
}

function opcionBuscarAgenda() {
    document.getElementById('modalOpcionesCliente').classList.add('oculto');
    abrirModalAgenda();
}

function opcionContinuarSinAgenda() {
    document.getElementById('modalOpcionesCliente').classList.add('oculto');
    document.getElementById('modalAdvertenciaBorrador').classList.remove('oculto');
}

function confirmarListaTemporal() {
    permiteGuardarNube = false; 
    document.getElementById('modalAdvertenciaBorrador').classList.add('oculto');
    avanzarPasoTrabajo();
}
function cancelarListaTemporal() { document.getElementById('modalAdvertenciaBorrador').classList.add('oculto'); }

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    guardarClienteGlobal();
    renderTabla();
}
// ==========================================
// BORRADORES EN NUBE (Firebase)
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false) {
    const uid = obtenerUid();
    if (!uid || !db) return mostrarAlerta && alert("⚠️ Sesión no detectada para la nube.");
    if (!permiteGuardarNube) return mostrarAlerta && alert("⚠️ Acción bloqueada: Cliente no agendado.");
    if (listaItems.length === 0 && !document.getElementById('cliNombre').value) return;
    
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        fechaGuardado: Date.now()
    };
    
    let docId = (estado.cliNombre || "Borrador").replace(/\s+/g, '_').toLowerCase();
    db.collection("perfiles").doc(uid).collection("materiales").doc(docId).set(estado)
      .then(() => { if (mostrarAlerta) mostrarToast("Borrador Guardado", "Sincronizado con la nube."); })
      .catch((error) => console.error("Error guardando en la nube: ", error));
}

function abrirModalBorradores() {
    const uid = obtenerUid();
    if (!uid || !db) return alert("⚠️ Sesión no detectada.");
    const nombreCliente = document.getElementById('cliNombre').value.trim();
    if (!nombreCliente) return alert("⚠️ Ingresá el Nombre del Cliente para buscar sus borradores.");

    document.getElementById('modalBorradores').classList.remove('oculto');
    const contenedor = document.getElementById('listaBorradores');
    contenedor.innerHTML = `<div style="text-align: center; color: #e91e63;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando borradores...</div>`;
    
    db.collection("perfiles").doc(uid).collection("materiales").where("cliNombre", "==", nombreCliente).get()
      .then((snapshot) => {
          contenedor.innerHTML = '';
          if (snapshot.empty) return contenedor.innerHTML = `<p style='color:var(--ngc-text-faded); text-align:center;'>No hay listas guardadas.</p>`;
          
          let borradores = [];
          snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
          
          borradores.forEach((b) => {
              const p = b.data;
              const fechaStr = p.fechaGuardado ? new Date(p.fechaGuardado).toLocaleDateString() : 'Sin fecha';
              const div = document.createElement('div');
              div.style.cssText = "background: var(--ngc-bg-input); border-left: 3px solid #e91e63; padding: 12px; margin-bottom: 10px; border-radius: 8px;";
              div.innerHTML = `
                  <strong style="color: var(--ngc-text-main); display: block;">${p.cliNombre || 'Sin Nombre'}</strong>
                  <div style="color: var(--ngc-text-faded); font-size: 0.75rem; margin-bottom: 10px;">Última vez: ${fechaStr}</div>
                  <div style="display: flex; gap: 8px;">
                      <button class="corp-btn-small" style="flex:1;" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                      <button class="corp-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button>
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
    db.collection("perfiles").doc(uid).collection("materiales").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            data.clienteDesdeAgenda = true;
            data.permiteGuardarNube = true;
            localStorage.setItem('materiales_estado_actual', JSON.stringify(data));
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
        db.collection("perfiles").doc(uid).collection("materiales").doc(docId).delete().then(() => btnElement.closest('div').remove());
    }
}

// ==========================================
// MEMORIA LOCAL, LISTAS Y WSP
// ==========================================
function guardarClienteGlobal() {
    const obj = { nombre: document.getElementById('cliNombre').value.trim(), direccion: document.getElementById('cliDireccion').value.trim(), proyecto: document.getElementById('cliProyecto').value.trim() };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(obj));
    guardarEstadoLocal(); 
}

function guardarEstadoLocal() {
    const estado = { cliNombre: document.getElementById('cliNombre').value, cliDireccion: document.getElementById('cliDireccion').value, cliProyecto: document.getElementById('cliProyecto').value, obsGenerales: document.getElementById('obsGenerales').value, items: listaItems, clienteDesdeAgenda, permiteGuardarNube };
    localStorage.setItem('materiales_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('materiales_estado_actual') || localStorage.getItem('villaser_cliente_global'); // Fallback a memoria global
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

function nuevoListado() {
    if(confirm("¿Iniciar nueva lista?")) {
        document.getElementById('cliNombre').value = ''; document.getElementById('cliDireccion').value = ''; document.getElementById('cliProyecto').value = ''; document.getElementById('obsGenerales').value = '';
        listaItems = []; clienteDesdeAgenda = false; permiteGuardarNube = true;
        guardarEstadoLocal(); guardarClienteGlobal();
        document.getElementById('step-trabajo').classList.add('oculto'); document.getElementById('step-cliente').classList.remove('oculto');
        renderTabla();
    }
}

function mostrarToast(titulo, mensaje) {
    document.getElementById('toastTitle').innerText = titulo; document.getElementById('toastMessage').innerText = mensaje;
    const toast = document.getElementById('toastCliente'); toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 100);
    setTimeout(() => { toast.classList.remove('mostrar'); setTimeout(() => toast.classList.add('oculto'), 400); }, 4000); 
}

function step(id, val) { const el = document.getElementById(id); if(el) el.value = Math.max(el.min ? parseInt(el.min) : 1, (parseInt(el.value || 0) + val)); }

function poblarTemas() { if(selTema) { selTema.innerHTML = '<option value="">-- SELECCIONE CATEGORÍA --</option>'; [...new Set(dbMateriales.map(i => i.tema))].sort().forEach(t => selTema.appendChild(new Option(t, t))); } }
function cambioTema() { const t = selTema.value; selConcepto.innerHTML = '<option value="">-- SELECCIONE MATERIAL --</option>'; if(t) { selConcepto.disabled = false; dbMateriales.filter(i => i.tema === t).forEach(i => selConcepto.appendChild(new Option(i.concepto, i.concepto))); } else { selConcepto.disabled = true; } }

function agregarTrabajo() {
    if(!selConcepto.value) return alert("Selecciona un material.");
    listaItems.push({ id: Date.now(), material: selConcepto.value, qty: document.getElementById('cantidad').value, unidad: document.querySelector('input[name="tipoUnidad"]:checked').value, obs: document.getElementById('obsManual').value.trim() });
    guardarEstadoLocal(); renderTabla(); 
    document.getElementById('obsManual').value = ""; document.getElementById('cantidad').value = 1; selConcepto.value = ""; 
}

function renderTabla() {
    const tbody = document.getElementById('cuerpoTabla'); tbody.innerHTML = ''; 
    listaItems.forEach(i => {
        const div = document.createElement('div'); div.className = 'row-item';
        div.innerHTML = `<div style="flex:1;"><strong>${i.material}</strong><br><span style="color:var(--ngc-text-faded); font-size:0.75rem;">${i.obs ? i.obs : 'Sin nota'}</span></div><div style="font-weight:bold; color:var(--ngc-neon); text-align:right; margin-right:10px;">${i.qty} ${i.unidad}</div><button class="btn-delete" onclick="borrarItem(${i.id})"><i class="fa-solid fa-trash"></i></button>`;
        tbody.appendChild(div);
    });
}

function borrarItem(id) { listaItems = listaItems.filter(i => i.id !== id); guardarEstadoLocal(); renderTabla(); }

// --- WSP Y PDF ---
let telClienteAgendado = null;
function abrirModalWhatsApp() {
    if(listaItems.length === 0) return alert("Agregá materiales primero.");
    document.getElementById('wspNumeroManual').value = '';
    const btnAgendado = document.getElementById('wspOpcionAgendado');
    btnAgendado.style.display = 'none';
    
    const uid = obtenerUid();
    if(uid && db && document.getElementById('cliNombre').value) {
        db.collection("perfiles").doc(uid).collection("contactos").where("nombre", "==", document.getElementById('cliNombre').value).get().then(snap => {
            if(!snap.empty) {
                telClienteAgendado = snap.docs[0].data().tel;
                if(telClienteAgendado) btnAgendado.style.display = 'flex';
            }
        });
    }
    document.getElementById('modalWhatsApp').classList.remove('oculto');
}
function cerrarModalWhatsApp() { document.getElementById('modalWhatsApp').classList.add('oculto'); }

function ejecutarEnvioWsp(tel) {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    let m = `*${profNombre.toUpperCase()} - LISTA DE MATERIALES*\nProyecto: ${document.getElementById('cliProyecto').value || '-'}\n\n`; 
    listaItems.forEach(i => { m += `• ${i.qty} ${i.unidad} | ${i.material} ${i.obs ? '('+i.obs+')' : ''}\n`; }); 
    const og = document.getElementById('obsGenerales').value; if(og) m += `\n*Notas:* ${og}`;
    window.open(`https://wa.me/549${tel.replace(/\D/g, '')}?text=${encodeURIComponent(m)}`, '_blank'); 
    cerrarModalWhatsApp();
}
function enviarWspAgendado() { if(telClienteAgendado) ejecutarEnvioWsp(telClienteAgendado); }
function enviarWspManual() {
    const tel = document.getElementById('wspNumeroManual').value;
    if(tel.length < 8) return alert("Ingrese un número válido.");
    ejecutarEnvioWsp(tel);
}

async function tomarCaptura() {
    const zona = document.getElementById('zonaCaptura'); document.querySelectorAll('.btn-delete').forEach(b => b.style.display = 'none'); 
    zona.style.color = "#ffffff"; const scrollY = window.scrollY; window.scrollTo(0, 0);
    const canvas = await html2canvas(zona, { backgroundColor: "#1e1e1e", scale: 2, useCORS: true, scrollY: 0 }); 
    window.scrollTo(0, scrollY);
    const link = document.createElement('a'); link.download = `Materiales_${document.getElementById('cliNombre').value}.png`; link.href = canvas.toDataURL(); link.click(); 
    document.querySelectorAll('.btn-delete').forEach(b => b.style.display = 'inline-block'); zona.style.color = ""; 
}

async function generarPDF() {
    if(listaItems.length === 0) return alert("No hay materiales");
    if(permiteGuardarNube) guardarBorradorFirebase(false);
    
    document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    document.getElementById('pdf-cliente').innerText = document.getElementById('cliNombre').value || 'Sin nombre';
    document.getElementById('pdf-direccion').innerText = document.getElementById('cliDireccion').value || 'Sin dirección';
    document.getElementById('pdf-proyecto').innerText = document.getElementById('cliProyecto').value || '-';
    
    const tbody = document.getElementById('pdf-tbody'); tbody.innerHTML = '';
    listaItems.forEach(i => { tbody.appendChild(Object.assign(document.createElement('tr'), { innerHTML: `<td>${i.material}</td><td>${i.obs}</td><td>${i.qty}</td><td>${i.unidad}</td>` })); });
    document.getElementById('pdf-notas').innerText = document.getElementById('obsGenerales').value || 'Sin notas.';
    
    const element = document.getElementById('plantilla-pdf'); element.style.display = 'block'; window.scrollTo(0, 0);
    
    try { await html2pdf().set({ margin: 0, filename: `Materiales_${document.getElementById('cliNombre').value}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).save(); } 
    catch (e) { alert("Error al generar PDF."); } finally { element.style.display = 'none'; }
}

// ==========================================
// MENÚ INFERIOR SCROLL (ESTILO META/FB)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto2/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '#', active: true },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Costos', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});
        

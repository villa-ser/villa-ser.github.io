// ==========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ==========================================
let db = null;
let uidSeguro = null;

let informeParrafos = [];
let nombreBorradorActual = null; 
let telefonoClienteActual = "";

// Controles de Nube (Flujo Cliente Agendado clonado de Presupuesto)
let clienteDesdeAgenda = false;
let permiteGuardarNube = true;

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
        console.warn("Aviso: Firebase no pudo iniciar.", e);
    }
    
    // Generar menú inferior al cargar
    generarMenuInferior();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarModulo);
} else {
    arrancarModulo();
}

function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    return null;
}

// ==========================================
// INTEGRACIÓN AGENDA Y FLUJO (CLON DE PRESUPUESTO)
// ==========================================
function seleccionarContacto(nombre, dir, tel = "") {
    document.getElementById('cliNombre').value = nombre; 
    document.getElementById('cliDireccion').value = dir;
    telefonoClienteActual = tel; 
    
    clienteDesdeAgenda = true; 
    permiteGuardarNube = true; 
    
    if (typeof cerrarModalAgendaGlobal === 'function') cerrarModalAgendaGlobal(); 
    mostrarToast("Cliente Seleccionado", "Importado de agenda.");
}

function iniciarInforme() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) { 
        mostrarAlertaCorp("Datos incompletos", "Por favor, ingresá al menos el Nombre del Cliente."); 
        return; 
    }
    if (!clienteDesdeAgenda) { 
        document.getElementById('modalAgendarCliente').classList.remove('oculto'); 
        return; 
    }
    avanzarPasoTrabajo();
}

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    actualizarVistaPreviews();
}

function accionAgendarCliente() {
    const nombre = encodeURIComponent(document.getElementById('cliNombre').value.trim());
    const dir = encodeURIComponent(document.getElementById('cliDireccion').value.trim());
    window.location.href = `../agenda/index.html?nombre=${nombre}&dir=${dir}`;
}

function opcionBuscarAgenda() { 
    document.getElementById('modalAgendarCliente').classList.add('oculto'); 
    if(typeof abrirModalAgendaGlobal === 'function') abrirModalAgendaGlobal(); 
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

// ==========================================
// MODALES DE ALERTA Y REINICIO
// ==========================================
function mostrarAlertaCorp(titulo, mensaje) {
    document.getElementById('modalAlertaTitulo').innerText = titulo;
    document.getElementById('modalAlertaMensaje').innerText = mensaje;
    document.getElementById('modalAlertaCorp').classList.remove('oculto');
}

function cerrarModalAlertaCorp() {
    document.getElementById('modalAlertaCorp').classList.add('oculto');
}

function ejecutarNuevoInforme() {
    if (typeof cerrarModalConfirmarNuevoGlobal === 'function') cerrarModalConfirmarNuevoGlobal(); 
    
    document.getElementById('cliNombre').value = '';
    document.getElementById('cliDireccion').value = '';
    document.getElementById('cliProyecto').value = '';
    document.getElementById('obsGenerales').value = '';
    
    informeParrafos = [];
    clienteDesdeAgenda = false;
    permiteGuardarNube = true;
    nombreBorradorActual = null;
    telefonoClienteActual = "";
    
    document.getElementById('step-trabajo').classList.add('oculto');
    document.getElementById('step-cliente').classList.remove('oculto');
    renderizarParrafos();
}

// ==========================================
// FLUJO INFORME Y PÁRRAFOS
// ==========================================
function agregarParrafo() {
    const texto = document.getElementById('textoInforme').value.trim();
    if (!texto) {
        mostrarAlertaCorp("Campo Vacío", "Escriba un párrafo antes de agregar.");
        return;
    }
    
    informeParrafos.push(texto);
    document.getElementById('textoInforme').value = "";
    renderizarParrafos();
}

function eliminarParrafo(index) {
    if (confirm("¿Eliminar este párrafo?")) {
        informeParrafos.splice(index, 1);
        renderizarParrafos();
    }
}

function editarParrafo(index) {
    document.getElementById('textoInforme').value = informeParrafos[index];
    informeParrafos.splice(index, 1);
    renderizarParrafos();
    document.getElementById('textoInforme').focus();
}

function renderizarParrafos() {
    const contenedor = document.getElementById('lista-parrafos');
    contenedor.innerHTML = '';
    
    informeParrafos.forEach((parrafo, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); padding: 12px; border-radius: 8px; position: relative; font-size: 0.85rem; line-height: 1.5; color: var(--ngc-text-main);';
        div.innerHTML = `
            <p>${parrafo}</p>
            <div style="display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end;">
                <button onclick="editarParrafo(${index})" style="background: transparent; border: none; color: #ff9800; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                <button onclick="eliminarParrafo(${index})" style="background: transparent; border: none; color: var(--error-red); cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        contenedor.appendChild(div);
    });
    actualizarVistaPreviews();
}

// ==========================================
// RENDERIZADO, PDF Y MEMBRETE
// ==========================================
function actualizarVistaPreviews() {
    const cliNombre = document.getElementById('cliNombre').value || 'Sin Nombre';
    const cliDir = document.getElementById('cliDireccion').value || '-';
    const cliProyecto = document.getElementById('cliProyecto').value || '-';
    
    const infoClientArea = document.getElementById('previewClientInfo');
    infoClientArea.innerHTML = `<strong>Cliente:</strong> ${cliNombre}<br><strong>Dirección:</strong> ${cliDir}<br><strong>Proyecto:</strong> ${cliProyecto}`;
    
    const previewArea = document.getElementById('previewInforme');
    previewArea.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 15px;">${p}</p>`).join('');

    const og = document.getElementById('obsGenerales').value;
    const previewGlobales = document.getElementById('previewNotasGlobales');
    if (og) {
        previewGlobales.innerText = `Nota: ${og}`;
        previewGlobales.style.display = 'block';
    } else {
        previewGlobales.style.display = 'none';
    }

    // Actualizar Mapeo de plantilla PDF
    const pdfFecha = document.getElementById('pdf-fecha');
    const pdfCliente = document.getElementById('pdf-cliente');
    const pdfDir = document.getElementById('pdf-dir');
    const pdfProyecto = document.getElementById('pdf-proyecto');
    const pdfTexto = document.getElementById('pdf-texto-contenido');
    const pdfNotasBox = document.getElementById('pdf-notas-box');
    const pdfNotas = document.getElementById('pdf-notas');

    if(pdfFecha) pdfFecha.innerText = new Date().toLocaleDateString('es-AR');
    if(pdfCliente) pdfCliente.innerText = cliNombre;
    if(pdfDir) pdfDir.innerText = cliDir;
    if(pdfProyecto) pdfProyecto.innerText = cliProyecto;
    if(pdfTexto) pdfTexto.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 20px;">${p}</p>`).join('');

    if (og && pdfNotasBox && pdfNotas) {
        pdfNotas.innerText = og;
        pdfNotasBox.style.display = 'block';
    } else if (pdfNotasBox) {
        pdfNotasBox.style.display = 'none';
    }
    
    actualizarPDFHeaders();
}

function actualizarPDFHeaders() {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';

    const elTelFooter = document.getElementById('pdf-tel-footer');
    if(elTelFooter) elTelFooter.innerText = profTel ? `📞 ${profTel}` : '';
    const elSlogan = document.getElementById('pdf-slogan');
    if(elSlogan) elSlogan.innerText = profSlogan || '¡Electricidad Segura, Hogar Tranquilo!';
    const elCredenciales = document.getElementById('pdf-credenciales');
    if(elCredenciales) elCredenciales.innerText = profNombre;

    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (imgPdf && txtPdf) {
        if (profLogo && profLogo.startsWith('data:image')) {
            imgPdf.src = profLogo; imgPdf.style.display = 'block'; txtPdf.style.display = 'none';
        } else {
            imgPdf.style.display = 'none'; txtPdf.innerText = profNombre.toUpperCase(); txtPdf.style.display = 'block';
        }
    }
}

async function generarPDF() {
    if (informeParrafos.length === 0) {
        mostrarAlertaCorp("Sin Contenido", "Agregue al menos un párrafo al informe.");
        return;
    }
    actualizarVistaPreviews();
    const element = document.getElementById('plantilla-pdf');
    element.style.display = 'block';
    window.scrollTo(0, 0);
    
    const shortName = (document.getElementById('cliNombre').value || "Cliente").split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    const opt = {
        margin:       0, 
        filename:     `${shortName}_Informe_Tecnico.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if(permiteGuardarNube) { guardarBorradorFirebase(false, true); }
    
    try {
        await html2pdf().set(opt).from(element).save();
        mostrarToast("Éxito", "PDF generado correctamente.");
    } catch (error) {
        mostrarAlertaCorp("Error", "Ocurrió un error al generar el PDF.");
    } finally {
        if (window.innerWidth < 992) element.style.display = 'none'; 
    }
}

async function tomarCaptura() {
    if (informeParrafos.length === 0) {
        mostrarAlertaCorp("Sin Contenido", "El informe está vacío.");
        return;
    }
    const area = document.getElementById('captureSection');
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor = isLightMode ? "#ffffff" : "#181818";
    
    area.style.color = isLightMode ? "#1a1a1a" : "#ffffff";
    area.style.border = "none";
    
    html2canvas(area, { backgroundColor: bgColor, scale: 2, useCORS: true, scrollY: 0 }).then(canvas => {
        const link = document.createElement('a');
        const shortName = (document.getElementById('cliNombre').value || "Cliente").split(' ')[0];
        link.download = `Informe_${shortName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        area.style.color = ""; 
        area.style.border = "";
    });
}

// ==========================================
// WHATSAPP (INTEGRACIÓN GLOBAL)
// ==========================================
function prepararEnvioWhatsApp() {
    if (informeParrafos.length === 0) {
        mostrarAlertaCorp("Faltan Datos", "Agregá al menos un párrafo al informe primero.");
        return;
    }
    
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    let msg = `*${profNombre.toUpperCase()} - INFORME TÉCNICO*\n`;
    msg += `*Cliente:* ${document.getElementById('cliNombre').value || 'Sin Nombre'}\n`;
    msg += `*Proyecto:* ${document.getElementById('cliProyecto').value || '-'}\n\n`;
    
    informeParrafos.forEach(p => msg += `${p}\n\n`);
    
    const og = document.getElementById('obsGenerales').value;
    if (og) msg += `*NOTAS GLOBALES:*\n${og}\n`;

    if (typeof abrirModalWspGlobal === 'function') {
        abrirModalWspGlobal(telefonoClienteActual, msg);
    } else {
        console.error("No se encontró abrirModalWspGlobal. Verifica que global.js esté enlazado.");
    }
}

// ==========================================
// BORRADORES EN LA NUBE (FIREBASE)
// ==========================================

// ==========================================
// BORRADORES EN LA NUBE CON MODALES FLOTANTES
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
    const uid = obtenerUid();
    if (!uid || !db) {
        if (mostrarAlerta) mostrarAlertaCorp("Error", "Sesión no detectada para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) mostrarAlertaCorp("Bloqueado", "Cliente no agendado. No se guarda en nube.");
        return;
    }
    if (informeParrafos.length === 0) return;
    
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliProyecto').value.trim() || 'Informe').replace(/\s+/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    let nombreSugerido = `${nombreCli}_${proyCli}_${fechaHoy}`;

    if (!autoGuardado) {
        // En lugar de prompt(), abrimos el Modal
        document.getElementById('inputNombreBorrador').value = nombreBorradorActual || nombreSugerido;
        document.getElementById('modalGuardarBorrador').classList.remove('oculto');
    } else {
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
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        parrafos: informeParrafos,
        fechaGuardado: Date.now(),
        nombreBorrador: nombreFinal,
        telefonoClienteActual: telefonoClienteActual 
    };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).set(estado)
      .then(() => {
          if (mostrarAlerta) mostrarToast("Guardado", "Sincronizado con la nube.");
      })
      .catch((e) => {
          console.error("Error Firebase:", e);
          if (mostrarAlerta) mostrarAlertaCorp("Error", "Error al guardar el borrador.");
      });
}

// Lógica para Eliminar Borrador con Modal
let idBorradorAEliminar = null;
let btnBorradorAEliminar = null;

function eliminarBorradorNube(docId, btnElement) {
    idBorradorAEliminar = docId;
    btnBorradorAEliminar = btnElement;
    document.getElementById('modalConfirmarEliminar').classList.remove('oculto');
}

function cerrarModalEliminarBorrador() {
    document.getElementById('modalConfirmarEliminar').classList.add('oculto');
    idBorradorAEliminar = null;
    btnBorradorAEliminar = null;
}

function ejecutarEliminarBorrador() {
    const uid = obtenerUid();
    if (!uid || !db || !idBorradorAEliminar) return;

    db.collection("perfiles").doc(uid).collection("borradores_informe").doc(idBorradorAEliminar).delete()
        .then(() => {
            if (btnBorradorAEliminar) {
                btnBorradorAEliminar.closest('div.modal-list-item').remove();
            }
            cerrarModalEliminarBorrador();
            mostrarToast("Eliminado", "Borrador eliminado de la nube.");
        })
        .catch((e) => {
            console.error("Error eliminando: ", e);
            mostrarAlertaCorp("Error", "No se pudo eliminar el borrador.");
            cerrarModalEliminarBorrador();
        });
}

/* async function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
  /*  const uid = obtenerUid();
    if (!uid || !db) {
        if (mostrarAlerta) mostrarAlertaCorp("Error", "Sesión no detectada para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) mostrarAlertaCorp("Bloqueado", "Cliente no agendado. No se guarda en nube.");
        return;
    }
    if (informeParrafos.length === 0) return;
    
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliProyecto').value.trim() || 'Informe').replace(/\s+/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    
    let nombreSugerido = `${nombreCli}_${proyCli}_${fechaHoy}`;
    let nombreFinal = nombreSugerido;

    if (!autoGuardado) {
        const nombreIngresado = prompt("Guardar borrador como:", nombreBorradorActual || nombreSugerido);
        if (nombreIngresado === null) return;
        nombreFinal = nombreIngresado.trim() || nombreSugerido;
        nombreBorradorActual = nombreFinal;
    } else {
        nombreFinal = nombreBorradorActual || nombreSugerido;
    }

    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDireccion: document.getElementById('cliDireccion').value,
        cliProyecto: document.getElementById('cliProyecto').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        parrafos: informeParrafos,
        fechaGuardado: Date.now(),
        nombreBorrador: nombreFinal,
        telefonoClienteActual: telefonoClienteActual 
    };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    try {
        await db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).set(estado);
        if (mostrarAlerta) mostrarToast("Guardado", "Sincronizado con la nube.");
    } catch (e) {
        console.error("Error Firebase:", e);
        if (mostrarAlerta) mostrarAlertaCorp("Error", "Error al guardar el borrador.");
    }
} */

async function abrirModalBorradores() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if (!nombre) { 
        mostrarAlertaCorp("Falta Cliente", "Ingresá el Nombre del Cliente primero para buscar sus borradores."); 
        return; 
    }

    document.getElementById('modalBorradores').classList.remove('oculto');
    const lista = document.getElementById('listaBorradores');
    lista.innerHTML = '<div style="text-align: center; color: var(--ngc-neon);"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...</div>';

    const uid = obtenerUid();
    if (!uid || !db) {
        lista.innerHTML = '<div style="color:var(--error-red); text-align:center;">Sin conexión a la nube.</div>';
        return;
    }

    try {
        const snapshot = await db.collection("perfiles").doc(uid).collection("borradores_informe")
            .where('cliNombre', '==', nombre)
            .get();
            
        let docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
        docs.sort((a,b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
            
        lista.innerHTML = '';
        if (docs.length === 0) {
            lista.innerHTML = '<p style="text-align:center; color: var(--ngc-text-faded);">No hay borradores en nube.</p>';
            return;
        }

        docs.forEach(b => {
            const p = b.data;
            const fechaStr = p.fechaGuardado ? new Date(p.fechaGuardado).toLocaleDateString() : 'Sin fecha';
            lista.innerHTML += `
                <div class="modal-list-item" style="border-left: 3px solid var(--ngc-neon);">
                    <div style="flex: 1; min-width: 0; padding-right: 10px;">
                        <h4 style="word-break: break-word; line-height: 1.2; margin-bottom: 5px;">${p.nombreBorrador || p.cliNombre}</h4>
                        <small style="color: var(--ngc-text-faded);">${fechaStr}</small>
                    </div>
                    <div style="display: flex; gap: 5px; flex-shrink: 0;">
                        <button class="corp-btn-small" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                        <button class="corp-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        lista.innerHTML = '<div style="color:var(--error-red); text-align:center;">Error al cargar borradores.</div>';
    }
}

async function cargarBorradorNube(docId) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    try {
        const doc = await db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).get();
        if (doc.exists) {
            const data = doc.data();
            
            document.getElementById('cliNombre').value = data.cliNombre || '';
            document.getElementById('cliDireccion').value = data.cliDireccion || data.cliDir || '';
            document.getElementById('cliProyecto').value = data.cliProyecto || '';
            document.getElementById('obsGenerales').value = data.obsGenerales || '';
            
            informeParrafos = data.parrafos || [];
            if (data.telefonoClienteActual !== undefined) telefonoClienteActual = data.telefonoClienteActual;
            
            clienteDesdeAgenda = true;
            permiteGuardarNube = true;
            nombreBorradorActual = data.nombreBorrador || null;
            
            if(typeof cerrarModalBorradoresGlobal === 'function') cerrarModalBorradoresGlobal();
            
            document.getElementById('step-cliente').classList.add('oculto');
            document.getElementById('step-trabajo').classList.remove('oculto');
            renderizarParrafos();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    } catch(e) {
        mostrarAlertaCorp("Error", "Error al cargar el borrador.");
    }
}

/*function eliminarBorradorNube(docId, btnElement) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    if (confirm("¿Eliminar este borrador de la nube?")) {
        db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).delete().then(() => {
            btnElement.closest('div.modal-list-item').remove();
            mostrarToast("Eliminado", "Borrador eliminado correctamente.");
        });
    }
} */

// ==========================================
// UTILIDADES COMPARTIDAS (TOAST Y MENÚ)
// ==========================================
function mostrarToast(titulo, mensaje) {
    const toast = document.getElementById('toastCliente');
    if (!toast) return;
    
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 100);
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }, 4000);
}

function generarMenuInferior() {
    const footer = document.getElementById('corpFooterMenu'); 
    if (!footer) return;
    
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '#', active: true },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
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
}


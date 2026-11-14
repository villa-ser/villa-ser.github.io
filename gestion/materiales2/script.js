let db = null;
const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM'; 
const URL_MATERIALES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbMateriales = [];
let listaItems = [];
let uidSeguro = null;

let clienteDesdeAgenda = false;
let permiteGuardarNube = true;

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
        
        document.getElementById('loading').classList.add('oculto'); 
        document.getElementById('app').classList.remove('oculto');

        if (listaItems.length > 0) avanzarPasoTrabajo();
    } catch (e) { 
        document.getElementById('loading').innerHTML = `⚠️ Error leyendo Google Sheets.<br><br><button class="corp-btn" onclick="location.reload()">Reintentar</button>`;
    }
}

// ==========================================
// NUEVO MOTOR DE CASCADA (ACORDEONES)
// ==========================================
function llenarSelectAcordeon(idSuffix, dataArray, onChangeCallback) {
    const hiddenInput = document.getElementById('sel' + idSuffix);
    const summary = document.getElementById('sum' + idSuffix);
    const list = document.getElementById('list' + idSuffix);
    const details = document.getElementById('det' + idSuffix);

    if (!hiddenInput || !summary || !list || !details) return;

    list.innerHTML = ''; 
    hiddenInput.value = ''; 
    summary.innerText = '-- SELECCIONE --'; 

    const unicos = [...new Set(dataArray)].filter(Boolean).sort();
    
    if (unicos.length === 0) {
        details.setAttribute('disabled', 'true');
        details.style.pointerEvents = 'none';
        details.style.opacity = '0.5';
    } else {
        details.removeAttribute('disabled');
        details.style.pointerEvents = 'auto';
        details.style.opacity = '1';

        unicos.forEach(val => {
            const option = document.createElement('div');
            option.className = 'corp-select-option';
            option.innerText = val;
            option.onclick = () => {
                hiddenInput.value = val;
                summary.innerText = val;
                details.removeAttribute('open');
                if (onChangeCallback) onChangeCallback();
            };
            list.appendChild(option);
        });
    }
}

function poblarTemas() { 
    llenarSelectAcordeon('Tema', dbMateriales.map(i => i.tema), cambioTema); 
}

function cambioTema() { 
    const t = document.getElementById('selTema').value; 
    llenarSelectAcordeon('Concepto', dbMateriales.filter(i => i.tema === t).map(i => i.concepto), cambioConcepto); 
    llenarSelectAcordeon('Nivel3', []); 
    llenarSelectAcordeon('Nivel4', []); 
    llenarSelectAcordeon('Nivel5', []); 
}

function cambioConcepto() { 
    const t = document.getElementById('selTema').value; 
    const c = document.getElementById('selConcepto').value; 
    llenarSelectAcordeon('Nivel3', dbMateriales.filter(i => i.tema === t && i.concepto === c).map(i => i.nivel3), cambioNivel3); 
    llenarSelectAcordeon('Nivel4', []); 
    llenarSelectAcordeon('Nivel5', []); 
}

function cambioNivel3() { 
    const t = document.getElementById('selTema').value; 
    const c = document.getElementById('selConcepto').value; 
    const n3 = document.getElementById('selNivel3').value; 
    llenarSelectAcordeon('Nivel4', dbMateriales.filter(i => i.tema === t && i.concepto === c && i.nivel3 === n3).map(i => i.nivel4), cambioNivel4); 
    llenarSelectAcordeon('Nivel5', []); 
}

function cambioNivel4() { 
    const t = document.getElementById('selTema').value; 
    const c = document.getElementById('selConcepto').value; 
    const n3 = document.getElementById('selNivel3').value; 
    const n4 = document.getElementById('selNivel4').value; 
    llenarSelectAcordeon('Nivel5', dbMateriales.filter(i => i.tema === t && i.concepto === c && i.nivel3 === n3 && i.nivel4 === n4).map(i => i.nivel5)); 
}

document.addEventListener('click', function(event) {
    const details = document.querySelectorAll('.corp-custom-select');
    details.forEach(det => {
        if (!det.contains(event.target)) {
            det.removeAttribute('open');
        }
    });
});

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
    if(!nombre) { mostrarAlertaCorp("Faltan Datos", "Por favor, ingresá al menos el Nombre del Cliente."); return; }
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
    const uid = obtenerUid(); if (!uid || !db) return mostrarAlerta && mostrarAlertaCorp("Error", "Sesión no detectada.");
    if (!permiteGuardarNube) return mostrarAlerta && mostrarAlertaCorp("Acción bloqueada", "Cliente no agendado.");
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
    
    const inputNombre = document.getElementById('cliNombre');
    const nombre = inputNombre ? inputNombre.value.trim() : '';

    if (!nombre) { 
        mostrarAlertaCorp("Falta Cliente", "Ingresá el Nombre del Cliente primero para buscar sus borradores.");
        return; 
    }

    document.getElementById('modalBorradores').classList.remove('oculto');
    const cont = document.getElementById('listaBorradores'); 
    cont.innerHTML = `<div style="text-align:center; padding: 15px;"><i class="fa-solid fa-circle-notch fa-spin" style="color: var(--ngc-neon);"></i> Buscando...</div>`;
    
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

function mostrarToast(titulo, mensaje) {
    document.getElementById('toastTitle').innerText = titulo; document.getElementById('toastMessage').innerText = mensaje;
    const toast = document.getElementById('toastCliente'); toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 50);
    setTimeout(() => { toast.classList.remove('mostrar'); setTimeout(() => toast.classList.add('oculto'), 400); }, 3000); 
}

function step(id, val) { const el = document.getElementById(id); if(el) el.value = Math.max(el.min ? parseInt(el.min) : 1, (parseInt(el.value || 0) + val)); }

function agregarTrabajo() {
    const valConcepto = document.getElementById('selConcepto').value;
    
    if(!valConcepto) {
        return mostrarAlertaCorp("Atención", "Selecciona al menos un material.");
    }

    const valTema = document.getElementById('selTema').value;
    const valNivel3 = document.getElementById('selNivel3').value;
    const valNivel4 = document.getElementById('selNivel4').value;
    const valNivel5 = document.getElementById('selNivel5').value;

    const partes = [valTema, valConcepto, valNivel3, valNivel4, valNivel5];
    const nombreCompleto = partes.filter(Boolean).join(' | ');
    
    const qty = document.getElementById('cantidad').value;
    const nota = document.getElementById('obsManual').value.trim();
    const unidad = document.querySelector('input[name="tipoUnidad"]:checked').value;
    
    listaItems.push({ 
        id: Date.now(), 
        material: nombreCompleto, 
        cantidad: qty, 
        unidad: unidad, 
        nota: nota 
    });
    
    guardarEstadoLocal(); 
    renderTabla(); 
    
    document.getElementById('obsManual').value = ""; 
    document.getElementById('cantidad').value = 1; 
    
    document.getElementById('selConcepto').value = "";
    document.getElementById('sumConcepto').innerText = "-- SELECCIONE --";
    llenarSelectAcordeon('Nivel3', []); 
    llenarSelectAcordeon('Nivel4', []); 
    llenarSelectAcordeon('Nivel5', []);
}


function renderTabla() {
    const tbody = document.getElementById('cuerpoTabla'); tbody.innerHTML = ''; 
    listaItems.forEach(i => {
        const div = document.createElement('div');
        div.className = 'modal-list-item';
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
    
    // Mantiene sincronizada la vista de PC / Móvil en tiempo real
    sincronizarVistaPreviaPDF();
}

function borrarItem(id) { listaItems = listaItems.filter(i => i.id !== id); guardarEstadoLocal(); renderTabla(); }

// ==========================================
// NUEVO MENÚ ACCIONES AGRUPADAS
// ==========================================
function toggleAccionesMenu() {
    document.getElementById('contenedorAcciones').classList.toggle('oculto');
}

// ==========================================
// DESCARGAS (WSP, VISTA PREVIA FULLSCREEN, PDF)
// ==========================================
let telClienteAgendado = null;

function prepararEnvioWhatsApp() {
    if(listaItems.length === 0) return mostrarAlertaCorp("Atención", "Agregá materiales primero.");
    
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    let msg = `*${profNombre.toUpperCase()} - LISTA DE MATERIALES*\nProyecto: ${document.getElementById('cliProyecto').value || '-'}\n\n`; 
    listaItems.forEach(i => { msg += `• ${i.cantidad} ${i.unidad} | ${i.material} ${i.nota ? '('+i.nota+')' : ''}\n`; }); 
    const og = document.getElementById('obsGenerales').value; 
    if(og) msg += `\n*Notas:* ${og}`;

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

function sincronizarVistaPreviaPDF() {
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
}

let escalaBasePreview = 1;
let escalaActualPreview = 1;
let anchoRealA4 = 794;
let altoRealA4 = 1123;
let zoomPreviewInicializado = false;

function aplicarEscalaVistaPrevia(nuevaEscala) {
    const plantilla = document.getElementById('plantilla-pdf');
    const pdfContainer = plantilla ? plantilla.querySelector('.pdf-container') : null;
    if (!plantilla || !pdfContainer) return;

    escalaActualPreview = Math.max(escalaBasePreview, Math.min(2.5, nuevaEscala));
    pdfContainer.style.transformOrigin = 'top left';
    pdfContainer.style.transform = `scale(${escalaActualPreview})`;
    plantilla.style.width = `${anchoRealA4 * escalaActualPreview}px`;
    plantilla.style.height = `${altoRealA4 * escalaActualPreview}px`;
}

function inicializarZoomVistaPrevia() {
    if (zoomPreviewInicializado) return;
    const contenedor = document.getElementById('contenedorVistaPreviaMobile');
    if (!contenedor) return;

    let distInicial = 0;
    let escalaInicialPellizco = 1;

    contenedor.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            distInicial = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            escalaInicialPellizco = escalaActualPreview;
        }
    }, { passive: true });

    contenedor.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && distInicial > 0) {
            e.preventDefault();
            const rect = contenedor.getBoundingClientRect();
            const centroX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centroY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const puntoX = centroX - rect.left + contenedor.scrollLeft;
            const puntoY = centroY - rect.top + contenedor.scrollTop;
            const escalaPrevia = escalaActualPreview;

            const distActual = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            aplicarEscalaVistaPrevia(escalaInicialPellizco * (distActual / distInicial));

            const factorCambio = escalaActualPreview / escalaPrevia;
            contenedor.scrollLeft = (puntoX * factorCambio) - (centroX - rect.left);
            contenedor.scrollTop = (puntoY * factorCambio) - (centroY - rect.top);
        }
    }, { passive: false });

    contenedor.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            distInicial = 0;
        }
    }, { passive: true });

    zoomPreviewInicializado = true;
}

function abrirVistaPreviaMobile() {
    if (listaItems.length === 0) {
        mostrarAlertaCorp("Faltan Datos", "Agregá materiales para ver la vista previa.");
        return;
    }
    sincronizarVistaPreviaPDF();

    const modal = document.getElementById('modalVistaPrevia');
    const contenedor = document.getElementById('contenedorVistaPreviaMobile');
    const plantilla = document.getElementById('plantilla-pdf');
    const pdfContainer = plantilla.querySelector('.pdf-container');

    modal.classList.remove('oculto');
    document.body.style.overflow = 'hidden';

    plantilla.style.display = 'inline-block';
    plantilla.style.textAlign = 'left';
    plantilla.style.position = 'relative';
    plantilla.style.overflow = 'hidden';
    plantilla.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
    contenedor.appendChild(plantilla);

    if (pdfContainer) {
        pdfContainer.style.transform = 'none';
        anchoRealA4 = pdfContainer.offsetWidth || 794;
        altoRealA4 = pdfContainer.offsetHeight || 1123;
    }

    const anchoDisponible = Math.max(280, contenedor.clientWidth - 30);
    escalaBasePreview = Math.min(1, anchoDisponible / anchoRealA4);
    aplicarEscalaVistaPrevia(escalaBasePreview);

    contenedor.scrollTop = 0;
    contenedor.scrollLeft = 0;
    inicializarZoomVistaPrevia();
}

function cerrarVistaPrevia() {
    const plantilla = document.getElementById('plantilla-pdf');
    const pdfContainer = plantilla ? plantilla.querySelector('.pdf-container') : null;
    const aside = document.querySelector('.preview-panel');

    if (pdfContainer) {
        pdfContainer.style.transform = '';
        pdfContainer.style.transformOrigin = '';
    }

    plantilla.style.width = '';
    plantilla.style.height = '';
    plantilla.style.display = '';
    plantilla.style.textAlign = '';
    plantilla.style.position = '';
    plantilla.style.overflow = '';
    plantilla.style.boxShadow = '';

    if (aside) aside.appendChild(plantilla);

    document.getElementById('modalVistaPrevia').classList.add('oculto');
    document.body.style.overflow = '';
}


function generarPDF() {
    if(listaItems.length === 0) return mostrarAlertaCorp("Atención", "No hay materiales para generar el PDF.");
    sincronizarVistaPreviaPDF();
    
    const inputNombre = document.getElementById('cliNombre');
    const sugerido = inputNombre ? inputNombre.value.trim().replace(/ /g, '_') : 'Cliente';
    const uniqueSuffix = Math.floor(Math.random() * 9000) + 1000;
    
    document.getElementById('nombreArchivoPDF').value = `Materiales_${sugerido}_${uniqueSuffix}`;
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
    
    const element = document.getElementById('plantilla-pdf'); 
    
    // Ocultar Sello de Agua dinámico durante generación PDF final
    const selloAgua = document.getElementById('selloAguaPDF');
    if (selloAgua) selloAgua.style.display = 'none';

    element.style.display = 'block'; 
    window.scrollTo(0, 0);
    
    const nombreFinal = document.getElementById('nombreArchivoPDF').value.trim() || 'Materiales';

    const opt = { 
        margin: 0, 
        filename: `${nombreFinal}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    try { 
        await html2pdf().set(opt).from(element).save();
        cerrarModalPDF();
    } 
    catch (e) { 
        mostrarAlertaCorp("Error", "Error al generar PDF."); 
        btn.innerHTML = "Descargar";
    } 
    finally { 
        if (window.innerWidth < 992) {
            element.style.display = 'none'; 
        } else {
            element.style.display = ''; 
        }
        
        // Restaurar Sello de Agua para vista en vivo / Vista Previa
        if (selloAgua) selloAgua.style.display = 'flex';
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
});

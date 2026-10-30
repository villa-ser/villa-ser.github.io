let db = null;
const SHEET_ID = '1XfQoCkNMXy5WLhQciVrRoc1Pz6yeKKiAZljR_KYpohM';
const URL_MAT = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Materiales`;

let dataMat = [];
let listaItems = []; 
let nombreBorradorActual = null;
let telefonoClienteActual = "";
let contactosAgenda = []; 
let clienteDesdeAgenda = false;
let permiteGuardarNube = true;
let uidSeguro = null;

const selects = [
    document.getElementById('sel0'), document.getElementById('sel1'), 
    document.getElementById('sel2'), document.getElementById('sel3'), 
    document.getElementById('sel4'), document.getElementById('sel5')
];

// ==========================================
// INICIALIZACIÓN Y CARGA
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
        console.warn("Aviso: Firebase no pudo iniciar, funcionando en modo local.", e);
    }
    
    try {
        cargarEstadoGuardado();
    } catch (e) {
        console.warn("Aviso: Memoria local reseteada.");
        localStorage.removeItem('materiales_estado_actual');
    }
    
    initDatosSheets();
}

window.onload = () => { arrancarModulo(); };

function obtenerUidSeguro() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    if (typeof currentUserUid !== 'undefined' && currentUserUid) return currentUserUid;
    return null;
}

async function initDatosSheets() {
    try {
        const resMat = await fetch(URL_MAT);
        dataMat = parseCSV(await resMat.text());
        
        document.getElementById('loading').classList.add('oculto');
        
        if (listaItems.length === 0) {
            document.getElementById('section-client').classList.remove('oculto');
        } else {
            document.getElementById('app').classList.remove('oculto');
        }
        
        fillSelect(0, [...new Set(dataMat.map(item => item.c0))].filter(v => v));
        selects[0].disabled = false;

        setupEventListeners();
    } catch (e) { 
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `⚠️ Error al leer los datos.<br><br><button class="ngc-btn" onclick="location.reload()">Reintentar</button>`;
        }
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
        sel.addEventListener('change', () => updateDropdown(index + 1));
    });
}

// ==========================================
// INTEGRACIÓN AGENDA (FIREBASE)
// ==========================================
function marcarClienteManual() {
    clienteDesdeAgenda = false;
    permiteGuardarNube = true; 
}

function abrirModalAgenda() {
    const uid = obtenerUidSeguro();
    if (!uid || !db) {
        alert("⚠️ No hay sesión detectada.");
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
            <button class="ngc-btn-small" style="color: var(--ngc-neon); border-color: var(--ngc-neon); background: transparent;" onclick="seleccionarContactoAgenda('${c.nombre.replace(/'/g, "\\'")}', '${(c.dir || '').replace(/'/g, "\\'")}', '${(c.tel || '').replace(/'/g, "\\'")}')">Usar</button>
        `;
        contenedor.appendChild(div);
    });
}

function seleccionarContactoAgenda(nombre, dir, tel = "") {
    document.getElementById('cliNombre').value = nombre;
    document.getElementById('cliDir').value = dir;
    telefonoClienteActual = tel; 
    clienteDesdeAgenda = true;
    permiteGuardarNube = true; 
    guardarClienteGlobal();
    cerrarModalAgenda();
    mostrarToast("Cliente Seleccionado", "Datos de agenda importados.");
}

// ==========================================
// CONTROL DE FLUJO
// ==========================================
function iniciarLista() {
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
    avanzarPasoLista();
}

function opcionBuscarAgenda() {
    document.getElementById('modalAgendarCliente').classList.add('oculto');
    abrirModalAgenda();
}

function opcionContinuarSinAgenda() {
    if (confirm("⚠️ AVISO: Al no estar en tu agenda, esta lista NO podrá guardarse en la nube (solo podrás descargar el PDF o Imagen).\n\n¿Estás seguro de continuar?")) {
        permiteGuardarNube = false; 
        document.getElementById('modalAgendarCliente').classList.add('oculto');
        avanzarPasoLista();
    }
}

function avanzarPasoLista() {
    document.getElementById('section-client').classList.add('oculto');
    document.getElementById('app').classList.remove('oculto');
    document.getElementById('main-content').classList.remove('oculto');
    document.getElementById('main-content').classList.add('flex-column', 'gap-15');
    document.getElementById('btnNuevoListado').classList.remove('oculto');
    
    // Si la lista está vacía, agregamos el encabezado de cliente automáticamente.
    const nombre = document.getElementById('cliNombre').value.trim();
    if (nombre && listaItems.length === 0) {
        const dir = document.getElementById('cliDir').value;
        const fecha = new Date().toLocaleDateString('es-AR');
        listaItems.push({ 
            id: Date.now(), type: 'CLI', 
            raw: `CLI\t${nombre}\t${dir}`, 
            html: `<strong style="color:var(--success-green); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> ${fecha} - ${nombre}</strong>` 
        });
    }
    guardarClienteGlobal();
    renderItems();
}

// ==========================================
// BORRADORES NUBE (FIREBASE)
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
    const uid = obtenerUidSeguro();
    if (!uid || !db) {
        if (mostrarAlerta) alert("⚠️ Sesión no detectada para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) alert("⚠️ Acción bloqueada: Esta lista pertenece a un cliente no agendado.");
        return;
    }
    if (listaItems.length === 0 && !document.getElementById('cliNombre').value) return;
    
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliObs').value.trim() || 'Proyecto').replace(/\s+/g, '_');
    let nombreSugerido = `${nombreCli}_${proyCli}_borrador_materiales`;
    let nombreFinal = nombreSugerido;

    if (!autoGuardado) {
        const nombreIngresado = prompt("Guardar borrador de materiales como:", nombreBorradorActual || nombreSugerido);
        if (nombreIngresado === null) return; 
        nombreFinal = nombreIngresado.trim() || nombreSugerido;
        nombreBorradorActual = nombreFinal;
    } else {
        nombreFinal = nombreBorradorActual || nombreSugerido;
    }
    
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDir: document.getElementById('cliDir').value,
        cliObs: document.getElementById('cliObs').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        timestamp: Date.now(),
        nombreBorrador: nombreFinal
    };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    db.collection("perfiles").doc(uid).collection("borradores_materiales").doc(docId).set(estado)
      .then(() => { if (mostrarAlerta) mostrarToast("Borrador Guardado", "Sincronizado con tu cuenta."); })
      .catch((error) => console.error("Error guardando en la nube: ", error));
}

function abrirModalBorradores() {
    const uid = obtenerUidSeguro();
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
    
    db.collection("perfiles").doc(uid).collection("borradores_materiales")
      .where("cliNombre", "==", nombreClienteActual).get()
      .then((snapshot) => {
          contenedor.innerHTML = '';
          if (snapshot.empty) {
              contenedor.innerHTML = `<p style='color:var(--ngc-text-faded); text-align:center;'>No hay borradores guardados para este cliente.</p>`;
              return;
          }
          let borradores = [];
          snapshot.forEach((doc) => borradores.push({ id: doc.id, data: doc.data() }));
          borradores.sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0));
          
          borradores.forEach((b) => {
              let p = b.data;
              const fechaStr = p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Sin fecha';
              const cantItems = p.items ? p.items.length : 0;
              const nombreArchivo = p.nombreBorrador || `${p.cliNombre}_borrador`.replace(/\s+/g, '_');
              
              const div = document.createElement('div');
              div.style.cssText = "background: var(--ngc-bg-input); border-left: 3px solid #e91e63; padding: 12px; margin-bottom: 10px;";
              div.innerHTML = `
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <strong style="color: var(--ngc-text-main); word-break: break-word; line-height: 1.2; font-size: 0.95rem;">${nombreArchivo}</strong>
                      <span style="color: var(--success-green); margin-left: 10px; font-size: 0.8rem; font-weight: bold;">${cantItems} Ítems</span>
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
    const uid = obtenerUidSeguro();
    if (!uid || !db) return;
    db.collection("perfiles").doc(uid).collection("borradores_materiales").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            data.clienteDesdeAgenda = true;
            data.permiteGuardarNube = true;
            nombreBorradorActual = data.nombreBorrador || null; 

            localStorage.setItem('materiales_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado();
            guardarClienteGlobal();
            cerrarModalBorradores();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    });
}

function eliminarBorradorNube(docId, btnElement) {
    const uid = obtenerUidSeguro();
    if (!uid || !db) return;
    if (confirm("¿Eliminar este borrador de la nube?")) {
        db.collection("perfiles").doc(uid).collection("borradores_materiales").doc(docId).delete().then(() => {
            btnElement.closest('div').parentElement.remove();
        });
    }
}

// ==========================================
// MEMORIA Y ESTADO LOCAL
// ==========================================
function guardarClienteGlobal() {
    const clienteObj = {
        nombre: document.getElementById('cliNombre').value.trim(),
        direccion: document.getElementById('cliDir').value.trim(),
        proyecto: document.getElementById('cliObs').value.trim()
    };
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clienteObj));
    guardarEstado(); 
}

function guardarEstado() {
    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliDir: document.getElementById('cliDir').value,
        cliObs: document.getElementById('cliObs').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        items: listaItems,
        clienteDesdeAgenda: clienteDesdeAgenda,
        permiteGuardarNube: permiteGuardarNube,
        telefonoCliente: telefonoClienteActual,
        nombreBorrador: nombreBorradorActual
    };
    localStorage.setItem('materiales_estado_actual', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const estadoStr = localStorage.getItem('materiales_estado_actual');
    if (estadoStr) {
        const estado = JSON.parse(estadoStr);
        if (estado.cliNombre) document.getElementById('cliNombre').value = estado.cliNombre;
        if (estado.cliDir) document.getElementById('cliDir').value = estado.cliDir;
        if (estado.cliObs) document.getElementById('cliObs').value = estado.cliObs;
        if (estado.obsGenerales) document.getElementById('obsGenerales').value = estado.obsGenerales;
        
        if (estado.clienteDesdeAgenda !== undefined) clienteDesdeAgenda = estado.clienteDesdeAgenda;
        if (estado.permiteGuardarNube !== undefined) permiteGuardarNube = estado.permiteGuardarNube;
        if (estado.telefonoCliente !== undefined) telefonoClienteActual = estado.telefonoCliente;
        if (estado.nombreBorrador !== undefined) nombreBorradorActual = estado.nombreBorrador;
        
        listaItems = estado.items || [];
        if (listaItems.length > 0) {
            document.getElementById('section-client').classList.add('oculto');
            document.getElementById('app').classList.remove('oculto');
            document.getElementById('main-content').classList.remove('oculto');
            document.getElementById('main-content').classList.add('flex-column');
            document.getElementById('btnNuevoListado').classList.remove('oculto');
            renderItems();
        }
    }
}

function nuevoListado() {
    if(confirm("¿Estás seguro de iniciar una nueva lista?")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliDir').value = '';
        document.getElementById('cliObs').value = '';
        document.getElementById('obsGenerales').value = '';
        listaItems = [];
        clienteDesdeAgenda = false;
        permiteGuardarNube = true;
        nombreBorradorActual = null;
        telefonoClienteActual = "";
        
        guardarEstado();
        guardarClienteGlobal();
        
        document.getElementById('main-content').classList.add('oculto');
        document.getElementById('section-client').classList.remove('oculto');
        document.getElementById('btnNuevoListado').classList.add('oculto');
        renderItems();
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
// ÍTEMS Y MATERIALES
// ==========================================
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

function renderItems() {
    const container = document.getElementById('itemsContainer');
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

    const og = document.getElementById('obsGenerales').value;
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
        html: `<b>${cant} ${unit.substring(0,4).toUpperCase()}</b> | ${textParts.join('/')} ${obs ? `<span style="color:var(--ngc-neon);">[${obs}]</span>` : ''}` 
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
    const unidadDefault = unRadio ? unRadio.value : "Unid";
    
    const unidadBruta = prompt("Unidad (Ej: Unid, Mts, Rollo, Pack):", unidadDefault) || unidadDefault;
    const unit = unidadBruta.charAt(0).toUpperCase() + unidadBruta.slice(1).toLowerCase();
    const obs = prompt("Notas del ítem (Opcional):", document.getElementById('observaciones').value || "") || "";

    listaItems.push({ 
        id: Date.now(), type: 'ITM', 
        raw: `ITM\t${cant}\t${unit}\t${descripcion.trim()}\t${obs.trim()}`, 
        html: `<b>${cant} ${unit.substring(0,4).toUpperCase()}</b> | ${descripcion.trim()} ${obs.trim() ? `<span style="color:var(--ngc-neon);">[${obs.trim()}]</span>` : ''}` 
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

// ==========================================
// EXPORTACIÓN PDF E IMAGEN
// ==========================================
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

    let clienteNombre = document.getElementById('cliNombre').value || "Cliente";
    let clienteDireccion = document.getElementById('cliDir').value || "-";
    let clienteProyecto = document.getElementById('cliObs').value || "-";
    
    const tbody = document.getElementById('pdf-tbody');
    if(!tbody) return;
    tbody.innerHTML = ''; 

    listaItems.forEach((i) => {
        const raw = i.raw.split('\t');
        if (raw[0] === 'ITM') {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="text-align: center; font-weight: bold;">${raw[1]}</td><td style="text-align: center;">${raw[2].substring(0,4).toUpperCase()}</td><td>${raw[3]}</td><td style="font-size: 10.5px; color: #555; text-align: left;">${raw[4] || '-'}</td>`;
            tbody.appendChild(tr);
        }
    });

    if (document.getElementById('pdf-cliente')) document.getElementById('pdf-cliente').innerText = clienteNombre;
    if (document.getElementById('pdf-dir')) document.getElementById('pdf-dir').innerText = clienteDireccion;
    if (document.getElementById('pdf-proyecto')) document.getElementById('pdf-proyecto').innerText = clienteProyecto;
    if (document.getElementById('pdf-fecha')) document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');
    
    if (document.getElementById('pdf-slogan')) document.getElementById('pdf-slogan').innerText = profSlogan;
    if (document.getElementById('pdf-tel-footer')) document.getElementById('pdf-tel-footer').innerText = profTel ? `📞 ${profTel}` : '';
    
    const boxNotas = document.getElementById('pdf-notas-box');
    const og = document.getElementById('obsGenerales').value;

    if(og && boxNotas) {
        document.getElementById('pdf-notas').innerText = og;
        boxNotas.style.display = 'block';
    } else if (boxNotas) {
        boxNotas.style.display = 'none';
    }
}

async function generarPDF() {
    if (listaItems.length <= 1 && document.getElementById('cliNombre').value === '') { 
        alert("Agrega materiales para generar el PDF."); 
        return; 
    }
    sincronizarVistaPreviaPDF();

    if(permiteGuardarNube) { guardarBorradorFirebase(false, true); }

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
    try { 
        await html2pdf().set(opt).from(element).save(); 
        if(permiteGuardarNube) mostrarToast("Generado con Éxito", "PDF guardado y copia respaldada en la nube.");
    } 
    catch (error) { console.error("Error PDF: ", error); alert("Hubo un error al generar el PDF."); } 
    finally { if (window.innerWidth < 992) element.style.display = 'none'; }
}

function takeScreenshot() {
    const area = document.getElementById('captureSection');
    const deletes = area.querySelectorAll('.btn-delete');
    deletes.forEach(b => b.style.visibility = 'hidden');
    
    const nameToUse = document.getElementById('cliNombre').value || "Lista";
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

// ==========================================
// NUEVO SISTEMA WHATSAPP
// ==========================================
function enviarWhatsApp() { 
    document.getElementById('modalWhatsApp').classList.remove('oculto');
    const btnActual = document.getElementById('btnWspGuardado');
    
    if (telefonoClienteActual) {
        btnActual.innerHTML = `<i class="fa-brands fa-whatsapp" style="color: white;"></i> Enviar al Cliente (${telefonoClienteActual})`;
        btnActual.disabled = false;
        btnActual.style.opacity = '1';
    } else {
        btnActual.innerHTML = `<i class="fa-brands fa-whatsapp" style="color: white;"></i> Cliente sin teléfono`;
        btnActual.disabled = true;
        btnActual.style.opacity = '0.5';
    }
}

function cerrarModalWsp() { document.getElementById('modalWhatsApp').classList.add('oculto'); }

function armarMensajeWsp() {
    let text = "*VILLASER - MATERIALES SOLICITADOS*\n";
    listaItems.forEach(i => {
        const raw = i.raw.split('\t');
        if (raw[0] === 'CLI') text += `\n*CLIENTE:* ${raw[1]}\n`;
        else if (raw[0] === 'ITM') text += `• ${raw[1]} ${raw[2].substring(0,4).toUpperCase()} - ${raw[3]} ${raw[4] ? '('+raw[4]+')' : ''}\n`;
    });

    const obsGen = document.getElementById('obsGenerales').value;
    if (obsGen) text += `\n*NOTAS GLOBALES:*\n${obsGen}\n`;
    return text;
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

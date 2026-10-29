let db;
const SHEET_ID = '1tZbCYSBxx3suGLKmE_bXi_hEm0iH0yqQedqR7kdShEU';
const URL_PRECIOS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Hoja1`; 

let dbPrecios = [];
let listaItems = [];
let notasOriginales = "";
let nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;

let conceptoEditado = null;
let precioEditado = null;
let contactosAgenda = []; // Para el buscador
let totalMontoActual = 0; // Para guardar en metadatos

const selTema = document.getElementById('selTema');
const selConcepto = document.getElementById('selConcepto');

// ==========================================
// INICIALIZACIÓN
// ==========================================
function initAppFirestore() {
    db = firebase.firestore();
    cargarClienteGlobal(); 
    cargarEstadoGuardado(); 
    fetchData();
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

        if (listaItems.length > 0) iniciarPresupuesto();
    } catch (e) { 
        document.getElementById('loading').innerHTML = `⚠️ Error de conexión a la base de datos.<br><br><button class="ngc-btn" onclick="location.reload()">Reintentar</button>`;
        console.error(e);
    }
}

function setupEventListeners() {
    selTema.addEventListener('change', cambioTema);
    selConcepto.addEventListener('change', cargarDetallePrecios);
}

// ==========================================
// INTEGRACIÓN AGENDA (FIREBASE)
// ==========================================
function abrirModalAgenda() {
    document.getElementById('modalAgenda').classList.remove('oculto');
    document.getElementById('buscadorAgenda').value = "";
    
    // Descargar contactos desde Firebase
    db.collection("perfiles").doc(currentUserUid).collection("contactos")
      .orderBy("nombre")
      .get()
      .then((snapshot) => {
          contactosAgenda = [];
          snapshot.forEach((doc) => {
              contactosAgenda.push(doc.data());
          });
          filtrarAgenda();
      })
      .catch((error) => {
          console.error("Error al cargar agenda:", error);
          document.getElementById('listaAgenda').innerHTML = "<p style='color:var(--error-red); text-align:center;'>Error al cargar contactos.</p>";
      });
}

function cerrarModalAgenda() {
    document.getElementById('modalAgenda').classList.add('oculto');
}

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
    // Proyecto se deja manual como pediste
    guardarClienteGlobal();
    cerrarModalAgenda();
    mostrarToast("Cliente Seleccionado", "Datos de agenda importados.");
}

// ==========================================
// BORRADORES EN LA NUBE (FIREBASE)
// ==========================================
function guardarBorradorFirebase(mostrarAlerta = false) {
    if (!currentUserUid) return;
    if (listaItems.length === 0 && !document.getElementById('cliNombre').value) {
        if (mostrarAlerta) alert("El presupuesto está vacío. No hay nada que guardar.");
        return;
    }
    
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
    
    // Guardamos usando un ID fijo basado en el cliente, o uno genérico si no hay nombre. 
    // Así un cliente puede tener 1 presupuesto en borrador activo sin llenar la base de datos de basura.
    let docId = (estado.cliNombre || "Borrador").replace(/\s+/g, '_').toLowerCase();

    db.collection("perfiles").doc(currentUserUid).collection("presupuestos").doc(docId).set(estado)
    .then(() => {
        if (mostrarAlerta) mostrarToast("Borrador Guardado", "Se sincronizó con tu cuenta en la nube.");
    })
    .catch((error) => console.error("Error guardando en la nube: ", error));
}

function abrirModalBorradores() {
    document.getElementById('modalBorradores').classList.remove('oculto');
    const contenedor = document.getElementById('listaBorradores');
    contenedor.innerHTML = '<div style="text-align: center; color: #e91e63;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando en la nube...</div>';
    
    db.collection("perfiles").doc(currentUserUid).collection("presupuestos")
      .orderBy("fechaGuardado", "desc")
      .get()
      .then((snapshot) => {
          contenedor.innerHTML = '';
          if (snapshot.empty) {
              contenedor.innerHTML = "<p style='color:var(--ngc-text-faded); text-align:center;'>No tienes borradores guardados.</p>";
              return;
          }
          
          snapshot.forEach((doc) => {
              let p = doc.data();
              const fechaStr = new Date(p.fechaGuardado).toLocaleDateString('es-AR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
              
              const div = document.createElement('div');
              div.style.cssText = "background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); border-left: 3px solid #e91e63; padding: 12px; border-radius: 8px;";
              div.innerHTML = `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <strong style="color: var(--ngc-text-main); font-size: 0.95rem;">${p.cliNombre || 'Sin Nombre'}</strong>
                      <span style="color: var(--success-green); font-weight: bold; font-size: 0.85rem;">$${(p.totalMonto || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div style="color: var(--ngc-text-faded); font-size: 0.75rem; margin-bottom: 10px;">
                      Proyecto: ${p.cliProyecto || '-'}<br>
                      Última vez: ${fechaStr}
                  </div>
                  <div style="display: flex; gap: 8px;">
                      <button class="ngc-btn-small" style="flex:1; border: 1px solid #e91e63; color: #e91e63; background: rgba(233, 30, 99, 0.1);" onclick="cargarBorradorNube('${doc.id}')">Abrir</button>
                      <button class="ngc-btn-small" style="border: 1px solid var(--error-red); color: var(--error-red); background: transparent;" onclick="eliminarBorradorNube('${doc.id}', this)"><i class="fa-solid fa-trash"></i></button>
                  </div>
              `;
              contenedor.appendChild(div);
          });
      })
      .catch((error) => {
          console.error("Error al cargar borradores:", error);
          contenedor.innerHTML = "<p style='color:var(--error-red); text-align:center;'>Error al conectar con la nube.</p>";
      });
}

function cerrarModalBorradores() {
    document.getElementById('modalBorradores').classList.add('oculto');
}

function cargarBorradorNube(docId) {
    db.collection("perfiles").doc(currentUserUid).collection("presupuestos").doc(docId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            localStorage.setItem('presupuesto_estado_actual', JSON.stringify(data));
            cargarEstadoGuardado();
            guardarClienteGlobal();
            
            document.getElementById('step-cliente').classList.add('oculto');
            document.getElementById('step-trabajo').classList.remove('oculto');
            document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
            renderTabla();
            
            cerrarModalBorradores();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    });
}

function eliminarBorradorNube(docId, btnElement) {
    if (confirm("¿Estás seguro de eliminar este borrador de la nube?")) {
        db.collection("perfiles").doc(currentUserUid).collection("presupuestos").doc(docId).delete().then(() => {
            btnElement.closest('div').parentElement.remove();
        });
    }
}

// ==========================================
// MEMORIA LOCAL Y TOAST
// ==========================================
function inicializarClienteMemoria() {
    const clienteStr = localStorage.getItem('villaser_cliente_global');
    const estadoStr = localStorage.getItem('presupuesto_estado_actual');
    const estado = estadoStr ? JSON.parse(estadoStr) : { items: [] };

    if (clienteStr && estado.items.length === 0 && !estado.cliNombre) {
        window.clienteTemporal = JSON.parse(clienteStr);
        document.getElementById('modalRecuperarCliente').classList.remove('oculto');
    } else {
        cargarEstadoGuardado();
    }
}

function usarClienteMemoria() {
    document.getElementById('cliNombre').value = window.clienteTemporal.nombre || '';
    document.getElementById('cliDireccion').value = window.clienteTemporal.direccion || '';
    document.getElementById('cliProyecto').value = window.clienteTemporal.proyecto || '';
    guardarClienteGlobal();
    document.getElementById('modalRecuperarCliente').classList.add('oculto');
}

function limpiarClienteMemoria() {
    document.getElementById('modalRecuperarCliente').classList.add('oculto');
}

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
        nro: nroPresupuestoGlobal
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
    }
}

function nuevoPresupuesto() {
    if(confirm("¿Estás seguro de iniciar un nuevo presupuesto? Se borrará el borrador local actual.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliDireccion').value = '';
        document.getElementById('cliProyecto').value = '';
        document.getElementById('obsGenerales').value = '';
        listaItems = [];
        nroPresupuestoGlobal = `PEM-${Math.floor(Math.random() * 9000) + 1000}`;
        guardarEstadoLocal();
        guardarClienteGlobal();
        
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
    guardarClienteGlobal();
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
    const nuevoTexto = prompt("Editar nombre del trabajo:", valorBase);
    if (nuevoTexto !== null && nuevoTexto.trim() !== "") {
        conceptoEditado = nuevoTexto.trim(); document.getElementById('badgeConcepto').style.display = 'block';
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
    
    guardarEstadoLocal(); renderTabla(); 
    
    document.getElementById('obsManual').value = ""; document.getElementById('cantidad').value = 1; document.getElementById('porcentajeDesc').value = 0;
    selConcepto.value = ""; 
    limpiarEdicionesTemporales(); document.getElementById('unitarioLabel').innerText = "Unit: $ 0,00";
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

    // Guardado Automático como Borrador en la Nube antes del PDF
    guardarBorradorFirebase(false);

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
        mostrarToast("Generado con Éxito", "PDF guardado local y borrador respaldado en la nube.");
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

// --- GUARDIÁN DE SEGURIDAD Y BASE DE DATOS ---
let currentUserUid = null;
let db = null;

firebase.auth().onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
        window.location.replace('../index.html'); 
    } else {
        currentUserUid = user.uid;
        db = firebase.firestore();
    }
});

// --- LÓGICA DE TEMA AUTOMÁTICO EN TIEMPO REAL ---
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
    if (temaGuardado === 'system') {
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
});

// MAPEADO DIRECTO AEA 90364-7-770 (Tabla 770.12.I - Embutido B1, 2x cargados + PE a 40°C)
const MAPA_IZ = { "1.5": 15, "2.5": 21, "4": 28, "6": 36, "10": 50, "16": 66 };

let listaAmbientes = [];
let editandoId = null;

// Lógica Agenda / Firebase
let clienteDesdeAgenda = false;
let clienteActualId = null;
let modoAgenda = 'carga'; // Controla si la agenda sirve para cargar cliente o enviar WhatsApp

// Circuitos inician vacíos en selecciones, esperando ingreso del usuario
let circuitos = [
    { id: 'C1', tipo: 'IUG', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' },
    { id: 'C2', tipo: 'TUG', dpms: 2200, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' }
];
let circuitoCS = { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };

window.onload = () => {
    actualizarPDFHeaders();
};

// --- SISTEMA DE TOAST (NOTIFICACIONES) ---
function mostrarToast(titulo, mensaje, esError = false) {
    const toast = document.getElementById('toastNotificacion');
    if (!toast) return;
    
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    
    const icon = document.getElementById('toastIcon');
    if (esError) {
        toast.style.borderLeftColor = 'var(--error-red)';
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.style.color = 'var(--error-red)';
    } else {
        toast.style.borderLeftColor = 'var(--success-green)';
        icon.className = 'fa-solid fa-check-circle';
        icon.style.color = 'var(--success-green)';
    }

    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 10);
    setTimeout(() => cerrarToast(), 3500);
}

function cerrarToast() {
    const toast = document.getElementById('toastNotificacion');
    if (toast) {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }
}

// --- LÓGICA DE FLUJO DE CLIENTE ---
function marcarClienteManual() {
    clienteDesdeAgenda = false;
    clienteActualId = null;
}

function nuevoCalculo() {
    if(confirm("¿Estás seguro de iniciar un nuevo cálculo? Se borrarán todos los ambientes actuales.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliTel').value = '';
        document.getElementById('cliDireccion').value = '';
        marcarClienteManual();

        listaAmbientes = [];
        circuitos = [
            { id: 'C1', tipo: 'IUG', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' },
            { id: 'C2', tipo: 'TUG', dpms: 2200, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' }
        ];
        circuitoCS = { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };
        
        document.getElementById('step-trabajo').classList.add('oculto');
        document.getElementById('step-cliente').classList.remove('oculto');
        calcularGradoYRenderizar();
    }
}

function iniciarCalculo() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) {
        alert("Por favor, ingresá al menos el Nombre del Cliente/Proyecto.");
        document.getElementById('cliNombre').focus();
        return;
    }
    
    if (!clienteDesdeAgenda) {
        document.getElementById('modalAgendarCliente').classList.remove('oculto');
        return;
    }

    avanzarPasoTrabajo();
}

function opcionContinuarSinAgenda() {
    document.getElementById('modalAgendarCliente').classList.add('oculto');
    document.getElementById('modalAdvertenciaBorrador').classList.remove('oculto');
}

function opcionBuscarAgenda() {
    document.getElementById('modalAgendarCliente').classList.add('oculto');
    abrirModalAgenda('carga');
}

function confirmarCalculoTemporal() {
    document.getElementById('modalAdvertenciaBorrador').classList.add('oculto');
    avanzarPasoTrabajo();
}

function cancelarCalculoTemporal() {
    document.getElementById('modalAdvertenciaBorrador').classList.add('oculto');
}

function avanzarPasoTrabajo() {
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    actualizarGestorCircuitos();
    calcularGradoYRenderizar();
}

// --- AGENDA DE FIREBASE Y BUSCADOR ---
function abrirModalAgenda(modo = 'carga') {
    modoAgenda = modo;
    if (modo === 'whatsapp') {
        cerrarModalWhatsApp();
    }
    document.getElementById('modalAgenda').classList.remove('oculto');
    filtrarAgenda();
}

function cerrarModalAgenda() {
    document.getElementById('modalAgenda').classList.add('oculto');
}

async function filtrarAgenda() {
    const query = document.getElementById('buscadorAgenda').value.toLowerCase();
    const lista = document.getElementById('listaAgenda');
    lista.innerHTML = '<div style="text-align: center; color: var(--ngc-neon);"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...</div>';
    
    if(!db || !currentUserUid) return;

    try {
        const snapshot = await db.collection('clientes').where('userId', '==', currentUserUid).get();
        lista.innerHTML = '';
        let count = 0;

        snapshot.forEach(doc => {
            const c = doc.data();
            // Corrección de bug: Si un cliente no tiene nombre guardado o está incompleto, previene el error "replace is not a function"
            const nombre = c.nombre || c.cliente || 'Sin Nombre';
            const tel = c.telefono || c.tel || '';
            const dir = c.direccion || c.dir || '';
            
            const textStr = `${nombre} ${tel} ${dir}`.toLowerCase();
            
            if (textStr.includes(query)) {
                count++;
                lista.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--ngc-privacy-border); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <b style="color: var(--ngc-text-main); display: block;">${nombre}</b>
                            <small style="color: var(--ngc-text-faded);"><i class="fa-solid fa-phone"></i> ${tel || '-'} | <i class="fa-solid fa-location-dot"></i> ${dir || '-'}</small>
                        </div>
                        <button class="ngc-btn-small" onclick="seleccionarClienteAgenda('${doc.id}', '${nombre.replace(/'/g, "\\'")}', '${tel}', '${dir}')" style="color: var(--ngc-neon); border-color: var(--ngc-neon);">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </div>
                `;
            }
        });

        if (count === 0) lista.innerHTML = '<div style="text-align: center; color: var(--ngc-text-faded);">No se encontraron clientes.</div>';
    } catch(e) {
        console.error("Error cargando agenda de Firebase:", e);
        lista.innerHTML = '<div style="text-align: center; color: var(--error-red);">Error al cargar agenda. Verifica tu conexión.</div>';
    }
}

function seleccionarClienteAgenda(id, nombre, tel, dir) {
    if (modoAgenda === 'whatsapp') {
        cerrarModalAgenda();
        if (tel && tel.trim() !== '') {
            procesarEnvioWsp(tel);
        } else {
            alert("Este contacto no tiene un número de teléfono guardado para enviarle el WhatsApp.");
        }
    } else {
        clienteActualId = id;
        clienteDesdeAgenda = true;
        document.getElementById('cliNombre').value = nombre;
        document.getElementById('cliTel').value = tel;
        document.getElementById('cliDireccion').value = dir;
        cerrarModalAgenda();
        mostrarToast("Cliente Seleccionado", "Datos cargados desde la agenda.");
    }
}

// --- BORRADORES EN FIREBASE ---
async function guardarBorradorFirebase() {
    if (!clienteDesdeAgenda) {
        alert("No puedes guardar un borrador en la nube para un cliente no agendado.");
        return;
    }
    
    if (listaAmbientes.length === 0) return alert("Debe cargar ambientes para guardar.");

    const payload = {
        userId: currentUserUid,
        clienteId: clienteActualId,
        clienteNombre: document.getElementById('cliNombre').value,
        fecha: new Date().toISOString(),
        listaAmbientes,
        circuitos,
        circuitoCS
    };

    const btn = event.currentTarget;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';

    try {
        await db.collection('borradores_potencia').add(payload);
        mostrarToast("Guardado Exitoso", "El borrador se guardó en la nube.");
    } catch(e) {
        alert("Error al guardar en la nube.");
    } finally {
        btn.innerHTML = oldHtml;
    }
}

async function abrirModalBorradores() {
    if(!clienteDesdeAgenda) {
        alert("Selecciona un cliente de la agenda para ver sus borradores de potencia.");
        return;
    }
    document.getElementById('modalBorradores').classList.remove('oculto');
    const lista = document.getElementById('listaBorradores');
    lista.innerHTML = '<div style="text-align: center; color: #e91e63;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando borradores...</div>';

    try {
        const snapshot = await db.collection('borradores_potencia')
            .where('userId', '==', currentUserUid)
            .where('clienteId', '==', clienteActualId)
            .get();
            
        let docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        docs.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
            
        lista.innerHTML = '';
        if (docs.length === 0) {
            lista.innerHTML = '<div style="text-align: center; color: var(--ngc-text-faded);">No hay borradores de potencia para este cliente.</div>';
            return;
        }

        docs.forEach(data => {
            const d = new Date(data.fecha);
            lista.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--ngc-privacy-border); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div>
                        <b style="color: var(--ngc-text-main); display: block;">${data.clienteNombre}</b>
                        <small style="color: var(--ngc-text-faded);"><i class="fa-regular fa-clock"></i> ${d.toLocaleDateString()} ${d.toLocaleTimeString()}</small>
                    </div>
                    <button class="ngc-btn-small" onclick='cargarBorradorPotencia(${JSON.stringify(data).replace(/'/g, "&#39;")})' style="color: #e91e63; border-color: #e91e63;">
                        <i class="fa-solid fa-download"></i> Abrir
                    </button>
                </div>
            `;
        });
    } catch (e) {
        lista.innerHTML = '<div style="text-align: center; color: var(--error-red);">Error al cargar borradores.</div>';
    }
}

function cerrarModalBorradores() {
    document.getElementById('modalBorradores').classList.add('oculto');
}

function cargarBorradorPotencia(data) {
    listaAmbientes = data.listaAmbientes || [];
    circuitos = data.circuitos || [];
    circuitoCS = data.circuitoCS || { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };
    
    cerrarModalBorradores();
    actualizarGestorCircuitos();
    calcularGradoYRenderizar();
    mostrarToast("Borrador Abierto", "Los datos se cargaron correctamente.");
}

// --- ENVIAR WHATSAPP (NUEVO MODAL) ---
function abrirModalWhatsApp() {
    if (listaAmbientes.length === 0) return alert("Debes cargar ambientes primero.");
    const telGuardado = document.getElementById('cliTel').value.trim();
    document.getElementById('modalWhatsApp').classList.remove('oculto');
    
    const btnWspGuardado = document.getElementById('btnWspGuardado');
    if(telGuardado) {
        btnWspGuardado.style.display = 'flex';
        btnWspGuardado.innerHTML = `<i class="fa-brands fa-whatsapp"></i> ENVIAR AL CLIENTE (${telGuardado})`;
        btnWspGuardado.onclick = () => procesarEnvioWsp(telGuardado);
    } else {
        btnWspGuardado.style.display = 'none';
    }
}

function cerrarModalWhatsApp() {
    document.getElementById('modalWhatsApp').classList.add('oculto');
}

function procesarEnvioWsp(numero) {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    const dpms = document.getElementById('ui-dpms').innerText;
    const grado = document.getElementById('ui-grado').innerText;
    const area = document.getElementById('ui-sla').innerText;
    
    let m = `*${profNombre.toUpperCase()}*\nProyecto: ${document.getElementById('cliNombre').value}\n\n`;
    m += `Se ha realizado el cálculo de Carga y Circuitos:\n`;
    m += `• Superficie Límite: ${area}\n`;
    m += `• Grado Electrificación: ${grado}\n`;
    m += `• DPMS Total: ${dpms}\n\n`;
    m += `*TOTAL AMBIENTES:* ${listaAmbientes.length}\n`;

    let tel = numero.replace(/\D/g, '');
    if (tel.length === 10) tel = "549" + tel;
    else if (!tel.startsWith("54")) tel = "549" + tel;
    
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(m)}`, '_blank');
    cerrarModalWhatsApp();
                                }

// --- LÓGICA DE POTENCIA (AEA) ---
function obtenerGradoElectrificacion(areaTotal) {
    if (areaTotal <= 60) return "MÍNIMO";
    if (areaTotal <= 130) return "MEDIO";
    if (areaTotal <= 200) return "ELEVADO";
    return "SUPERIOR";
}

function autoAjustarCircuitos(grado) {
    let requeridos = 2;
    if (grado === "MEDIO") requeridos = 3;
    if (grado === "ELEVADO") requeridos = 5;
    if (grado === "SUPERIOR") requeridos = 6;
    while(circuitos.length < requeridos) {
        let num = circuitos.length + 1;
        let tipo = (num % 2 === 0) ? 'TUG' : 'IUG'; 
        circuitos.push({ id: `C${num}`, tipo: tipo, dpms: tipo==='TUG'?2200:0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' });
    }
    actualizarGestorCircuitos();
}

function actualizarGestorCircuitos() {
    const container = document.getElementById('listaConfigCircuitos');
    if(!container) return;
    container.innerHTML = '';
    circuitos.forEach((c, index) => {
        container.innerHTML += `
            <div style="display: flex; gap: 10px; align-items: center;">
                <b style="color:var(--ngc-text-main); width: 30px;">${c.id}</b>
                <select class="native-select ngc-input" style="padding: 6px; font-size: 0.8rem;" onchange="cambiarTipoCircuito(${index}, this.value)">
                    <option value="IUG" ${c.tipo==='IUG'?'selected':''}>IUG</option>
                    <option value="TUG" ${c.tipo==='TUG'?'selected':''}>TUG</option>
                    <option value="TUE" ${c.tipo==='TUE'?'selected':''}>TUE</option>
                    <option value="ACU" ${c.tipo==='ACU'?'selected':''}>ACU</option>
                    <option value="MBTF" ${c.tipo==='MBTF'?'selected':''}>MBTF</option>
                </select>
                ${index >= 2 ? `<button onclick="eliminarCircuito(${index})" style="background:transparent; border:none; color:var(--error-red); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>`;
    });
    actualizarSelectoresEnFormulario();
}

function cambiarTipoCircuito(index, nuevoTipo) {
    circuitos[index].tipo = nuevoTipo;
    if(!circuitos[index].userEditedDpms) {
        if(nuevoTipo === 'TUG') circuitos[index].dpms = 2200;
        else if(nuevoTipo === 'TUE') circuitos[index].dpms = 3300;
        else circuitos[index].dpms = 0;
    }
    actualizarGestorCircuitos();
    renderTabla();
}

function agregarCircuitoManual() {
    let num = circuitos.length + 1;
    circuitos.push({ id: `C${num}`, tipo: 'ACU', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' });
    actualizarGestorCircuitos();
    renderTabla();
}

function eliminarCircuito(index) {
    if(index < 2) return;
    const circAEliminar = circuitos[index].id;
    listaAmbientes.forEach(amb => {
        if(amb.circIUG === circAEliminar) amb.circIUG = "";
        if(amb.circTUG === circAEliminar) amb.circTUG = "";
        if(amb.circESP === circAEliminar) amb.circESP = "";
    });
    circuitos.splice(index, 1);
    circuitos.forEach((c, i) => {
        let viejoId = c.id; let nuevoId = `C${i+1}`;
        if(viejoId !== nuevoId) {
            c.id = nuevoId;
            listaAmbientes.forEach(amb => {
                if(amb.circIUG === viejoId) amb.circIUG = nuevoId;
                if(amb.circTUG === viejoId) amb.circTUG = nuevoId;
                if(amb.circESP === viejoId) amb.circESP = nuevoId;
            });
        }
    });
    actualizarGestorCircuitos();
    renderTabla();
}

function actualizarSelectoresEnFormulario() {
    const selects = document.querySelectorAll('.dynamic-circ-select');
    selects.forEach(sel => {
        let valActual = sel.value;
        sel.innerHTML = '<option value="">-- Circ --</option>';
        circuitos.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.id}${c.tipo}</option>`; });
        sel.value = valActual; 
    });
}

function guardarAmbiente() {
    const tipo = document.getElementById('selAmbiente').value;
    const ancho = parseFloat(document.getElementById('inputAncho').value.replace(',', '.')) || 0;
    const largo = parseFloat(document.getElementById('inputLargo').value.replace(',', '.')) || 0;
    const bIUG = parseInt(document.getElementById('bocasIUG').value) || 0; const circIUG = document.getElementById('circuitoIUG').value;
    const bTUG = parseInt(document.getElementById('bocasTUG').value) || 0; const circTUG = document.getElementById('circuitoTUG').value;
    const bESP = parseInt(document.getElementById('bocasESP').value) || 0; const circESP = document.getElementById('circuitoESP').value;
    const descESP = document.getElementById('descESP').value.trim();

    if (!tipo) return alert("Seleccione el tipo de ambiente o carga.");
    if (!tipo.includes("Acondicionado") && !tipo.includes("Motor") && (ancho <= 0 || largo <= 0)) return alert("Ingrese medidas válidas.");
    
    let areaCalculada = ancho * largo;
    if (tipo.includes("Semi") || tipo.includes("Balcón") || tipo.includes("Exterior")) {
        areaCalculada = areaCalculada / 2;
    }

    const obj = {
        id: editandoId ? parseInt(editandoId) : Date.now(),
        tipo, ancho, largo, area: areaCalculada, bIUG, circIUG, bTUG, circTUG, bESP, circESP, descESP
    };

    if (editandoId) {
        const idx = listaAmbientes.findIndex(a => a.id === obj.id);
        if (idx !== -1) listaAmbientes[idx] = obj;
        cancelarEdicion();
    } else { listaAmbientes.push(obj); }

    document.getElementById('selAmbiente').value = "";
    document.getElementById('inputAncho').value = ""; document.getElementById('inputLargo').value = "";
    document.getElementById('bocasIUG').value = "0"; document.getElementById('circuitoIUG').value = "";
    document.getElementById('bocasTUG').value = "0"; document.getElementById('circuitoTUG').value = "";
    document.getElementById('bocasESP').value = "0"; document.getElementById('circuitoESP').value = ""; document.getElementById('descESP').value = "";
    
    calcularGradoYRenderizar();
}

function editarAmbiente(id) {
    const amb = listaAmbientes.find(a => a.id === id);
    if(!amb) return;
    editandoId = id;
    document.getElementById('titulo-form-ambiente').innerHTML = "<i class='fa-solid fa-pen'></i> Editando Ambiente";
    document.getElementById('btnGuardarAmbiente').innerHTML = "<i class='fa-solid fa-check'></i> Actualizar Ambiente";
    document.getElementById('btnCancelarEdicion').style.display = "flex";
    document.getElementById('selAmbiente').value = amb.tipo;
    document.getElementById('inputAncho').value = amb.ancho || ""; document.getElementById('inputLargo').value = amb.largo || "";
    document.getElementById('bocasIUG').value = amb.bIUG; document.getElementById('circuitoIUG').value = amb.circIUG;
    document.getElementById('bocasTUG').value = amb.bTUG; document.getElementById('circuitoTUG').value = amb.circTUG;
    document.getElementById('bocasESP').value = amb.bESP; document.getElementById('circuitoESP').value = amb.circESP;
    document.getElementById('descESP').value = amb.descESP;
    window.scrollTo(0, document.getElementById('step-trabajo').offsetTop);
}

function cancelarEdicion() {
    editandoId = null;
    document.getElementById('titulo-form-ambiente').innerHTML = "<i class='fa-solid fa-house-signal'></i> Carga de Ambientes";
    document.getElementById('btnGuardarAmbiente').innerHTML = "<i class='fa-solid fa-plus'></i> Agregar Ambiente";
    document.getElementById('btnCancelarEdicion').style.display = "none";
}

function borrarItem(id) { listaAmbientes = listaAmbientes.filter(i => i.id !== id); calcularGradoYRenderizar(); }

window.updC = function(id, field, value) {
    let c = (id === 'CS') ? circuitoCS : circuitos.find(x => x.id === id);
    if(c) {
        c[field] = value === "" ? "" : (parseFloat(value) || value);
        if(id !== 'CS' && field === 'dpms') c.userEditedDpms = true;
        
        // AUTO-CALCULO DE IZ SEGÚN AEA 90364-7-770
        if (field === 'seccionLN') {
            if (MAPA_IZ[value]) c['iz'] = MAPA_IZ[value];
        }
        renderTabla();
    }
}

function buildSelectHtml(id, field, currentVal, optionsList, validationColor) {
    let colorStyle = (currentVal !== "") ? `color: ${validationColor}; font-weight:bold;` : `color: inherit;`;
    let html = `<select class="circ-input" style="${colorStyle}" onchange="updC('${id}','${field}',this.value)">`;
    html += `<option value="">-</option>`;
    optionsList.forEach(opt => {
        let sel = (currentVal !== "" && currentVal == opt) ? "selected" : "";
        html += `<option value="${opt}" ${sel}>${opt}</option>`;
    });
    html += `</select>`;
    return html;
}

function calcularGradoYRenderizar() {
    let areaTotal = 0;
    listaAmbientes.forEach(i => { if(!i.tipo.includes("Acondicionado") && !i.tipo.includes("Motor")) areaTotal += i.area; });
    const gradoActual = obtenerGradoElectrificacion(areaTotal);
    autoAjustarCircuitos(gradoActual);
    document.getElementById('ui-sla').innerText = `${areaTotal.toFixed(2)} m²`;
    document.getElementById('ui-grado').innerText = gradoActual;
    renderTabla(areaTotal, gradoActual);
}

function renderTabla(areaTotal, gradoActual) {
    areaTotal = areaTotal || parseFloat(document.getElementById('ui-sla').innerText) || 0;
    gradoActual = gradoActual || document.getElementById('ui-grado').innerText;

    const thead = document.getElementById('cabeceraTabla');
    const tbody = document.getElementById('cuerpoTabla');
    const tfoot = document.getElementById('pieTabla');
    
    let todosLosCircuitos = [...circuitos, circuitoCS];
    let isLight = document.documentElement.getAttribute('data-theme') === 'light';
    let stickyBg = isLight ? "#f8f9fa" : "#1e1e1e";

    let ths = `<tr style="border-bottom: 1px solid var(--ngc-neon); color: var(--ngc-neon);">
                <th style="text-align:left; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:2; min-width: 80px;">Ambiente</th>
                <th style="min-width: 35px;">m²</th>`;
    todosLosCircuitos.forEach(c => {
        let name = c.id === 'CS' ? "C.S.<br><small>Tablero</small>" : `${c.id}<br><small>${c.tipo}</small>`;
        ths += `<th style="min-width: 52px;">${name}</th>`;
    });
    ths += `<th style="min-width: 25px;"></th><th style="min-width: 25px;"></th></tr>`;
    thead.innerHTML = ths;
    tbody.innerHTML = '';
    
    let totalesBocas = {};
    circuitos.forEach(c => totalesBocas[c.id] = 0);

    listaAmbientes.forEach(i => {
        let celdasCircuitos = "";
        circuitos.forEach(c => {
            let cant = 0; let desc = "";
            if (i.circIUG === c.id) cant += i.bIUG;
            if (i.circTUG === c.id) cant += i.bTUG;
            if (i.circESP === c.id) { cant += i.bESP; desc = i.descESP; }
            totalesBocas[c.id] += cant;
            let texto = cant > 0 ? cant : "-";
            if (desc && cant > 0) texto += `<br><small style="color:var(--ngc-text-faded);">${desc}</small>`;
            celdasCircuitos += `<td>${texto}</td>`;
        });
        
        celdasCircuitos += `<td>-</td>`;

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid var(--ngc-privacy-border);">
                <td style="text-align:left; padding:8px 5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">${i.tipo}</td>
                <td>${(i.area > 0 && !i.tipo.includes("Carga")) ? i.area.toFixed(2) : '-'}</td>
                ${celdasCircuitos}
                <td><button onclick="editarAmbiente(${i.id})" style="background:transparent; border:none; color:var(--ngc-neon); cursor:pointer;"><i class="fa-solid fa-pen"></i></button></td>
                <td><button onclick="borrarItem(${i.id})" style="background:transparent; border:none; color:var(--error-red); cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
    });

    let dpmsTotal = 0;
    circuitos.forEach(c => {
        if(!c.userEditedDpms && c.tipo === 'IUG') c.dpms = Math.ceil(totalesBocas[c.id] * 150 * 0.66);
        dpmsTotal += c.dpms;
    });
    let coef = (gradoActual==='SUPERIOR')?0.7:(gradoActual==='ELEVADO'?0.8:(gradoActual==='MEDIO'?0.9:1));
    circuitoCS.dpms = dpmsTotal * coef;
    document.getElementById('ui-dpms').innerText = circuitoCS.dpms.toFixed(2) + ' VA';
    
    const sumElegido = document.getElementById('selSuministro').value;
    const faseAlerta = document.getElementById('ui-fase-alerta');
    if(circuitoCS.dpms > 7000 && sumElegido === 'MONOFÁSICO') {
        faseAlerta.innerText = "⚠️ RECOMENDADO TRIFÁSICO"; faseAlerta.style.color = "var(--error-red)";
    } else if (circuitoCS.dpms <= 7000 && sumElegido === 'TRIFÁSICO') {
        faseAlerta.innerText = "✓ EXCEDE REQ."; faseAlerta.style.color = "var(--success-green)";
    } else {
        faseAlerta.innerText = "✓ CUMPLE AEA"; faseAlerta.style.color = "var(--ngc-warning)";
    }

    let tfootStr = ``;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;"><b>BOCAS T.</b></td>`;
    circuitos.forEach(c => {
        let b = totalesBocas[c.id];
        let color = b > 15 ? 'var(--error-red)' : 'var(--ngc-warning)';
        tfootStr += `<td style="color:${color}; font-weight:bold;">${b}</td>`;
    });
    tfootStr += `<td>-</td><td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;"><b>DPMS (VA)</b></td>`;
    circuitos.forEach(c => {
        tfootStr += `<td><input type="number" class="circ-input" style="color:var(--success-green)" value="${c.dpms}" onchange="updC('${c.id}','dpms',this.value)"></td>`;
    });
    tfootStr += `<td style="color:var(--ngc-warning); font-weight:bold; font-size:0.75rem;">${circuitoCS.dpms.toFixed(0)}</td><td colspan="2"></td></tr>`;

    const evalVerdeRojo = (condicion) => condicion ? 'var(--success-green)' : 'var(--error-red)';

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Tensión (V)</td>`;
    todosLosCircuitos.forEach(c => {
        let col = c.tension !== "" ? 'var(--success-green)' : 'inherit';
        tfootStr += `<td>${buildSelectHtml(c.id, 'tension', c.tension, [220, 380], col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Ib (A)</td>`;
    todosLosCircuitos.forEach(c => {
        let ib = "-";
        if(c.tension !== "") {
            let p = parseFloat(c.dpms);
            ib = (c.tension == 380) ? (p / (1.732 * 380)) : (p / c.tension);
            c._ibCalc = ib; 
            ib = ib.toFixed(2);
        }
        tfootStr += `<td style="color:var(--ngc-text-faded); font-size:0.7rem;">${ib}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Sección L;N</td>`;
    todosLosCircuitos.forEach(c => {
        let minL = (c.tipo === 'IUG' || c.tipo === 'MBTF') ? 1.5 : (c.id === 'CS' ? 4.0 : 2.5);
        let col = evalVerdeRojo(parseFloat(c.seccionLN) >= minL);
        tfootStr += `<td>${buildSelectHtml(c.id, 'seccionLN', c.seccionLN, [1.5, 2.5, 4, 6, 10, 16], col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Sección PE</td>`;
    todosLosCircuitos.forEach(c => {
        let col = evalVerdeRojo(c.seccionLN !== "" && parseFloat(c.seccionPE) >= parseFloat(c.seccionLN));
        tfootStr += `<td>${buildSelectHtml(c.id, 'seccionPE', c.seccionPE, [1.5, 2.5, 4, 6, 10, 16], col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Iz (A)</td>`;
    todosLosCircuitos.forEach(c => {
        let col = evalVerdeRojo(c._ibCalc && parseFloat(c.iz) >= c._ibCalc);
        let valStr = c.iz === "" ? "" : c.iz;
        let style = c.iz !== "" ? `color: ${col}; font-weight:bold;` : 'color: inherit;';
        tfootStr += `<td><input type="number" class="circ-input" style="${style}" placeholder="-" value="${valStr}" onchange="updC('${c.id}','iz',this.value)"></td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">In (A)</td>`;
    todosLosCircuitos.forEach(c => {
        let ib = c._ibCalc || 0;
        let iz = parseFloat(c.iz) || 0;
        let pIn = parseFloat(c.in);
        let cumpleIn = (pIn >= ib && pIn <= iz);
        let col = evalVerdeRojo(cumpleIn);
        tfootStr += `<td>${buildSelectHtml(c.id, 'in', c.in, [2, 4, 6, 10, 15, 16, 20, 25, 32, 40, 50, 63], col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfoot.innerHTML = tfootStr;
    sincronizarVistaPreviaPDF(areaTotal, gradoActual, circuitoCS.dpms, sumElegido, totalesBocas, todosLosCircuitos);
}

// --- CONFIGURACIÓN DE PDF Y VISTA PREVIA ---
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

 function sincronizarVistaPreviaPDF(areaTotal, grado, dpmsPonderado, suministro, totalesBocas, todosArr) {
    actualizarPDFHeaders();
    
    const cliNombre = document.getElementById('cliNombre').value || 'Sin Nombre';
    document.getElementById('pdf-cliente').innerText = cliNombre;
    document.getElementById('pdf-direccion').innerText = document.getElementById('cliDireccion').value || '-';
    document.getElementById('pdf-fecha').innerText = new Date().toLocaleDateString('es-AR');

    const thead = document.getElementById('pdf-thead');
    const tbody = document.getElementById('pdf-tbody');
    const tfoot = document.getElementById('pdf-tfoot');
    
    let ths = `<tr><th style="text-align: left;">Ambiente</th><th>m²</th>`;
    todosArr.forEach(c => ths += `<th>${c.id}${c.tipo.substring(0,4)}</th>`);
    ths += `</tr>`;
    thead.innerHTML = ths;
    tbody.innerHTML = '';
    
    listaAmbientes.forEach(i => {
        let celdas = "";
        circuitos.forEach(c => {
            let cant = 0; let desc = "";
            if (i.circIUG === c.id) cant += i.bIUG;
            if (i.circTUG === c.id) cant += i.bTUG;
            if (i.circESP === c.id) { cant += i.bESP; desc = i.descESP; }
            let txt = cant > 0 ? cant : "-";
            if (desc && cant > 0) txt += `<br><span style="font-size:7px;">${desc}</span>`;
            celdas += `<td>${txt}</td>`;
        });
        celdas += `<td>-</td>`; 
        tbody.innerHTML += `<tr><td style="text-align: left;">${i.tipo}</td><td>${(i.area > 0 && !i.tipo.includes("Carga")) ? i.area.toFixed(2) : '-'}</td>${celdas}</tr>`;
    });

    let tfootStr = ``;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">BOCAS</td>`;
    circuitos.forEach(c => tfootStr += `<td>${totalesBocas[c.id]}</td>`); tfootStr += `<td>-</td></tr>`;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">DPMS (VA)</td>`;
    todosArr.forEach(c => tfootStr += `<td>${c.id==='CS' ? c.dpms.toFixed(0) : c.dpms}</td>`); tfootStr += `</tr>`;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">Tensión (V)</td>`;
    todosArr.forEach(c => tfootStr += `<td>${c.tension || '-'}</td>`); tfootStr += `</tr>`;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">Ib (A)</td>`;
    todosArr.forEach(c => { 
        let ib = "-";
        if(c.tension) {
            ib = (c.tension == 380) ? (c.dpms / (1.732 * 380)) : (c.dpms / c.tension); 
            ib = ib.toFixed(1);
        }
        tfootStr += `<td>${ib}</td>`; 
    }); tfootStr += `</tr>`;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">Secc L;N / PE</td>`;
    todosArr.forEach(c => tfootStr += `<td>${c.seccionLN || '-'}/${c.seccionPE || '-'}</td>`); tfootStr += `</tr>`;
    tfootStr += `<tr><td colspan="2" style="text-align: right; padding: 5px;">Iz / In (A)</td>`;
    todosArr.forEach(c => tfootStr += `<td>${c.iz || '-'}/${c.in || '-'}</td>`); tfootStr += `</tr>`;

    tfoot.innerHTML = tfootStr;
    document.getElementById('pdf-sla-val').innerText = `${areaTotal.toFixed(2)} m²`;
    document.getElementById('pdf-grado-val').innerText = grado;
    document.getElementById('pdf-dpms-val').innerText = `${dpmsPonderado.toFixed(2)} VA`;
    document.getElementById('pdf-sum-val').innerText = suministro;
}

// --- GENERACIÓN PDF E IMAGEN ---
async function generarPDF() {
    if (listaAmbientes.length === 0) return alert("Debe cargar ambientes para generar el PDF.");
    const element = document.getElementById('plantilla-pdf');
    const originalDisplay = getComputedStyle(element).display;
    if (originalDisplay === 'none') element.style.display = 'block';

    window.scrollTo(0, 0); 
    const cliNombre = document.getElementById('cliNombre').value.replace(/ /g, '_') || 'Proyecto';
    
    const opt = {
        margin:       0,
        filename:     `${cliNombre}_Planilla_Circuitos.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    const btn = document.getElementById('btnGenerarPDF');
    const btnHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Generando...';
    
    try { await html2pdf().set(opt).from(element).save(); } 
    catch (error) { console.error(error); alert("Hubo un error al generar el PDF."); } 
    finally { 
        btn.innerHTML = btnHtml;
        if (window.innerWidth < 992) element.style.display = 'none'; 
    }
}

async function tomarCaptura() { 
    const zona = document.getElementById('zonaCaptura'); 
    
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor = isLightMode ? "#ffffff" : "#1e1e1e";
    const oldColor = zona.style.color;
    
    zona.style.color = isLightMode ? "#1a1a1a" : "#ffffff";
    const scrollY = window.scrollY; window.scrollTo(0, 0);

    const canvas = await html2canvas(zona, { backgroundColor: bgColor, scale: 2, useCORS: true, scrollY: 0 }); 
    window.scrollTo(0, scrollY);
    
    const link = document.createElement('a'); 
    const n = document.getElementById('cliNombre').value.split(' ')[0] || 'Proyecto';
    link.download = `Carga_Circuitos_${n}.png`; link.href = canvas.toDataURL(); link.click(); 
    
    zona.style.color = oldColor; 
}

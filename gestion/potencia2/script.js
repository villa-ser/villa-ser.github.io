// ==========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ==========================================
let db = null;
let uidSeguro = null;

let clienteDesdeAgenda = false;
let permiteGuardarNube = true;
let nombreBorradorActual = null; 
let telefonoClienteActual = "";

// ==========================================
// CONTROLADOR DE STEPPERS PARA BOCAS
// ==========================================
function stepBocas(id, val) {
    const el = document.getElementById(id);
    if(!el) return;
    
    // Obtener valor actual, sumar/restar y limitar a un mínimo de 0
    let newValue = parseInt(el.value || 0) + val;
    el.value = Math.max(0, newValue);
}

function stepBocasDinamico(btn, val) {
    const input = btn.parentElement.querySelector('input');
    let newValue = parseInt(input.value || 0) + val;
    input.value = Math.max(0, newValue);
}

function agregarBocaESP() {
    const container = document.getElementById('contenedor-esps');
    const newItem = document.createElement('div');
    newItem.className = 'esp-item';
    newItem.style.position = 'relative';
    newItem.style.marginTop = '10px';
    newItem.style.paddingTop = '10px';
    newItem.style.borderTop = '1px dashed rgba(var(--ngc-neon-rgb), 0.3)';
    
    // Agrega el botón X rojo (eliminar)
    newItem.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position:absolute; top: 12px; right: -5px; background: transparent; border: none; color: var(--error-red); font-size: 0.8rem; cursor: pointer; z-index: 10;"><i class="fa-solid fa-xmark"></i></button>
        <div class="corp-stepper" style="height: 38px; border-radius: 6px; display: flex; width: 100%; box-sizing: border-box;">
            <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, -1)">-</button>
            <input type="number" class="corp-input-step bocas-esp-input" value="0" min="0" readonly style="font-size: 0.95rem; flex: 1; width: 100%; text-align: center; border: none; background: transparent; color: inherit; padding: 0;">
            <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, 1)">+</button>
        </div>
        <details class="corp-custom-select det-circuito-esp" style="margin-top:5px;">
            <summary class="corp-input sum-circuito-esp" style="font-size:0.75rem; padding: 6px;">-- Circ --</summary>
            <div class="corp-select-list list-circuito-esp"></div>
        </details>
        <input type="hidden" class="circuito-esp-input" value="">
        <input type="text" class="corp-input desc-esp-input" placeholder="Ej: Calefactor" style="margin-top:5px; font-size:0.75rem; padding: 6px; text-align: center;">
    `;
    container.appendChild(newItem);
    poblarAcordeonCircuitoElement(newItem);
}

function poblarAcordeonCircuitoElement(parentItem) {
    const hiddenInput = parentItem.querySelector('.circuito-esp-input');
    const summary = parentItem.querySelector('.sum-circuito-esp');
    const list = parentItem.querySelector('.list-circuito-esp');
    const details = parentItem.querySelector('.det-circuito-esp');
    if(!list || !hiddenInput) return;
    
    let valActual = hiddenInput.value;
    list.innerHTML = '';
    
    const optVacia = document.createElement('div');
    optVacia.className = 'corp-select-option';
    optVacia.innerText = '-- Circ --';
    optVacia.onclick = () => { hiddenInput.value = ''; summary.innerText = '-- Circ --'; details.removeAttribute('open'); };
    list.appendChild(optVacia);

    let existe = false;
    circuitos.forEach(c => {
        if (c.id === valActual) existe = true;
        const opt = document.createElement('div');
        opt.className = 'corp-select-option';
        opt.innerText = `${c.id} (${c.tipo})`;
        opt.onclick = () => { hiddenInput.value = c.id; summary.innerText = `${c.id} (${c.tipo})`; details.removeAttribute('open'); };
        list.appendChild(opt);
    });

    if (valActual && !existe) { hiddenInput.value = ''; summary.innerText = '-- Circ --'; }
}

// MAPA DE CÁLCULO AEA
const MAPA_IZ = { "1.5": 15, "2.5": 21, "4": 28, "6": 36, "10": 50, "16": 66 };

// VARIABLES DE POTENCIA
let listaAmbientes = [];
let editandoId = null;
let circuitos = [
    { id: 'C1', tipo: 'IUG', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' },
    { id: 'C2', tipo: 'TUG', dpms: 2200, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' }
];
let circuitoCS = { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };

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
    generarMenuInferior();
    actualizarPDFHeaders();
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
// INTEGRACIÓN AGENDA Y FLUJO DE CLIENTE
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

function marcarClienteManual() {
    clienteDesdeAgenda = false;
    permiteGuardarNube = false;
}

function iniciarCalculo() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if(!nombre) { 
        if(typeof mostrarAlertaCorp === 'function') {
            mostrarAlertaCorp("Datos incompletos", "Por favor, ingresá al menos el Nombre del Cliente.");
        } else {
            alert("Por favor, ingresá el nombre.");
        }
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
    actualizarGestorCircuitos();
    calcularGradoYRenderizar();
}

function opcionBuscarAgenda() { 
    document.getElementById('modalAgendarCliente').classList.add('oculto'); 
    if(typeof abrirModalAgendaGlobal === 'function') abrirModalAgendaGlobal(); 
}

function accionAgendarCliente() {
    const nombre = encodeURIComponent(document.getElementById('cliNombre').value.trim());
    const dir = encodeURIComponent(document.getElementById('cliDireccion').value.trim());
    window.location.href = `../agenda/index.html?nombre=${nombre}&dir=${dir}`;
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

function ejecutarNuevoCalculo() {
    if (typeof cerrarModalConfirmarNuevoGlobal === 'function') cerrarModalConfirmarNuevoGlobal(); 
    
    document.getElementById('cliNombre').value = '';
    document.getElementById('cliDireccion').value = '';
    document.getElementById('cliProyecto').value = '';
    
    listaAmbientes = [];
    circuitos = [
        { id: 'C1', tipo: 'IUG', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' },
        { id: 'C2', tipo: 'TUG', dpms: 2200, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' }
    ];
    circuitoCS = { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };
    
    clienteDesdeAgenda = false;
    permiteGuardarNube = true;
    nombreBorradorActual = null;
    telefonoClienteActual = "";
    
    document.getElementById('step-trabajo').classList.add('oculto');
    document.getElementById('step-cliente').classList.remove('oculto');
    
    actualizarGestorCircuitos();
    calcularGradoYRenderizar();
}

// ==========================================
// MODALES DE ALERTA COMPARTIDOS
// ==========================================
function mostrarAlertaCorp(titulo, mensaje) {
    document.getElementById('modalAlertaTitulo').innerText = titulo;
    document.getElementById('modalAlertaMensaje').innerText = mensaje;
    document.getElementById('modalAlertaCorp').classList.remove('oculto');
}

function cerrarModalAlertaCorp() {
    document.getElementById('modalAlertaCorp').classList.add('oculto');
}

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

// ==========================================
// LÓGICA DE POTENCIA, AMBIENTES Y AEA
// ==========================================
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
        const opciones = ['IUG', 'TUG', 'TUE', 'ACU', 'MBTF'].map(t => 
            `<div class="corp-select-option" onclick="document.getElementById('detGestor_${index}').removeAttribute('open'); cambiarTipoCircuito(${index}, '${t}')">${t}</div>`
        ).join('');

        container.innerHTML += `
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;"> 
                <b style="color:var(--ngc-text-main); width: 30px;">${c.id}</b> 
                <details id="detGestor_${index}" class="corp-custom-select" style="flex:1;">
                    <summary class="corp-input" style="padding: 6px; font-size: 0.8rem; min-height: 32px;">${c.tipo}</summary>
                    <div class="corp-select-list">${opciones}</div>
                </details>
                ${index >= 2 ? `<button onclick="eliminarCircuito(${index})" style="background:transparent; border:none; color:var(--error-red); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : '<div style="width:14px;"></div>'} 
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
    const ids = ['IUG', 'TUG'];
    ids.forEach(sufijo => {
        const hiddenInput = document.getElementById('circuito' + sufijo);
        const summary = document.getElementById('sumCircuito' + sufijo);
        const list = document.getElementById('listCircuito' + sufijo);
        const details = document.getElementById('detCircuito' + sufijo);

        if(!list || !hiddenInput) return;
        let valActual = hiddenInput.value;
        list.innerHTML = '';
        
        const optVacia = document.createElement('div');
        optVacia.className = 'corp-select-option';
        optVacia.innerText = '-- Circ --';
        optVacia.onclick = () => { hiddenInput.value = ''; summary.innerText = '-- Circ --'; details.removeAttribute('open'); };
        list.appendChild(optVacia);

        let existe = false;
        circuitos.forEach(c => {
            if (c.id === valActual) existe = true;
            const opt = document.createElement('div');
            opt.className = 'corp-select-option';
            opt.innerText = `${c.id} (${c.tipo})`;
            opt.onclick = () => { hiddenInput.value = c.id; summary.innerText = `${c.id} (${c.tipo})`; details.removeAttribute('open'); };
            list.appendChild(opt);
        });

        if (valActual && !existe) { hiddenInput.value = ''; summary.innerText = '-- Circ --'; }
    });
    
    // Actualizar todos los selectores ESP dinámicos
    document.querySelectorAll('.esp-item').forEach(item => poblarAcordeonCircuitoElement(item));
}

function guardarAmbiente() {
    const tipo = document.getElementById('selAmbiente').value;
    const ancho = parseFloat(document.getElementById('inputAncho').value.replace(',', '.')) || 0;
    const largo = parseFloat(document.getElementById('inputLargo').value.replace(',', '.')) || 0;
    const bIUG = parseInt(document.getElementById('bocasIUG').value) || 0; const circIUG = document.getElementById('circuitoIUG').value;
    const bTUG = parseInt(document.getElementById('bocasTUG').value) || 0; const circTUG = document.getElementById('circuitoTUG').value;
    
    // Recopilar múltiples ESP
    let esps = [];
    document.querySelectorAll('.esp-item').forEach(item => {
        const b = parseInt(item.querySelector('.bocas-esp-input').value) || 0;
        const c = item.querySelector('.circuito-esp-input').value;
        const d = item.querySelector('.desc-esp-input').value.trim();
        if (b > 0 && c) esps.push({ bocas: b, circ: c, desc: d });
    });

    // Compatibilidad con archivos viejos guardados en Firebase
    let bESP = 0, circESP = "", descESP = "";
    if (esps.length > 0) { bESP = esps[0].bocas; circESP = esps[0].circ; descESP = esps[0].desc; }

    if (!tipo) return alert("Seleccione el tipo de ambiente o carga.");
    if (!tipo.includes("Acondicionado") && !tipo.includes("Motor") && (ancho <= 0 || largo <= 0)) return alert("Ingrese medidas válidas.");
    
    let areaCalculada = ancho * largo;
    if (tipo.includes("Semi") || tipo.includes("Balcón") || tipo.includes("Exterior")) areaCalculada = areaCalculada / 2;

    const obj = {
        id: editandoId ? parseInt(editandoId) : Date.now(),
        tipo, ancho, largo, area: areaCalculada, bIUG, circIUG, bTUG, circTUG, 
        bESP, circESP, descESP, esps 
    };

    if (editandoId) {
        const idx = listaAmbientes.findIndex(a => a.id === obj.id);
        if (idx !== -1) listaAmbientes[idx] = obj;
        cancelarEdicion();
    } else { listaAmbientes.push(obj); }

    document.getElementById('selAmbiente').value = ""; document.getElementById('sumAmbiente').innerText = "-- Seleccione Ambiente --";
    document.getElementById('inputAncho').value = ""; document.getElementById('inputLargo').value = "";
    document.getElementById('bocasIUG').value = "0"; document.getElementById('circuitoIUG').value = ""; document.getElementById('sumCircuitoIUG').innerText = "-- Circ --";
    document.getElementById('bocasTUG').value = "0"; document.getElementById('circuitoTUG').value = ""; document.getElementById('sumCircuitoTUG').innerText = "-- Circ --";
    
    // Restablecer ESP dinámico
    document.getElementById('contenedor-esps').innerHTML = `
        <div class="esp-item" style="position: relative;">
            <div class="corp-stepper" style="height: 38px; border-radius: 6px; display: flex; width: 100%; box-sizing: border-box;">
                <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, -1)">-</button>
                <input type="number" class="corp-input-step bocas-esp-input" value="0" min="0" readonly style="font-size: 0.95rem; flex: 1; width: 100%; text-align: center; border: none; background: transparent; color: inherit; padding: 0;">
                <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, 1)">+</button>
            </div>
            <details class="corp-custom-select det-circuito-esp" style="margin-top:5px;">
                <summary class="corp-input sum-circuito-esp" style="font-size:0.75rem; padding: 6px;">-- Circ --</summary>
                <div class="corp-select-list list-circuito-esp"></div>
            </details>
            <input type="hidden" class="circuito-esp-input" value="">
            <input type="text" class="corp-input desc-esp-input" placeholder="Ej: AA" style="margin-top:5px; font-size:0.75rem; padding: 6px; text-align: center;">
        </div>`;
    actualizarSelectoresEnFormulario();
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
    document.getElementById('sumAmbiente').innerText = amb.tipo || "-- Seleccione Ambiente --";
    document.getElementById('inputAncho').value = amb.ancho || ""; 
    document.getElementById('inputLargo').value = amb.largo || "";
    
    document.getElementById('bocasIUG').value = amb.bIUG; document.getElementById('circuitoIUG').value = amb.circIUG;
    const cIUG = circuitos.find(c => c.id === amb.circIUG);
    document.getElementById('sumCircuitoIUG').innerText = cIUG ? `${cIUG.id} (${cIUG.tipo})` : "-- Circ --";
    
    document.getElementById('bocasTUG').value = amb.bTUG; document.getElementById('circuitoTUG').value = amb.circTUG;
    const cTUG = circuitos.find(c => c.id === amb.circTUG);
    document.getElementById('sumCircuitoTUG').innerText = cTUG ? `${cTUG.id} (${cTUG.tipo})` : "-- Circ --";
    
    // Cargar ESPs dinámicos
    const contenedorEsps = document.getElementById('contenedor-esps');
    contenedorEsps.innerHTML = '';
    
    let espsToLoad = amb.esps && amb.esps.length > 0 ? amb.esps : [{ bocas: amb.bESP || 0, circ: amb.circESP || '', desc: amb.descESP || '' }];
    
    espsToLoad.forEach((esp, idx) => {
        const newItem = document.createElement('div');
        newItem.className = 'esp-item';
        newItem.style.position = 'relative';
        if(idx > 0) {
            newItem.style.marginTop = '10px'; newItem.style.paddingTop = '10px'; newItem.style.borderTop = '1px dashed rgba(var(--ngc-neon-rgb), 0.3)';
        }
        
        const btnX = idx > 0 ? `<button onclick="this.parentElement.remove()" style="position:absolute; top: 12px; right: -5px; background: transparent; border: none; color: var(--error-red); font-size: 0.8rem; cursor: pointer; z-index: 10;"><i class="fa-solid fa-xmark"></i></button>` : '';
        
        newItem.innerHTML = `
            ${btnX}
            <div class="corp-stepper" style="height: 38px; border-radius: 6px; display: flex; width: 100%; box-sizing: border-box;">
                <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, -1)">-</button>
                <input type="number" class="corp-input-step bocas-esp-input" value="${esp.bocas}" min="0" readonly style="font-size: 0.95rem; flex: 1; width: 100%; text-align: center; border: none; background: transparent; color: inherit; padding: 0;">
                <button class="btn-step" style="width: 35px; font-size: 1.1rem; color: var(--ngc-warning); flex-shrink: 0;" onclick="stepBocasDinamico(this, 1)">+</button>
            </div>
            <details class="corp-custom-select det-circuito-esp" style="margin-top:5px;">
                <summary class="corp-input sum-circuito-esp" style="font-size:0.75rem; padding: 6px;">-- Circ --</summary>
                <div class="corp-select-list list-circuito-esp"></div>
            </details>
            <input type="hidden" class="circuito-esp-input" value="${esp.circ}">
            <input type="text" class="corp-input desc-esp-input" value="${esp.desc}" placeholder="Ej: AA" style="margin-top:5px; font-size:0.75rem; padding: 6px; text-align: center;">
        `;
        contenedorEsps.appendChild(newItem);
    });
    
    actualizarSelectoresEnFormulario();
    window.scrollTo(0, document.getElementById('step-trabajo').offsetTop);
        }


function cancelarEdicion() {
    editandoId = null;
    document.getElementById('titulo-form-ambiente').innerHTML = "<i class='fa-solid fa-house-signal corp-accent-color'></i> Carga de Ambientes";
    document.getElementById('btnGuardarAmbiente').innerHTML = "<i class='fa-solid fa-plus'></i> Agregar Ambiente";
    document.getElementById('btnCancelarEdicion').style.display = "none";
}

function borrarItem(id) { listaAmbientes = listaAmbientes.filter(i => i.id !== id); calcularGradoYRenderizar(); }

// Actualizador Principal
window.updC = function(id, field, value) {
    let c = (id === 'CS') ? circuitoCS : circuitos.find(x => x.id === id);
    if(c) {
        c[field] = value === "" ? "" : (parseFloat(value) || value);
        if(id !== 'CS' && field === 'dpms') c.userEditedDpms = true;
        if (field === 'seccionLN') {
            if (MAPA_IZ[value]) c['iz'] = MAPA_IZ[value];
        }
        renderTabla();
    }
}

// ==========================================
// NUEVO MOTOR MODAL PARA TABLAS (REEMPLAZA SELECTS NATIVOS)
// ==========================================
let contextoSeleccionActual = null;

function abrirModalTabla(idCircuito, campo, valorActual) {
    contextoSeleccionActual = { id: idCircuito, campo: campo };
    let titulo = 'Seleccionar';
    let opciones = [];
    let sufijo = '';

    if(campo === 'tension') {
        titulo = 'Seleccionar Tensión';
        opciones = [220, 380];
    } else if(campo === 'seccionLN') {
        titulo = 'Selección L;N';
        opciones = [1.5, 2.5, 4, 6, 10, 16];
        sufijo = ' mm²';
    } else if(campo === 'seccionPE') {
        titulo = 'Selección PE';
        opciones = [1.5, 2.5, 4, 6, 10, 16];
        sufijo = ' mm²';
    } else if(campo === 'in') {
        titulo = 'Seleccionar In (A)';
        opciones = [2, 4, 6, 10, 15, 16, 20, 25, 32, 40, 50, 63];
        sufijo = ' A';
    }

    document.getElementById('tituloModalSeleccion').innerText = titulo;
    dibujarOpcionesEnModal(opciones, valorActual, sufijo);
    document.getElementById('modalSeleccionTabla').classList.remove('oculto');
}

function dibujarOpcionesEnModal(arrayOpciones, valorActual, sufijo) {
    const contenedor = document.getElementById('listaOpcionesModal');
    contenedor.innerHTML = '';
    
    arrayOpciones.forEach(opcion => {
        const esSeleccionado = (opcion.toString() === valorActual.toString());
        const div = document.createElement('div');
        div.className = 'corp-select-option';
        div.style.borderBottom = '1px solid rgba(150, 150, 150, 0.1)';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.cursor = 'pointer';
        div.style.padding = '12px 15px';
        
        if (esSeleccionado) {
            div.style.color = 'var(--ngc-neon)';
            div.style.fontWeight = 'bold';
        }
        
        div.innerHTML = `<span>${opcion}${sufijo}</span> ${esSeleccionado ? '<i class="fa-solid fa-check"></i>' : ''}`;
        div.onclick = () => aplicarSeleccionDesdeModal(opcion);
        contenedor.appendChild(div);
    });
    
    // Opción para vaciar
    const divVacio = document.createElement('div');
    divVacio.className = 'corp-select-option';
    divVacio.style.borderBottom = '1px solid rgba(150, 150, 150, 0.1)';
    divVacio.style.padding = '12px 15px';
    divVacio.style.cursor = 'pointer';
    divVacio.style.color = 'var(--error-red)';
    divVacio.innerHTML = `<span>- Vaciar Selección -</span>`;
    divVacio.onclick = () => aplicarSeleccionDesdeModal('');
    contenedor.appendChild(divVacio);
}

function aplicarSeleccionDesdeModal(valorSeleccionado) {
    if (!contextoSeleccionActual) return;
    const { id, campo } = contextoSeleccionActual;
    window.updC(id, campo, valorSeleccionado);
    cerrarModalSeleccionTabla();
}

function cerrarModalSeleccionTabla() {
    document.getElementById('modalSeleccionTabla').classList.add('oculto');
    contextoSeleccionActual = null;
}

function buildButtonHtml(id, field, currentVal, validationColor) {
    let colorStyle = (currentVal !== "") ? `color: ${validationColor}; font-weight:bold;` : `color: inherit;`;
    let displayVal = currentVal !== "" ? currentVal : '-';
    return `<button class="circ-input" style="${colorStyle} padding: 4px 6px; font-size: 0.8rem; min-height: 28px; display: flex; justify-content: space-between; align-items: center;" onclick="abrirModalTabla('${id}', '${field}', '${currentVal}')">
        <span>${displayVal}</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.6rem;"></i>
    </button>`;
}

// ==========================================
// RENDERIZADO DE TABLA
// ==========================================
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
            let cant = 0; let descArr = [];
            if (i.circIUG === c.id) cant += i.bIUG;
            if (i.circTUG === c.id) cant += i.bTUG;
            
            // Lógica Múltiples ESP
            if (i.esps && i.esps.length > 0) {
                i.esps.forEach(esp => {
                    if (esp.circ === c.id) {
                        cant += esp.bocas;
                        if (esp.desc) descArr.push(esp.desc);
                    }
                });
            } else if (i.circESP === c.id) { // Soporte a archivos/borradores viejos
                cant += i.bESP;
                if (i.descESP) descArr.push(i.descESP);
            }
            
            let desc = descArr.join(', ');
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
        tfootStr += `<td><input type="number" class="circ-input" style="color:var(--success-green); padding: 2px; width: 45px; margin: 0 auto; display: block; text-align: center;" value="${c.dpms}" onchange="updC('${c.id}','dpms',this.value)"></td>`;
    });
    tfootStr += `<td style="color:var(--ngc-warning); font-weight:bold; font-size:0.75rem;">${circuitoCS.dpms.toFixed(0)}</td><td colspan="2"></td></tr>`;

    const evalVerdeRojo = (condicion) => condicion ? 'var(--success-green)' : 'var(--error-red)';

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Tensión (V)</td>`;
    todosLosCircuitos.forEach(c => {
        let col = c.tension !== "" ? 'var(--success-green)' : 'inherit';
        tfootStr += `<td>${buildButtonHtml(c.id, 'tension', c.tension, col)}</td>`;
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
        tfootStr += `<td>${buildButtonHtml(c.id, 'seccionLN', c.seccionLN, col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Sección PE</td>`;
    todosLosCircuitos.forEach(c => {
        let col = evalVerdeRojo(c.seccionLN !== "" && parseFloat(c.seccionPE) >= parseFloat(c.seccionLN));
        tfootStr += `<td>${buildButtonHtml(c.id, 'seccionPE', c.seccionPE, col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">Iz (A)</td>`;
    todosLosCircuitos.forEach(c => {
        let col = evalVerdeRojo(c._ibCalc && parseFloat(c.iz) >= c._ibCalc);
        let valStr = c.iz === "" ? "" : c.iz;
        let style = c.iz !== "" ? `color: ${col}; font-weight:bold;` : 'color: inherit;';
        tfootStr += `<td><input type="number" class="circ-input" style="${style} padding: 2px; width: 45px; margin: 0 auto; display: block; text-align: center;" placeholder="-" value="${valStr}" onchange="updC('${c.id}','iz',this.value)"></td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfootStr += `<tr><td colspan="2" style="text-align:right; padding:5px; position: sticky; left:0; background:${stickyBg}; z-index:1;">In (A)</td>`;
    todosLosCircuitos.forEach(c => {
        let ib = c._ibCalc || 0;
        let iz = parseFloat(c.iz) || 0;
        let pIn = parseFloat(c.in);
        let cumpleIn = (pIn >= ib && pIn <= iz);
        let col = evalVerdeRojo(cumpleIn);
        tfootStr += `<td>${buildButtonHtml(c.id, 'in', c.in, col)}</td>`;
    });
    tfootStr += `<td colspan="2"></td></tr>`;

    tfoot.innerHTML = tfootStr;
    sincronizarVistaPreviaPDF(areaTotal, gradoActual, circuitoCS.dpms, sumElegido, totalesBocas, todosLosCircuitos);
   }
                                

// ==========================================
// VISTA PREVIA Y PDF
// ==========================================
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
    document.getElementById('pdf-dir').innerText = document.getElementById('cliDireccion').value || '-';
    document.getElementById('pdf-proyecto').innerText = document.getElementById('cliProyecto').value || '-';
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
            let cant = 0; let descArr = [];
            if (i.circIUG === c.id) cant += i.bIUG;
            if (i.circTUG === c.id) cant += i.bTUG;
            
            if (i.esps && i.esps.length > 0) {
                i.esps.forEach(esp => {
                    if (esp.circ === c.id) { cant += esp.bocas; if (esp.desc) descArr.push(esp.desc); }
                });
            } else if (i.circESP === c.id) {
                cant += i.bESP; if (i.descESP) descArr.push(i.descESP);
            }
            
            let desc = descArr.join(', ');
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
                           

// ==========================================
// CONTROL DEL MENÚ AGRUPADOR "ACCIONES"
// ==========================================
function toggleAccionesMenu() {
    const menu = document.getElementById('accionesMenu');
    if (menu.classList.contains('oculto')) {
        menu.classList.remove('oculto');
        setTimeout(() => menu.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    } else {
        menu.classList.add('oculto');
    }
}

// ==========================================
// VISTA PREVIA Y ZOOM INTELIGENTE
// ==========================================
function abrirVistaPrevia() {
    if (listaAmbientes.length === 0) {
        mostrarAlertaCorp("Sin Contenido", "Cargá ambientes antes de ver la vista previa.");
        return;
    }
    
    // 1. Habilitar zoom táctil (efecto pinza) exclusivamente en la vista previa
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
        metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes");
    }
    
    // 2. Sincronizar datos frescos en el PDF
    calcularGradoYRenderizar(); 
    
    // 3. Mover la plantilla A4 al Modal Fullscreen y limpiar cualquier escala anterior
    const element = document.getElementById('plantilla-pdf');
    const previewWrapper = document.getElementById('previewWrapper');
    previewWrapper.scrollTop = 0;
    element.style.transform = 'none';
    element.style.zoom = '1';
    element.style.display = 'block';
    previewWrapper.appendChild(element);
    
    // 4. Abrir modal
    document.getElementById('modalVistaPrevia').classList.remove('oculto');
}

function cerrarVistaPrevia() {
    // 1. Ocultar el modal de inmediato para quitar el contenedor táctil
    const modal = document.getElementById('modalVistaPrevia');
    modal.classList.add('oculto');

    // 2. Limpiar escalas, zóOM o transformaciones de la plantilla PDF
    const element = document.getElementById('plantilla-pdf');
    element.style.transform = '';
    element.style.zoom = '';
    
    // 3. Devolver A4 a su panel original (para PC)
    const originalContainer = document.querySelector('.preview-panel');
    if(originalContainer) originalContainer.appendChild(element);
    
    if (window.innerWidth < 992) element.style.display = 'none';
    
    // 4. Restaurar bloqueo antizoom nativo de la PWA y forzar reinicio de escala en el navegador
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
        metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
    }
    
    // 5. Forzar la ventana principal a su posición inicial normal
    window.scrollTo(0, 0);
}

// ==========================================
// GENERADOR DE PDF CON CONTROL DE SELLO
// ==========================================
async function generarPDF() {
    if (listaAmbientes.length === 0) {
        mostrarAlertaCorp("Sin Contenido", "Debe cargar ambientes para generar el PDF.");
        return;
    }
    
    calcularGradoYRenderizar();

    if (typeof permiteGuardarNube !== 'undefined' && permiteGuardarNube && typeof guardarBorradorFirebase === 'function') { 
        guardarBorradorFirebase(false, true); 
    }
    
    const element = document.getElementById('plantilla-pdf');
    
    if (document.getElementById('modalVistaPrevia').classList.contains('oculto')) {
        element.style.display = 'block'; 
        window.scrollTo(0, 0); 
    }

    const marcaAgua = document.getElementById('marcaAguaPDF');
    if (marcaAgua) marcaAgua.style.display = 'none';

    const shortName = (document.getElementById('cliNombre').value || "Proyecto").split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = Math.floor(Math.random() * 9000) + 1000;
    
    const opt = {
        margin:       0,
        filename:     `Carga_Circuitos_${shortName}_${uniqueSuffix}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    try { 
        await html2pdf().set(opt).from(element).save(); 
        mostrarToast("Éxito", "PDF generado correctamente.");
    } 
    catch (error) { 
        mostrarAlertaCorp("Error", "Ocurrió un error al generar el PDF.");
    } 
    finally { 
        if (marcaAgua) marcaAgua.style.display = 'flex';
        
        if (window.innerWidth < 992 && document.getElementById('modalVistaPrevia').classList.contains('oculto')) { 
            element.style.display = 'none'; 
        } 
    }
}

// ==========================================
// WHATSAPP (INTEGRACIÓN GLOBAL)
// ==========================================
function prepararEnvioWhatsApp() {
    if (listaAmbientes.length === 0) {
        if(typeof mostrarAlertaCorp === 'function') mostrarAlertaCorp("Faltan Datos", "Cargá al menos un ambiente.");
        else alert("Cargá al menos un ambiente.");
        return;
    }
    
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    const dpms = document.getElementById('ui-dpms').innerText;
    const grado = document.getElementById('ui-grado').innerText;
    const area = document.getElementById('ui-sla').innerText;
    
    let m = `*${profNombre.toUpperCase()} - CÁLCULO DE CARGAS*\n`;
    m += `*Cliente:* ${document.getElementById('cliNombre').value || 'Sin Nombre'}\n`;
    m += `*Proyecto:* ${document.getElementById('cliProyecto').value || '-'}\n\n`;
    
    m += `Se ha realizado el cálculo de Carga y Circuitos:\n`;
    m += `• Superficie Límite: ${area}\n`;
    m += `• Grado Electrificación: ${grado}\n`;
    m += `• DPMS Total: ${dpms}\n\n`;
    m += `*TOTAL AMBIENTES:* ${listaAmbientes.length}\n`;

    if (typeof abrirModalWspGlobal === 'function') {
        abrirModalWspGlobal(telefonoClienteActual, m);
    } else {
        console.error("No se encontró abrirModalWspGlobal.");
    }
}

// ==========================================
// BORRADORES EN LA NUBE (FIREBASE)
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
    if (listaAmbientes.length === 0) return;
    
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    const proyCli = (document.getElementById('cliProyecto').value.trim() || 'Calculo').replace(/\s+/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    let nombreSugerido = `${nombreCli}_${proyCli}_${fechaHoy}`;

    if (!autoGuardado) {
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
        listaAmbientes: listaAmbientes,
        circuitos: circuitos,
        circuitoCS: circuitoCS,
        fechaGuardado: Date.now(),
        nombreBorrador: nombreFinal,
        telefonoClienteActual: telefonoClienteActual 
    };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    db.collection("perfiles").doc(uid).collection("borradores_potencia").doc(docId).set(estado)
      .then(() => {
          if (mostrarAlerta) mostrarToast("Guardado", "Sincronizado con la nube.");
      })
      .catch((e) => {
          console.error("Error Firebase:", e);
          if (mostrarAlerta) mostrarAlertaCorp("Error", "Error al guardar el borrador.");
      });
}

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

    db.collection("perfiles").doc(uid).collection("borradores_potencia").doc(idBorradorAEliminar).delete()
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
        const snapshot = await db.collection("perfiles").doc(uid).collection("borradores_potencia")
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
        const doc = await db.collection("perfiles").doc(uid).collection("borradores_potencia").doc(docId).get();
        if (doc.exists) {
            const data = doc.data();
            
            document.getElementById('cliNombre').value = data.cliNombre || '';
            document.getElementById('cliDireccion').value = data.cliDireccion || data.cliDir || '';
            document.getElementById('cliProyecto').value = data.cliProyecto || '';
            
            listaAmbientes = data.listaAmbientes || [];
            circuitos = data.circuitos || [
                { id: 'C1', tipo: 'IUG', dpms: 0, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' },
                { id: 'C2', tipo: 'TUG', dpms: 2200, userEditedDpms: false, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' }
            ];
            circuitoCS = data.circuitoCS || { id: 'CS', tipo: 'T.P.', dpms: 0, tension: '', seccionLN: '', seccionPE: '', iz: '', in: '' };
            
            if (data.telefonoClienteActual !== undefined) telefonoClienteActual = data.telefonoClienteActual;
            
            clienteDesdeAgenda = true;
            permiteGuardarNube = true;
            nombreBorradorActual = data.nombreBorrador || null;
            
            if(typeof cerrarModalBorradoresGlobal === 'function') cerrarModalBorradoresGlobal();
            
            document.getElementById('step-cliente').classList.add('oculto');
            document.getElementById('step-trabajo').classList.remove('oculto');
            document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
            
            actualizarGestorCircuitos();
            calcularGradoYRenderizar();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    } catch(e) {
        mostrarAlertaCorp("Error", "Error al cargar el borrador.");
    }
                }

// ==========================================
// MENÚ INFERIOR TIPO APP
// ==========================================
function generarMenuInferior() {
    const footer = document.getElementById('corpFooterMenu'); 
    if (!footer) return;
    
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '#', active: true },
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

// ==========================================
// NUEVO MOTOR DE ACORDEONES (FORMULARIOS)
// ==========================================
const ambientesOptions = [
    "Sala de Estar", "Comedor", "Living", "Dormitorio", "Cocina",
    "Baño", "Toilette", "Pasillo", "Lavadero", "Balcón (Semi)",
    "Galería (Semi)", "Porche (Semi)", "Cochera (Semi)", "Exterior",
    "Aire Acondicionado", "Motor / Bomba"
];

function inicializarAcordeonAmbiente() {
    const listAmb = document.getElementById('listAmbiente');
    if (!listAmb) return;
    listAmb.innerHTML = '';
    
    ambientesOptions.forEach(amb => {
        const opt = document.createElement('div');
        opt.className = 'corp-select-option';
        opt.innerText = amb;
        opt.onclick = () => {
            document.getElementById('selAmbiente').value = amb;
            document.getElementById('sumAmbiente').innerText = amb;
            document.getElementById('detAmbiente').removeAttribute('open');
        };
        listAmb.appendChild(opt);
    });
}
document.addEventListener('DOMContentLoaded', inicializarAcordeonAmbiente);

function poblarAcordeonCircuito(idSuffix, arrayNombresCircuitos) {
    const hiddenInput = document.getElementById('circuito' + idSuffix);
    const summary = document.getElementById('sumCircuito' + idSuffix);
    const list = document.getElementById('listCircuito' + idSuffix);
    const details = document.getElementById('detCircuito' + idSuffix);

    if (!hiddenInput || !summary || !list || !details) return;
    list.innerHTML = '';
    
    if (hiddenInput.value && !arrayNombresCircuitos.includes(hiddenInput.value)) {
        hiddenInput.value = '';
        summary.innerText = '-- Circ --';
    }

    const optVacia = document.createElement('div');
    optVacia.className = 'corp-select-option';
    optVacia.innerText = '-- Circ --';
    optVacia.onclick = () => {
        hiddenInput.value = '';
        summary.innerText = '-- Circ --';
        details.removeAttribute('open');
    };
    list.appendChild(optVacia);

    arrayNombresCircuitos.forEach(circNombre => {
        const opt = document.createElement('div');
        opt.className = 'corp-select-option';
        opt.innerText = circNombre;
        opt.onclick = () => {
            hiddenInput.value = circNombre;
            summary.innerText = circNombre;
            details.removeAttribute('open');
        };
        list.appendChild(opt);
    });
}

function cambiarSuministro(valor, texto) {
    document.getElementById('selSuministro').value = valor;
    document.getElementById('sumSuministro').innerText = texto;
    document.getElementById('detSuministro').removeAttribute('open');
    if (typeof renderTabla === 'function') renderTabla(); 
}

document.addEventListener('click', (event) => {
    const details = document.querySelectorAll('details.corp-custom-select');
    details.forEach(det => {
        if (det.open && !det.contains(event.target)) det.removeAttribute('open');
    });
});
document.querySelectorAll('details.corp-custom-select').forEach(det => {
    det.addEventListener('toggle', (e) => {
        if (det.open) {
            document.querySelectorAll('details.corp-custom-select').forEach(other => {
                if (other !== det) other.removeAttribute('open');
            });
        }
    });
});

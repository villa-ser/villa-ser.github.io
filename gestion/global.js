// ==========================================
// global.js - FUNCIONES COMPARTIDAS (WHATSAPP)
// ==========================================
let globalWspMensajeActual = "";
let globalWspTelefonoActual = "";

// 1. Abrir Modal Universal
function abrirModalWspGlobal(telefonoCliente, mensajeGenerado) {
    globalWspMensajeActual = mensajeGenerado;
    globalWspTelefonoActual = telefonoCliente;
    
    const modal = document.getElementById('modalWhatsApp');
    if (modal) modal.classList.remove('oculto');
    
    const btnAgendado = document.getElementById('btnWspGuardado');
    const inputManual = document.getElementById('inputWspManual');
    
    if (inputManual) inputManual.value = ""; // Limpia el input

    // Muestra u oculta el botón del cliente agendado
    if (btnAgendado) {
        if (globalWspTelefonoActual && globalWspTelefonoActual.trim() !== "") {
            btnAgendado.innerHTML = `<i class="fa-brands fa-whatsapp" style="color: white;"></i> Enviar al Cliente (${globalWspTelefonoActual})`;
            btnAgendado.style.display = 'flex';
        } else {
            btnAgendado.style.display = 'none';
        }
    }
}

// 2. Cerrar Modal
function cerrarModalWspGlobal() {
    const modal = document.getElementById('modalWhatsApp');
    if (modal) modal.classList.add('oculto');
}

// 3. Enviar al contacto guardado
function enviarWspGuardadoGlobal() {
    if (!globalWspTelefonoActual) return;
    procesarEnvioWspGlobal(globalWspTelefonoActual);
}

// 4. Enviar a número manual
function enviarWspManualGlobal() {
    const inputManual = document.getElementById('inputWspManual');
    const numero = inputManual ? inputManual.value.trim() : "";
    
    if (!numero) {
        if (typeof mostrarAlertaCorp === 'function') {
            mostrarAlertaCorp("Faltan Datos", "Por favor, ingresá un número válido.");
        } else {
            alert("Por favor, ingresá un número válido.");
        }
        return;
    }
    procesarEnvioWspGlobal(numero);
}

// 5. Buscar libremente en WhatsApp
function buscarEnWspGlobal() {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(globalWspMensajeActual)}`, '_blank');
    cerrarModalWspGlobal();
}

// 6. Lógica de formateo y envío
function procesarEnvioWspGlobal(numero) {
    let cleanNumber = numero.replace(/\D/g, '');
    
    // Auto-formateo a código argentino si no lo tiene
    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(globalWspMensajeActual)}`, '_blank');
    cerrarModalWspGlobal();
}

// ==========================================
// global.js - AGENDA Y MODALES COMPARTIDOS
// ==========================================
let contactosAgendaGlobal = [];

function abrirModalAgendaGlobal() {
    // Busca el ID del usuario usando las funciones locales existentes
    const uid = typeof obtenerUid === 'function' ? obtenerUid() : (typeof obtenerUidSeguro === 'function' ? obtenerUidSeguro() : null);
    
    if (!uid || !db) {
        if (typeof mostrarAlertaCorp === 'function') mostrarAlertaCorp("Error", "Sin sesión detectada.");
        else alert("⚠️ Sin sesión detectada.");
        return;
    }
    
    document.getElementById('modalAgenda').classList.remove('oculto');
    document.getElementById('buscadorAgenda').value = "";
    
    db.collection("perfiles").doc(uid).collection("contactos")
      .orderBy("nombre").get()
      .then((snapshot) => {
          contactosAgendaGlobal = [];
          snapshot.forEach((doc) => { contactosAgendaGlobal.push(doc.data()); });
          filtrarAgendaGlobal();
      })
      .catch(() => {
          document.getElementById('listaAgenda').innerHTML = "<p style='color:var(--error-red); text-align:center;'>Error al cargar contactos.</p>";
      });
}

function cerrarModalAgendaGlobal() {
    document.getElementById('modalAgenda').classList.add('oculto');
}

function filtrarAgendaGlobal() {
    const texto = document.getElementById('buscadorAgenda').value.toLowerCase();
    const contenedor = document.getElementById('listaAgenda'); 
    contenedor.innerHTML = '';
    
    // Soporte simultáneo para múltiples formatos de base de datos
    const filtrados = contactosAgendaGlobal.filter(c => 
        (c.nombre || '').toLowerCase().includes(texto) || 
        (c.dir || c.direccion || '').toLowerCase().includes(texto) || 
        (c.telefono || c.tel || '').includes(texto)
    );
    
    if (filtrados.length === 0) { 
        contenedor.innerHTML = "<p style='color:var(--ngc-text-faded);'>Sin resultados.</p>"; 
        return; 
    }
    
    filtrados.forEach(c => {
        const telVal = c.telefono || c.tel || ''; 
        const dirVal = c.dir || c.direccion || '';
        const div = document.createElement('div'); 
        div.className = "modal-list-item";
        div.innerHTML = `<div><h4>${c.nombre}</h4><small>${dirVal || 'Sin dirección'}</small></div>
            <button class="corp-btn-small" onclick="seleccionarContacto('${c.nombre.replace(/'/g, "\\'")}', '${dirVal.replace(/'/g, "\\'")}', '${telVal.replace(/'/g, "\\'")}')">Usar</button>`;
        contenedor.appendChild(div);
    });
}

function cerrarModalBorradoresGlobal() {
    document.getElementById('modalBorradores').classList.add('oculto');
}


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

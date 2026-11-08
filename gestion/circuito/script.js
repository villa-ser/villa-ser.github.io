// ==========================================
// 1. GUARDIÁN DE SEGURIDAD Y SESIÓN
// ==========================================
let uidSeguro = null;

// Escuchamos a Firebase (ya inicializado en ../firebase-config.js)
firebase.auth().onAuthStateChanged(user => {
    // Si no hay usuario, o el usuario no tiene el email verificado, se expulsa
    if (!user || !user.emailVerified) {
        console.warn("Acceso denegado. Se requiere iniciar sesión.");
        window.location.replace('../index.html'); 
    } else {
        // Usuario autenticado. Se le permite probar el módulo.
        uidSeguro = user.uid;
        console.log("Sesión verificada. Acceso concedido al laboratorio.");
    }
});


// ==========================================
// 2. LÓGICA DEL CIRCUITO SVG
// ==========================================

let estadoSimulacion = false;

function abrirModalCircuito() {
    document.getElementById('modalCircuitoEncapsulado').classList.remove('oculto');
}

function cerrarModalCircuito() {
    document.getElementById('modalCircuitoEncapsulado').classList.add('oculto');
    
    // Apagamos el circuito al cerrar para que vuelva a su estado inicial
    estadoSimulacion = false;
    actualizarVistaCircuito();
}

function simularCircuito() {
    estadoSimulacion = !estadoSimulacion;
    actualizarVistaCircuito();
}

function actualizarVistaCircuito() {
    const flujoMando = document.getElementById('flujoMando');
    const flujoDerivacion = document.getElementById('flujoDerivacion');
    const pulsador = document.getElementById('svgPulsador');
    const lampara = document.getElementById('svgLampara');
    const btnSimular = document.getElementById('btnSimularMando');

    if (estadoSimulacion) {
        // --- ENCENDER (PULSADO) ---
        flujoMando.classList.replace('apagado', 'activo');
        flujoDerivacion.classList.replace('apagado', 'activo');
        
        pulsador.setAttribute('y2', '90'); // Baja el contacto
        
        lampara.setAttribute('fill', 'rgba(255, 193, 7, 0.6)');
        lampara.setAttribute('stroke', '#ffc107');
        
        btnSimular.style.borderColor = "var(--error-red)";
        btnSimular.style.color = "var(--error-red)";
        btnSimular.innerHTML = '<i class="fa-solid fa-hand"></i> Soltar S1';
    } else {
        // --- APAGAR (REPOSO) ---
        flujoMando.classList.replace('activo', 'apagado');
        flujoDerivacion.classList.replace('activo', 'apagado');
        
        pulsador.setAttribute('y2', '70'); // Sube el contacto
        
        lampara.setAttribute('fill', 'transparent');
        lampara.setAttribute('stroke', 'var(--ngc-text-main)');
        
        btnSimular.style.borderColor = "var(--ngc-border-glass)";
        btnSimular.style.color = "var(--ngc-text-main)";
        btnSimular.innerHTML = '<i class="fa-solid fa-power-off"></i> Pulsar S1';
    }
}

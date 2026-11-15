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

// ==========================================
// global.js - MODAL REINICIO / NUEVO DOC
// ==========================================
function abrirModalConfirmarNuevoGlobal() {
    const modal = document.getElementById('modalConfirmarNuevo');
    if (modal) modal.classList.remove('oculto');
}

function cerrarModalConfirmarNuevoGlobal() {
    const modal = document.getElementById('modalConfirmarNuevo');
    if (modal) modal.classList.add('oculto');
}

// ==============================================================
// CONTROL GLOBAL DEL BOTÓN NATIVO "VOLVER" (PWA EXIT GUARD)
// ==============================================================
(function inicializarControlSalidaPWA() {
    let ignorarProximoPopstate = false;

    // 1. Inyectar estilos mínimos de respaldo (para que funcione también en la raíz sin global.css)
    function inyectarEstilosModalSalida() {
        if (document.getElementById('estilos-modal-salida-pwa')) return;
        const style = document.createElement('style');
        style.id = 'estilos-modal-salida-pwa';
        style.textContent = `
            #modalSalirPWA {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.72);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 999999;
            }
            #modalSalirPWA.oculto {
                display: none !important;
            }
            #modalSalirPWA .pwa-exit-card {
                background: var(--ngc-glass, var(--corp-card-bg, #242526));
                border: var(--ngc-border-glass, var(--corp-border, 1px solid #3E4042));
                color: var(--ngc-text-main, var(--corp-text-main, #E4E6EB));
                border-radius: 14px;
                padding: 24px 20px;
                width: 100%;
                max-width: 380px;
                text-align: center;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
            }
            #modalSalirPWA .pwa-exit-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            #modalSalirPWA .pwa-exit-btn {
                flex: 1;
                padding: 12px 14px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: transform 0.15s ease, opacity 0.15s ease;
            }
            #modalSalirPWA .pwa-exit-btn:active {
                transform: scale(0.97);
            }
            #modalSalirPWA .btn-permanecer {
                background: var(--ngc-neon, var(--corp-accent, #2374E1));
                color: #ffffff;
            }
            #modalSalirPWA .btn-salir-app {
                background: transparent;
                color: var(--error-red, var(--corp-danger, #E41E3F));
                border: 1px solid var(--error-red, var(--corp-danger, #E41E3F));
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Inyectar el HTML del modal en el DOM
    function inyectarModalSalida() {
        if (document.getElementById('modalSalirPWA')) return;
        inyectarEstilosModalSalida();

        const modalHTML = `
            <div id="modalSalirPWA" class="modal-overlay oculto gpu-accel" role="dialog" aria-modal="true">
                <div class="corp-modal-card pwa-exit-card">
                    <i class="fa-solid fa-right-from-bracket" style="font-size: 2.2rem; color: var(--error-red, #E41E3F); margin-bottom: 12px; display: block;"></i>
                    <h3 style="margin-bottom: 8px; font-size: 1.15rem; color: var(--ngc-text-main, var(--corp-text-main, #E4E6EB));">
                        ¿Salir de la aplicación?
                    </h3>
                    <p style="font-size: 0.88rem; line-height: 1.4; color: var(--ngc-text-faded, var(--corp-text-faded, #B0B3B8)); margin: 0;">
                        Para moverte entre secciones sin cerrar la app, utilizá los <b>botones de navegación de abajo</b>.
                    </p>
                    <div class="corp-modal-actions pwa-exit-actions">
                        <button type="button" class="pwa-exit-btn btn-permanecer" onclick="permanecerEnPWA()">
                            <i class="fa-solid fa-check"></i> Permanecer
                        </button>
                        <button type="button" class="pwa-exit-btn btn-salir-app" onclick="salirDePWA()">
                            <i class="fa-solid fa-door-open"></i> Salir
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 3. Armar el estado en el historial para interceptar el botón Volver
    function armarTrampaHistorial() {
        if (!window.history.state || !window.history.state.pwaTrap) {
            window.history.pushState({ pwaTrap: true }, '', window.location.href);
        }
    }

    // 4. Acciones de los botones del modal
    window.permanecerEnPWA = function () {
        const modal = document.getElementById('modalSalirPWA');
        if (modal) modal.classList.add('oculto');
        // Volver a bloquear el botón atrás para la próxima vez
        window.history.pushState({ pwaTrap: true }, '', window.location.href);
    };

    window.salirDePWA = function () {
        const modal = document.getElementById('modalSalirPWA');
        if (modal) modal.classList.add('oculto');
        ignorarProximoPopstate = true;

        // Intentar cerrar la ventana standalone de la PWA
        window.close();

        // Retroceder todo el historial interno de la PWA para salir al escritorio del teléfono
        const pasosAtras = window.history.length - 1;
        if (pasosAtras > 0) {
            window.history.go(-pasosAtras);
        } else {
            window.history.back();
        }
    };

    // 5. Escuchar el evento nativo de retroceso del celular
    window.addEventListener('popstate', function () {
        if (ignorarProximoPopstate) {
            ignorarProximoPopstate = false;
            return;
        }
        inyectarModalSalida();
        const modal = document.getElementById('modalSalirPWA');
        if (modal) modal.classList.remove('oculto');
    });

    // Inicializar al cargar la página y reforzar en el primer toque (requisito de Chrome Android)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            inyectarModalSalida();
            armarTrampaHistorial();
        });
    } else {
        inyectarModalSalida();
        armarTrampaHistorial();
    }

    window.addEventListener('pointerdown', armarTrampaHistorial, { once: true });
})();
                            

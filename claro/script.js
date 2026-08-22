document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógica para el menú desplegable "Explorar"
    const btnExplorar = document.getElementById('btn-explorar');
    const menuBotones = document.getElementById('menu-botones');
    const iconoMenu = document.getElementById('icono-menu');

    if (btnExplorar && menuBotones && iconoMenu) {
        btnExplorar.addEventListener('click', () => {
            const estaOculto = menuBotones.classList.contains('menu-oculto');
            
            if (estaOculto) {
                menuBotones.classList.remove('menu-oculto');
                menuBotones.classList.add('menu-visible');
                iconoMenu.classList.add('icono-rotado');
            } else {
                menuBotones.classList.remove('menu-visible');
                menuBotones.classList.add('menu-oculto');
                iconoMenu.classList.remove('icono-rotado');
            }
        });
    }

    // 2. Mantener el menú abierto si vuelve atrás desde una subpágina
    if (sessionStorage.getItem('abrirMenu') === 'true') {
        if (menuBotones && iconoMenu) {
            menuBotones.classList.remove('menu-oculto');
            menuBotones.classList.add('menu-visible');
            iconoMenu.classList.add('icono-rotado'); 
        }
        sessionStorage.removeItem('abrirMenu');
    }

    // 3. Lógica para cerrar la Nube Flotante tocando la pantalla oscura
    const modalOverlay = document.getElementById('modalServicio');
    if(modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if(e.target === this) {
                cerrarModalServicio();
            }
        });
    }
});

// --- LÓGICA DE LA NUBE FLOTANTE DE SERVICIOS --- //
const serviciosInfo = {
    'apto': {
        icono: '<i class="fa-solid fa-file-signature" style="color: var(--ngc-neon);"></i>',
        titulo: 'Apto Eléctrico',
        desc: 'Certificación oficial obligatoria bajo Ley 10.281 (ERSeP) para solicitar nuevos medidores o rehabilitaciones ante EPEC.',
        msg: 'Hola Sergio, necesito realizar un certificado de Apto Eléctrico.'
    },
    'fugas': {
        icono: '<i class="fa-solid fa-plug-circle-exclamation" style="color: #ff4d4d;"></i>',
        titulo: 'Fugas y Cortos',
        desc: 'Detección precisa mediante instrumental y reparación urgente de fallas eléctricas, saltos de disyuntor y cortocircuitos.',
        msg: 'Hola Sergio, tengo un problema urgente de fugas/cortocircuito en mi instalación.'
    },
    'tableros': {
        icono: '<i class="fa-solid fa-charging-station" style="color: var(--ngc-neon);"></i>',
        titulo: 'Tableros',
        desc: 'Armado, normalización y modernización de tableros eléctricos principales y seccionales garantizando protecciones adecuadas.',
        msg: 'Hola Sergio, necesito revisar o normalizar un tablero eléctrico.'
    },
    'obra': {
        icono: '<i class="fa-solid fa-helmet-safety" style="color: var(--ngc-neon);"></i>',
        titulo: 'Luz de Obra',
        desc: 'Instalación de pilares provisorios y definitivos reglamentarios para el inicio seguro de obras y construcciones.',
        msg: 'Hola Sergio, necesito instalar un pilar de Luz de Obra.'
    }
};

function abrirModalServicio(tipo) {
    const modal = document.getElementById('modalServicio');
    const data = serviciosInfo[tipo];
    
    document.getElementById('modal-icono').innerHTML = data.icono;
    document.getElementById('modal-titulo').innerText = data.titulo;
    document.getElementById('modal-desc').innerText = data.desc;
    
    const wspLink = "https://wa.me/543513559347?text=" + encodeURIComponent(data.msg);
    document.getElementById('modal-wsp').href = wspLink;
    
    modal.classList.remove('oculto');
    setTimeout(() => {
        modal.classList.add('activo');
    }, 10); 
}

function cerrarModalServicio() {
    const modal = document.getElementById('modalServicio');
    modal.classList.remove('activo');
    setTimeout(() => {
        modal.classList.add('oculto');
    }, 300); 
}

// --- FUNCIÓN PARA COMPARTIR --- //
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Electricista Habilitado',
      text: 'Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba:',
      url: 'https://villaser.com.ar'
    })
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba: https://villaser.com.ar");
    window.open(whatsappUrl, '_blank');
  }
}

/* --- BOTÓN DE TEMA (DÍA/NOCHE) --- */
.theme-toggle-btn {
    position: fixed; 
    top: 25px; /* Centrado verticalmente con el logo */
    right: 85px; /* Posicionado justo a la izquierda del logo */
    z-index: 9999; 
    width: 40px; 
    height: 40px;
    border-radius: 50%;
    background: var(--ngc-glass); 
    backdrop-filter: var(--ngc-blur);
    border: var(--ngc-border-glass);
    color: rgba(255, 255, 255, 0.8);
    display: flex; 
    align-items: center; 
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.theme-toggle-btn:hover {
    color: var(--ngc-neon);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
}

/* --- VARIABLES Y COLORES PARA EL MODO DÍA --- */
/* Solo afecta las escalas de grises (fondos oscuros pasan a claros, textos blancos pasan a oscuros) */

body.light-theme {
    background-color: #e0e5ec; /* Fondo de respaldo si falla la imagen */
}

/* Invertimos el efecto glass de negro translúcido a blanco translúcido */
body.light-theme .ngc-full-container,
body.light-theme .ngc-btn,
body.light-theme .ngc-quick-services,
body.light-theme .ngc-privacy-card,
body.light-theme .gnc-hero-card,
body.light-theme .hero-logo-icon,
body.light-theme .ngc-modal-card,
body.light-theme .footer-gnc-compact,
body.light-theme .theme-toggle-btn {
    background: rgba(255, 255, 255, 0.85); 
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), inset 0 0 20px rgba(0, 212, 255, 0.1);
}

/* Textos principales (de blancos a gris muy oscuro) */
body.light-theme,
body.light-theme .hero-name,
body.light-theme .privacy-title,
body.light-theme .modal-titulo,
body.light-theme .cta-text h3 {
    color: #1a1a1a;
}

/* Textos secundarios (de grises claros a grises medios/oscuros) */
body.light-theme .hero-description,
body.light-theme .privacy-text,
body.light-theme .modal-desc,
body.light-theme .cta-text p,
body.light-theme .quick-item span,
body.light-theme .ngc-btn,
body.light-theme .btn-social,
body.light-theme button.btn-share,
body.light-theme .ngc-footer-badge {
    color: #333333;
}

/* Detalles sutiles y bordes */
body.light-theme .ngc-privacy-card {
    border-left: 4px solid #888;
    border-top: 1px solid rgba(0,0,0,0.05);
    border-right: 1px solid rgba(0,0,0,0.05);
    border-bottom: 1px solid rgba(0,0,0,0.05);
}

/* Banner CTA (Gradiente pasa de negro a blanco) */
body.light-theme .ngc-cta-banner {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0, 212, 255, 0.15) 100%);
}

/* Placa de Categoría III (Hero Badge) */
body.light-theme .hero-badge {
    background: #ffffff;
    color: #111;
    border-color: #28a745;
}

/* Modal Overlay (Fondo exterior) */
body.light-theme .ngc-modal-overlay {
    background: rgba(255, 255, 255, 0.65);
}

body.light-theme .btn-cerrar-modal {
    background: rgba(0,0,0,0.05);
    color: #1a1a1a;
    border-color: rgba(0,0,0,0.1);
}

/* Créditos finales */
body.light-theme .ngc-site-credits {
    color: rgba(0, 0, 0, 0.5);
}

// --- LÓGICA DEL MODO DÍA/NOCHE --- //
const themeBtn = document.getElementById('theme-toggle-btn');

if (themeBtn) {
    const themeIcon = themeBtn.querySelector('i');
    
    // Revisar si el usuario ya tenía guardado el modo claro
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon'); // Cambia el icono a luna
    }
    
    // Evento al hacer click en el botón
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });
}

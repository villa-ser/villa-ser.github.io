// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

// Inicializar iconos de Lucide (si se usan en el index)
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. LÓGICA DEL MODO DÍA / MODO NOCHE
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        // Sincronizar iconos según el tema actual guardado
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
        }

        // Alternar tema
        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                // Volver a Modo Oscuro
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
            } else {
                // Cambiar a Modo Día
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DEL BOTÓN CLÁSICO EXPLORAR
    // ==========================================
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

    // Comprobar si venimos de otra página con instrucción de abrir el menú
    if (sessionStorage.getItem('abrirMenu') === 'true') {
        if (menuBotones && iconoMenu) {
            menuBotones.classList.remove('menu-oculto');
            menuBotones.classList.add('menu-visible');
            iconoMenu.classList.add('icono-rotado'); 
        }
        sessionStorage.removeItem('abrirMenu');
    }

    // ==========================================
    // 3. CERRAR NUBE FLOTANTE AL TOCAR AFUERA
    // ==========================================
    const modalOverlay = document.getElementById('modalServicio');
    if(modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if(e.target === this) {
                cerrarModalServicio();
            }
        });
    }
});


// ==========================================
// 4. FUNCIONES DE LA NUBE FLOTANTE (MODAL)
// ==========================================
const serviciosInfo = {
    'apto': {
        icono: '<i class="fa-solid fa-file-signature" style="color: var(--ngc-neon);"></i>',
        titulo: 'Apto Eléctrico',
        desc: 'Certificación oficial obligatoria bajo Ley 10.281 (ERSeP) para solicitar nuevos medidores o rehabilitaciones ante EPEC.',
        msg: 'Hola Sergio, necesito realizar un certificado de Apto Eléctrico.'
    },
    'fugas': {
        icono: '<i class="fa-solid fa-plug-circle-exclamation icon-peligro"></i>',
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

// ==========================================
// 5. FUNCIÓN COMPARTIR
// ==========================================
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

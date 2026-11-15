document.addEventListener("DOMContentLoaded", () => {
    // 1. LÓGICA DEL BOTÓN EXPLORAR
    const btnExplorar = document.getElementById('btn-explorar');
    const menuBotones = document.getElementById('menu-botones');
    const iconoMenu = document.getElementById('icono-menu');

    if (btnExplorar && menuBotones && iconoMenu) {
        btnExplorar.addEventListener('click', () => {
            menuBotones.classList.toggle('oculto');
            iconoMenu.style.transform = menuBotones.classList.contains('oculto') ? 'rotate(0deg)' : 'rotate(180deg)';
            
            if(!menuBotones.classList.contains('oculto')) {
                const botonesOcultos = menuBotones.querySelectorAll('.fade-in-up');
                botonesOcultos.forEach((el, index) => {
                    setTimeout(() => { el.classList.add('visible'); }, index * 100);
                });
            } else {
                const botonesOcultos = menuBotones.querySelectorAll('.fade-in-up');
                botonesOcultos.forEach(el => el.classList.remove('visible'));
            }
        });
    }

    // 2. LÓGICA DE ANIMACIÓN FADE-IN EN ESCALERA (SCROLL)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -20px 0px', 
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        const elementosVisibles = entries.filter(entry => entry.isIntersecting);
        
        elementosVisibles.forEach((entry, index) => {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100); 
            observer.unobserve(entry.target);
        });
    }, observerOptions);

    // Selecciona todas las nuevas tarjetas y mega botones
    const elementosAnimar = document.querySelectorAll('.fade-in-up:not(#menu-botones .fade-in-up)');
    elementosAnimar.forEach(el => {
        observer.observe(el);
    });

    // 3. CERRAR MODAL AL TOCAR EL FONDO OSCURO
    const modalOverlay = document.getElementById('modalServicio');
    if(modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if(e.target === this) cerrarModalServicio();
        });
    }
});

// LÓGICA DEL MODAL DE SERVICIOS
const serviciosInfo = {
    'apto': {
        icono: 'fa-solid fa-file-signature',
        color: 'var(--success-green)',
        titulo: 'Apto Eléctrico',
        desc: 'Certificación oficial obligatoria bajo Ley 10.281 (ERSeP) para solicitar nuevos medidores o rehabilitaciones ante EPEC.',
        msg: 'Hola Sergio, necesito realizar un certificado de Apto Eléctrico.'
    },
    'fugas': {
        icono: 'fa-solid fa-plug-circle-exclamation',
        color: 'var(--error-red)',
        titulo: 'Fugas y Cortos',
        desc: 'Detección precisa mediante instrumental y reparación urgente de fallas eléctricas, saltos de disyuntor y cortocircuitos.',
        msg: 'Hola Sergio, tengo un problema urgente de fugas/cortocircuito en mi instalación.'
    },
    'tableros': {
        icono: 'fa-solid fa-charging-station',
        color: 'var(--ngc-warning)',
        titulo: 'Tableros',
        desc: 'Armado, normalización y modernización de tableros eléctricos principales y seccionales garantizando protecciones adecuadas.',
        msg: 'Hola Sergio, necesito revisar o normalizar un tablero eléctrico.'
    },
    'obra': {
        icono: 'fa-solid fa-helmet-safety',
        color: 'var(--ngc-neon)',
        titulo: 'Luz de Obra',
        desc: 'Instalación de pilares provisorios y definitivos reglamentarios para el inicio seguro de obras y construcciones.',
        msg: 'Hola Sergio, necesito instalar un pilar de Luz de Obra.'
    }
};

function abrirModalServicio(tipo) {
    const data = serviciosInfo[tipo];
    const iconoEl = document.getElementById('modal-icono');
    
    iconoEl.className = 'corp-modal-icon ' + data.icono;
    iconoEl.style.color = data.color;
    document.getElementById('modal-titulo').innerText = data.titulo;
    document.getElementById('modal-desc').innerText = data.desc;
    
    const wspLink = "https://wa.me/543513559347?text=" + encodeURIComponent(data.msg);
    document.getElementById('modal-wsp').href = wspLink;
    document.getElementById('modalServicio').classList.remove('oculto');
}

function cerrarModalServicio() {
    document.getElementById('modalServicio').classList.add('oculto');
}

function toggleTema() {
    const html = document.documentElement;
    const iconoTema = document.getElementById('icono-tema');
    
    if (html.getAttribute('data-theme') === 'light') {
        html.removeAttribute('data-theme');
        localStorage.setItem('temaVillaser', 'dark');
        if(iconoTema) { iconoTema.classList.remove('fa-sun'); iconoTema.classList.add('fa-moon'); }
    } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('temaVillaser', 'light');
        if(iconoTema) { iconoTema.classList.remove('fa-moon'); iconoTema.classList.add('fa-sun'); }
    }
}

function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Villaser - Sergio Villagra',
            text: 'Asesor e instalador eléctrico en Córdoba Capital. Registro ERSeP.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
}

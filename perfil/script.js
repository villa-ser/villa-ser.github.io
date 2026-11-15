// =========================================================
// SCRIPTS ESPECÍFICOS DE LA PÁGINA "PERFIL"
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. ROTACIÓN DE IMÁGENES (CROSSFADE PERFECTO)
    // ==========================================
    const contenedorFoto = document.querySelector('.ngc-photo-landscape');
    const imgBase = document.querySelector('.ngc-photo-landscape img');

    if (contenedorFoto && imgBase) {
        const imagenesPerfil = [
            '../img/perfil-color.avif',
            '../img/perfil2.avif',
            '../img/perfil3.avif',
            '../img/perfil4.avif',
            '../img/perfil5.avif',
            '../img/perfil6.avif'
        ];

        // Precarga oculta para evitar demoras de red al cambiar
        imagenesPerfil.forEach(src => new Image().src = src);

        // Creamos una segunda capa de imagen dinámica, ajustada al diseño Flat (borde a borde)
        const imgSuperpuesta = imgBase.cloneNode();
        imgSuperpuesta.style.position = 'absolute';
        imgSuperpuesta.style.top = '0';
        imgSuperpuesta.style.left = '0';
        imgSuperpuesta.style.width = '100%';
        imgSuperpuesta.style.height = '100%';
        imgSuperpuesta.style.objectFit = 'cover';
        imgSuperpuesta.style.borderRadius = '12px 12px 0 0';
        imgSuperpuesta.style.zIndex = '2';
        imgSuperpuesta.style.opacity = '0';
        imgSuperpuesta.style.transition = 'opacity 1s ease-in-out';

        contenedorFoto.appendChild(imgSuperpuesta);

        let indexActual = 0;

        // Ejecuta el cambio cada 5 segundos
        setInterval(() => {
            const indexSiguiente = (indexActual + 1) % imagenesPerfil.length;
            
            imgSuperpuesta.src = imagenesPerfil[indexSiguiente];
            imgSuperpuesta.style.opacity = '1';

            // Cuando termina la transición (1 segundo), preparamos para el próximo turno
            setTimeout(() => {
                imgBase.src = imagenesPerfil[indexSiguiente];
                
                // Ocultamos la capa superior de golpe
                imgSuperpuesta.style.transition = 'none';
                imgSuperpuesta.style.opacity = '0';
                
                // Le devolvemos la transición para el siguiente ciclo
                setTimeout(() => {
                    imgSuperpuesta.style.transition = 'opacity 1s ease-in-out';
                }, 50);

                indexActual = indexSiguiente;
            }, 1000); 
            
        }, 5000);
    }

    // ==========================================
    // 2. LÓGICA DE ANIMACIÓN FADE-IN (SCROLL)
    // ==========================================
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
            }, index * 120); 
            observer.unobserve(entry.target);
        });
    }, observerOptions);

    const elementosAnimar = document.querySelectorAll('.fade-in-up');
    elementosAnimar.forEach(el => observer.observe(el));

    // Renderizar iconos Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==========================================
// 3. CAMBIO DE TEMA DÍA/NOCHE Y COMPARTIR
// ==========================================
function toggleTema() {
    const html = document.documentElement;
    const iconoTema = document.getElementById('icono-tema');
    
    if (html.getAttribute('data-theme') === 'light') {
        html.removeAttribute('data-theme');
        localStorage.setItem('temaVillaser', 'dark');
        if (iconoTema) { iconoTema.classList.remove('fa-sun'); iconoTema.classList.add('fa-moon'); }
    } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('temaVillaser', 'light');
        if (iconoTema) { iconoTema.classList.remove('fa-moon'); iconoTema.classList.add('fa-sun'); }
    }
}

function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Perfil y Currículum | Villaser Córdoba',
            text: 'Trayectoria y certificaciones de Sergio Villagra, electricista matriculado Categoría III en Córdoba.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
}

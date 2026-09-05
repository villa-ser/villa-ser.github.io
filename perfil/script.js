// =========================================================
// 1. APLICAR TEMA INSTANTÁNEAMENTE Y DETECTAR S.O.
// =========================================================
// Se ejecuta inmediatamente para evitar el parpadeo de estilos (Flicker)
(function aplicarTemaInicial() {
    const temaGuardado = localStorage.getItem('temaVillaser');
    const prefiereSistemaClaro = window.matchMedia('(prefers-color-scheme: light)');

    if (temaGuardado === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (temaGuardado === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else if (prefiereSistemaClaro.matches) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// =========================================================
// 2. EVENTOS QUE SE CARGAN CON EL DOM
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Inicializar los iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    // Lógica del Menú Flotante Superior (Explorar)
    // ==========================================
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        // Abrir/Cerrar menú al hacer clic en el botón
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        // Cerrar menú flotante al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // Controlador de la LLave de Luz 3D (Cambio de Tema)
    // ==========================================
    const btnTemaServicios = document.getElementById('btn-tema-servicios');
    
    if (btnTemaServicios) {
        btnTemaServicios.addEventListener('click', () => {
            const esActualClaro = document.documentElement.getAttribute('data-theme') === 'light';
            
            if (esActualClaro) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('temaVillaser', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('temaVillaser', 'light');
            }
        });
    }

    // ==========================================
    // LÓGICA DE UX: Auto-cierre de Acordeones
    // ==========================================
    const accordions = document.querySelectorAll('details[name="historia"]');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            if (!accordion.hasAttribute('open')) {
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion) {
                        otherAccordion.removeAttribute('open');
                    }
                });
            }
        });
    });

    // ==========================================
    // ROTACIÓN DE IMÁGENES (CROSSFADE PERFECTO)
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

        // Precarga oculta para que no haya demoras de red al cambiar
        imagenesPerfil.forEach(src => new Image().src = src);

        // Creamos una segunda capa de imagen dinámica (sin tocar el HTML)
        const imgSuperpuesta = imgBase.cloneNode();
        imgSuperpuesta.style.position = 'absolute';
        imgSuperpuesta.style.top = '3px';
        imgSuperpuesta.style.left = '3px';
        imgSuperpuesta.style.width = 'calc(100% - 6px)';
        imgSuperpuesta.style.height = 'calc(100% - 6px)';
        imgSuperpuesta.style.zIndex = '2';
        imgSuperpuesta.style.opacity = '0';
        imgSuperpuesta.style.transition = 'opacity 1s ease-in-out';

        contenedorFoto.appendChild(imgSuperpuesta);

        let indexActual = 0;

        // Ejecuta el cambio cada 5 segundos exactos
        setInterval(() => {
            const indexSiguiente = (indexActual + 1) % imagenesPerfil.length;
            
            // Cargamos la foto nueva en la capa superior invisible
            imgSuperpuesta.src = imagenesPerfil[indexSiguiente];
            
            // La hacemos aparecer suavemente sobre la foto vieja
            imgSuperpuesta.style.opacity = '1';

            // Cuando termina la transición (1 segundo), preparamos para el próximo turno
            setTimeout(() => {
                imgBase.src = imagenesPerfil[indexSiguiente];
                
                // Ocultamos la capa superior de golpe (sin transición) para que no se note
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
});

// ==========================================
// FUNCIÓN PARA COMPARTIR
// ==========================================
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'CV - Sergio Villagra Electricista',
      text: 'Te comparto el currículum y certificaciones de Sergio Villagra, Electricista Cat III:',
      url: 'https://villaser.com.ar/perfil'
    })
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Te comparto el CV de Sergio Villagra, Electricista Cat III en Córdoba: https://villaser.com.ar/perfil");
    window.open(whatsappUrl, '_blank');
  }
}

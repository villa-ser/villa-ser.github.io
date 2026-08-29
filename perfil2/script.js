// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar los iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    // 2. LÓGICA DEL MENÚ FLOTANTE SUPERIOR
    // ==========================================
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        // Cerrar menú flotante al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // 3. LÓGICA DEL MODO DÍA / MODO NOCHE
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
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // ==========================================
    // 4. LÓGICA DE UX: Auto-cierre de Acordeones
    // ==========================================
    const accordions = document.querySelectorAll('details[name="historia"]');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            if (!accordion.open) {
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion) {
                        otherAccordion.removeAttribute('open');
                    }
                });
            }
        });
    });
});

// ==========================================
// 5. FUNCIÓN PARA COMPARTIR
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

// ==========================================
// 6. ROTACIÓN DE IMÁGENES (CROSSFADE PERFECTO)
// ==========================================
const contenedorFoto = document.querySelector('.ngc-photo-landscape');
const imgBase = document.querySelector('.ngc-photo-landscape img');

if (contenedorFoto && imgBase) {
    const imagenesPerfil = [
        '../img/perfil-color.avif',
        '../img/perfil2.avif',
        '../img/perfil3.avif',
        '../img/perfil4.avif'
    ];

    // Precarga oculta para que no haya demoras de red al cambiar
    imagenesPerfil.forEach(src => new Image().src = src);

    // Creamos una segunda capa de imagen dinámica (sin tocar tu HTML)
    const imgSuperpuesta = imgBase.cloneNode();
    imgSuperpuesta.style.position = 'absolute';
    // Respetamos los 3px de padding (inset) de tu diseño original
    imgSuperpuesta.style.top = '3px';
    imgSuperpuesta.style.left = '3px';
    imgSuperpuesta.style.width = 'calc(100% - 6px)';
    imgSuperpuesta.style.height = 'calc(100% - 6px)';
    imgSuperpuesta.style.zIndex = '2'; // Se coloca justo por encima
    imgSuperpuesta.style.opacity = '0'; // Comienza invisible
    imgSuperpuesta.style.transition = 'opacity 1s ease-in-out'; // Duración del desvanecido cruzado

    contenedorFoto.appendChild(imgSuperpuesta);

    let indexActual = 0;

    // Ejecuta el cambio cada 5 segundos exactos
    setInterval(() => {
        const indexSiguiente = (indexActual + 1) % imagenesPerfil.length;
        
        // 1. Cargamos la foto nueva en la capa superior invisible
        imgSuperpuesta.src = imagenesPerfil[indexSiguiente];
        
        // 2. La hacemos aparecer suavemente sobre la foto vieja
        imgSuperpuesta.style.opacity = '1';

        // 3. Cuando termina la transición (1 segundo), acomodamos todo para el próximo turno
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

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
// 6. ROTACIÓN DE IMÁGENES DE PERFIL (SLIDESHOW)
// ==========================================
const perfilImg = document.querySelector('.ngc-photo-landscape img');

if (perfilImg) {
    // Array con las rutas de tus imágenes
    const imagenesPerfil = [
        '../img/perfil-color.avif',
        '../img/perfil2.avif',
        '../img/perfil3.avif',
        '../img/perfil4.avif'
    ];

    // Precarga de imágenes para que la transición sea fluida y sin parpadeos
    imagenesPerfil.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    let indexActual = 0;

    setInterval(() => {
        // 1. Desvanece la imagen actual (baja la opacidad a 0)
        perfilImg.style.opacity = '0';
        
        // 2. Espera 800ms (el mismo tiempo de la transición CSS) para cambiar la foto
        setTimeout(() => {
            indexActual = (indexActual + 1) % imagenesPerfil.length;
            perfilImg.src = imagenesPerfil[indexActual]; // Cambia el origen de la imagen
            
            // 3. Vuelve a aparecer la nueva imagen
            perfilImg.style.opacity = '1';
        }, 800); 
        
    }, 4000); // 4000ms = 4 segundos
}


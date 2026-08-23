// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos de Lucide
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
    // 3. LÓGICA DEL MODO DÍA / MODO NOCHE Y LOGO
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    const imgLogoPrincipal = document.getElementById('img-logo-principal');
    
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        // Sincronizar iconos según el tema actual guardado
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
            if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logoclaro.avif';
        }

        // Alternar tema y logo al hacer click
        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
                if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logo.avif';
            } else {
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
                if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logoclaro.avif';
            }
        });
    }

    // ==========================================
    // 4. LÓGICA DE UX: Auto-cierre de Acordeones
    // ==========================================
    const accordions = document.querySelectorAll('details[name="consejo"]');
    
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
      title: 'Tips de Seguridad Eléctrica - Villaser',
      text: 'Mirá estos consejos útiles de seguridad eléctrica para el hogar por Sergio Villagra:',
      url: 'https://villaser.com.ar/tips'
    }).catch(console.error);
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Consejos de seguridad eléctrica para el hogar: https://villaser.com.ar/tips");
    window.open(whatsappUrl, '_blank');
  }
}

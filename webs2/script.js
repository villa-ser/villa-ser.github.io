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
            e.stopPropagation(); // Evita que el clic cierre el menú al instante
            dropdownFlotante.classList.toggle('oculto');
        });

        // Cerrar menú flotante al hacer clic en cualquier lugar fuera de él
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
    // Específico para los acordeones "info" de la sección Webs
    const accordions = document.querySelectorAll('details[name="info"]');
    
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
});

// ==========================================
// FUNCIÓN PARA COMPARTIR
// ==========================================
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Webs de Interés - Electricista Villaser',
      text: 'Enlaces y normativas eléctricas de utilidad en Córdoba:',
      url: 'https://villaser.com.ar/webs'
    }).catch(console.error);
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Enlaces y normativas eléctricas en Córdoba: https://villaser.com.ar/webs");
    window.open(whatsappUrl, '_blank');
  }
}

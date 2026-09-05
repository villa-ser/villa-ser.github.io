// =========================================================
// 1. APLICAR TEMA INSTANTÁNEAMENTE Y DETECTAR S.O.
// =========================================================
// Se ejecuta inmediatamente para evitar el parpadeo de estilos
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
    
    // Controlador de la LLave de Luz 3D (Tema)
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

    // Lógica del Menú Flotante Superior
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        // Abrir/Cerrar menú al hacer clic en el botón
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento burbujee al document
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
    // 4. LÓGICA DE UX: Auto-cierre de Acordeones
    // ==========================================
    // CORRECCIÓN: Se cambió 'gnc-accordion' por 'ngc-accordion' para coincidir con tu HTML
    const accordions = document.querySelectorAll('details.ngc-accordion');
    
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
// 5. FUNCIONES DEL FORMULARIO Y COMPARTIR
// ==========================================

function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    btn.classList.add('loading');
    
    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        btn.classList.remove('loading');
    }, 1500); 
}

function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Historia y Ley 10.281 - Villaser',
      text: 'Conocé por qué es obligatoria y fundamental la Ley de Seguridad Eléctrica en Córdoba:',
      url: 'https://villaser.com.ar/historia'
    }).catch(console.error);
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Conocé los detalles de la Ley de Seguridad Eléctrica en Córdoba: https://villaser.com.ar/historia");
    window.open(whatsappUrl, '_blank');
  }
}

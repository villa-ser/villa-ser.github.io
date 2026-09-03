// =========================================================
// 1. APLICAR TEMA INSTANTÁNEAMENTE Y DETECTAR S.O.
// =========================================================
const temaGuardado = localStorage.getItem('temaVillaser');
const prefiereSistemaClaro = window.matchMedia('(prefers-color-scheme: light)');

if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
} else if (temaGuardado === 'dark') {
    document.documentElement.removeAttribute('data-theme');
} else if (prefiereSistemaClaro.matches) {
    document.documentElement.setAttribute('data-theme', 'light');
}

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
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        document.addEventListener('click', (e) => {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // Auto-cierre de Acordeones
    const accordions = document.querySelectorAll('details[name="servicios"]');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', () => {
            if (!accordion.open) {
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion) {
                        otherAccordion.removeAttribute('open');
                    }
                });
            }
        });
    });

    // Visibilidad del Formulario (Móvil vs PC)
    const btnPresupuesto = document.getElementById('btn-presupuesto');
    const formContacto = document.getElementById('formulario-contacto');

    if (btnPresupuesto && formContacto) {
        btnPresupuesto.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (window.innerWidth < 1024) {
                formContacto.classList.toggle('form-visible');
                if (formContacto.classList.contains('form-visible')) {
                    setTimeout(() => {
                        formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100); 
                }
            } else {
                formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                formContacto.style.transition = "box-shadow 0.3s ease";
                formContacto.style.boxShadow = "0 0 25px var(--gnc-neon)";
                setTimeout(() => {
                    formContacto.style.boxShadow = "0 10px 30px var(--card-shadow), inset 0 0 15px rgba(var(--gnc-neon-rgb), 0.05)";
                }, 1200);
            }
        });
    }
});

// =========================================================
// 3. FUNCIONES GLOBALES (Llamadas desde el HTML via onclick)
// =========================================================

// Esta función es la que hace funcionar el botón "Más Información"
function toggleInfo(id) {
    const infoBox = document.getElementById(id);
    if (infoBox) {
        infoBox.classList.toggle('oculto');
        
        // Pequeño efecto de parpadeo de borde al abrirse
        if (!infoBox.classList.contains('oculto')) {
            infoBox.style.boxShadow = "inset 0 0 10px rgba(var(--gnc-neon-rgb), 0.1)";
            setTimeout(() => { infoBox.style.boxShadow = "none"; }, 500);
        }
    }
}

// Funciones del formulario
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    const btnOriginalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        btn.innerHTML = btnOriginalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

// Botón de compartir nativo
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Servicios Eléctricos',
      text: 'Conocé los servicios eléctricos certificados de Sergio Villagra en Córdoba:',
      url: 'https://villaser.com.ar/servicios'
    })
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Conocé los servicios eléctricos de Sergio Villagra en Córdoba: https://villaser.com.ar/servicios");
    window.open(whatsappUrl, '_blank');
  }
        }

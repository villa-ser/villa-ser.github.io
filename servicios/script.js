// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar los iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    // 1. LÓGICA DEL MENÚ FLOTANTE SUPERIOR
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
    // 2. LÓGICA DEL MODO DÍA / MODO NOCHE
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
    // 3. LÓGICA DE UX: Auto-cierre de Acordeones
    // ==========================================
    const accordions = document.querySelectorAll('details[name="servicios"]');
    
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

    // ==========================================
    // 5. LÓGICA DE VISIBILIDAD DEL FORMULARIO (MÓVIL VS PC)
    // ==========================================
    const btnPresupuesto = document.getElementById('btn-presupuesto');
    const formContacto = document.getElementById('formulario-contacto');

    if (btnPresupuesto && formContacto) {
        btnPresupuesto.addEventListener('click', (e) => {
            e.preventDefault();
            
            // En dispositivos móviles (pantallas menores a 1024px)
            if (window.innerWidth < 1024) {
                // Alternar la clase que lo muestra
                formContacto.classList.toggle('form-visible');
                
                // Si el formulario ahora está visible, hacemos scroll hacia él
                if (formContacto.classList.contains('form-visible')) {
                    setTimeout(() => {
                        formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100); 
                }
            } else {
                // En PC, el formulario ya está visible de forma fija a la izquierda
                formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Efecto visual para indicar dónde está el formulario
                formContacto.style.transition = "box-shadow 0.3s ease";
                formContacto.style.boxShadow = "0 0 25px var(--gnc-neon)";
                setTimeout(() => {
                    formContacto.style.boxShadow = "0 10px 30px var(--card-shadow), inset 0 0 15px rgba(var(--gnc-neon-rgb), 0.05)";
                }, 1200);
            }
        });
    }
});

// ==========================================
// 4. FUNCIONES DEL FORMULARIO Y COMPARTIR
// ==========================================

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

function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Servicios Eléctricos',
      text: 'Conocé los servicios eléctricos certificados de Sergio Villagra en Córdoba:',
      url: 'https://villaser.com.ar/servicios'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Conocé los servicios eléctricos de Sergio Villagra en Córdoba: https://villaser.com.ar/servicios");
    window.open(whatsappUrl, '_blank');
  }
}

// ==========================================
// 6. LÓGICA DE LOS BOTONES "MÁS INFORMACIÓN"
// ==========================================
function toggleInfo(id) {
    const infoBox = document.getElementById(id);
    if (infoBox) {
        infoBox.classList.toggle('oculto');
        
        if (!infoBox.classList.contains('oculto')) {
            infoBox.style.boxShadow = "inset 0 0 10px rgba(var(--gnc-neon-rgb), 0.1)";
            setTimeout(() => { infoBox.style.boxShadow = "none"; }, 500);
        }
    }
}

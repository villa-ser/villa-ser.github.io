document.addEventListener("DOMContentLoaded", () => {
    // 1. LÓGICA DE ANIMACIÓN FADE-IN EN ESCALERA (SCROLL)
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

    const elementosAnimar = document.querySelectorAll('.fade-in-up:not(.oculto)');
    elementosAnimar.forEach(el => observer.observe(el));

    // 2. LÓGICA DE VISIBILIDAD DEL FORMULARIO (Visita Bonificada al Final)
    const btnBeneficio = document.getElementById('btn-beneficio');
    const formContacto = document.getElementById('formulario-contacto');

    if (btnBeneficio && formContacto) {
        btnBeneficio.addEventListener('click', (e) => {
            e.preventDefault();
            
            formContacto.classList.remove('oculto');
            setTimeout(() => { formContacto.classList.add('visible'); }, 50);

            const textarea = document.querySelector('textarea[name="entry.615194603"]');
            if(textarea) {
                textarea.value = "【 VISITA TÉCNICA BONIFICADA 】\nHola Sergio. Solicito una visita técnica en mi domicilio para evaluar mis instalaciones y recibir un presupuesto o asesoramiento profesional sin cargo.";
            }

            // Desliza para que el formulario se vea completo en la base de la pantalla
            formContacto.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            formContacto.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease";
            formContacto.style.borderColor = "var(--ngc-neon)";
            formContacto.style.boxShadow = "0 0 15px rgba(35, 116, 225, 0.3)";
            setTimeout(() => {
                formContacto.style.borderColor = "var(--ngc-border-glass)";
                formContacto.style.boxShadow = "0 1px 3px var(--card-shadow)";
            }, 1500);
        });
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// 3. MOSTRAR / OCULTAR INFO TÉCNICA
function toggleInfo(id) {
    const infoBox = document.getElementById(id);
    if (infoBox) {
        if (infoBox.classList.contains('oculto')) {
            infoBox.classList.remove('oculto');
            infoBox.style.opacity = 0;
            infoBox.style.transition = "opacity 0.4s ease";
            setTimeout(() => infoBox.style.opacity = 1, 10);
        } else {
            infoBox.classList.add('oculto');
        }
    }
}

// 4. FUNCIONES DE FORMULARIO
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    const btnOriginalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').classList.remove('oculto');
        btn.innerHTML = btnOriginalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').classList.add('oculto');
}

// 5. TEMA DÍA/NOCHE
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

// 6. COMPARTIR WEB NATIVO
function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Villaser - Servicios Eléctricos',
            text: 'Mirá los servicios eléctricos integrales de Villaser en Córdoba.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
                                      }

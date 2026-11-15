// =========================================================
// SCRIPTS ESPECÍFICOS DE LA PÁGINA "HISTORIA"
// =========================================================

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

    const elementosAnimar = document.querySelectorAll('.fade-in-up');
    elementosAnimar.forEach(el => observer.observe(el));

    // Renderizar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// 2. MANEJO DEL FORMULARIO DE GOOGLE FORMS
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';
    }
    
    setTimeout(() => {
        const consultForm = document.getElementById('consultForm');
        const successMsg = document.getElementById('success-message');
        if (consultForm) consultForm.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Consulta';
        }
    }, 1200); 
}

function resetForm() {
    const consultForm = document.getElementById('consultForm');
    const successMsg = document.getElementById('success-message');
    if (consultForm) {
        consultForm.reset();
        consultForm.style.display = 'flex';
    }
    if (successMsg) successMsg.style.display = 'none';
}

// 3. CAMBIO DE TEMA DÍA/NOCHE
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

// 4. COMPARTIR WEB NATIVAMENTE
function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Historia - Ley 10.281 | Villaser Córdoba',
            text: 'Conocé la importancia de la Ley 10.281 de Seguridad Eléctrica en Córdoba.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
                                      }

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

    // Aseguramos que los íconos Lucide se rendericen
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// 2. LÓGICA DE TEMA (MODO DÍA/NOCHE)
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

// 3. LÓGICA PARA COMPARTIR LA WEB (Nativo en celulares)
function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Webs y Enlaces de Interés | Villaser Córdoba',
            text: 'Directorio de enlaces útiles sobre electricidad, trámites y normativas en Córdoba.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
}

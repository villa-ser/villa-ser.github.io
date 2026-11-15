function toggleTema() {
    const html = document.documentElement;
    // Seleccionamos todos los iconos de tema por si hay varios en pantalla
    const iconosTema = document.querySelectorAll('.icono-tema-global');
    
    if (html.getAttribute('data-theme') === 'light') {
        html.removeAttribute('data-theme');
        localStorage.setItem('temaVillaser', 'dark');
        iconosTema.forEach(i => { i.classList.remove('fa-sun'); i.classList.add('fa-moon'); });
    } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('temaVillaser', 'light');
        iconosTema.forEach(i => { i.classList.remove('fa-moon'); i.classList.add('fa-sun'); });
    }
}

function toggleMenuApp() {
    const menuOverlay = document.getElementById('app-menu-overlay');
    if (menuOverlay) {
        menuOverlay.classList.toggle('menu-abierto');
    }
}

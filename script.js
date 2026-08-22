document.addEventListener("DOMContentLoaded", () => {
    
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
            if (!dropdownFlotante.contains(e.target) && e.target !== btnMenuFlotante) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DEL MENÚ DESPLEGABLE "EXPLORAR" (Página principal)
    // ==========================================
    const btnExplorar = document.getElementById('btn-explorar');
    const menuBotones = document.getElementById('menu-botones');
    const iconoMenu = document.getElementById('icono-menu');

    if (btnExplorar && menuBotones && iconoMenu) {
        btnExplorar.addEventListener('click', () => {
            const estaOculto = menuBotones.classList.contains('menu-oculto');
            
            if (estaOculto) {
                menuBotones.classList.remove('menu-oculto');
                menuBotones.classList.add('menu-visible');
                iconoMenu.classList.add('icono-rotado');
            } else {
                menuBotones.classList.remove('menu-visible');
                menuBotones.classList.add('menu-oculto');
                iconoMenu.classList.remove('icono-rotado');
            }
        });
    }

    if (sessionStorage.getItem('abrirMenu') === 'true') {
        if (menuBotones && iconoMenu) {
            menuBotones.classList.remove('menu-oculto');
            menuBotones.classList.add('menu-visible');
            iconoMenu.classList.add('icono-rotado'); 
        }
        sessionStorage.removeItem('abrirMenu');
    }

    // ==========================================
    // 3. LÓGICA DEL MODO DÍA / MODO NOCHE Y LOGO
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    const imgLogoPrincipal = document.getElementById('img-logo-principal');
    
    // Ruta adaptativa para subpáginas (calculadora / buscador)
    const esSubpagina = window.location.pathname.includes('/calculadora/') || window.location.pathname.includes('/buscadorinteligente/');
    const prefijoRuta = esSubpagina ? '../' : '';

    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        const temaGuardado = localStorage.getItem('temaVillaser');
        if (temaGuardado === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            iconTema.classList.replace('fa-sun', 'fa-moon');
            if (imgLogoPrincipal) imgLogoPrincipal.src = prefijoRuta + 'img/logoclaro.avif';
        }

        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
                if (imgLogoPrincipal) imgLogoPrincipal.src = prefijoRuta + 'img/logo.avif';
            } else {
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
                if (imgLogoPrincipal) imgLogoPrincipal.src = prefijoRuta + 'img/logoclaro.avif';
            }
        });
    }
});

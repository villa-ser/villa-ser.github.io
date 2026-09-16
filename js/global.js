document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================
    // 1. LÓGICA INTELIGENTE DE TEMA (MODO DÍA/NOCHE)
    // =========================================================
    const btnTemaServicios = document.getElementById('btn-tema-servicios');
    const TIEMPO_CADUCIDAD = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

    function sincronizarTema() {
        const temaGuardado = localStorage.getItem('temaVillaser');
        const tiempoGuardado = localStorage.getItem('temaVillaser_tiempo');
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;

        if (temaGuardado && tiempoGuardado) {
            const tiempoPasado = Date.now() - parseInt(tiempoGuardado);
            
            if (tiempoPasado > TIEMPO_CADUCIDAD) {
                // Caducó (más de 2 horas): Borramos elección manual
                localStorage.removeItem('temaVillaser');
                localStorage.removeItem('temaVillaser_tiempo');
            } else {
                // Vigente: Respetamos elección del usuario
                if (temaGuardado === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                return; // Fin de la función
            }
        }

        // Si no hay elección manual o caducó, aplica el del sistema
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // Ejecutamos al terminar de cargar el HTML
    sincronizarTema();

    // Lógica al presionar la Llave 3D (Botón)
    if (btnTemaServicios) {
        btnTemaServicios.addEventListener('click', () => {
            const esActualClaro = document.documentElement.getAttribute('data-theme') === 'light';
            const nuevoTema = esActualClaro ? 'dark' : 'light';
            
            // Aplicamos visualmente el cambio
            if (nuevoTema === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            
            // Guardamos la elección y la hora exacta en la que se hizo
            localStorage.setItem('temaVillaser', nuevoTema);
            localStorage.setItem('temaVillaser_tiempo', Date.now().toString());
        });
    }

    // Escuchar cambios automáticos en el sistema operativo en tiempo real
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', sincronizarTema);

    // Escuchar cuando el usuario "vuelve" a la pestaña después de inactividad o cambiar de App
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            sincronizarTema();
        }
    });

    // =========================================================
    // 2. INICIALIZAR ICONOS LUCIDE (si existen en la página)
    // =========================================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // =========================================================
    // 3. MENÚ FLOTANTE SUPERIOR (Exclusivo de subpáginas)
    // =========================================================
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

    // =========================================================
    // 4. AUTO-CIERRE DE ACORDEONES (Universal)
    // =========================================================
    const accordions = document.querySelectorAll('details[name]');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', () => {
            if (!accordion.hasAttribute('open')) {
                const groupName = accordion.getAttribute('name');
                const siblings = document.querySelectorAll(`details[name="${groupName}"]`);
                siblings.forEach(sibling => {
                    if (sibling !== accordion) {
                        sibling.removeAttribute('open');
                    }
                });
            }
        });
    });
});

// =========================================================
// 5. FUNCIÓN COMPARTIR (Dinámica y Global)
// (Debe ir fuera del DOMContentLoaded para que el HTML la pueda llamar)
// =========================================================
function compartirWeb() {
    const url = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const title = document.title;
    const text = 'Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba:';
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).catch((error) => console.log('Error al compartir', error));
    } else {
        const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
        window.open(whatsappUrl, '_blank');
    }
}

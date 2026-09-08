// =========================================================
// 1. APLICAR TEMA INSTANTÁNEAMENTE Y DETECTAR S.O.
// =========================================================
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

document.addEventListener("DOMContentLoaded", () => {
    // 2. INICIALIZAR ICONOS LUCIDE (si existen en la página)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 3. LÓGICA DEL MODO DÍA / MODO NOCHE (Llave 3D)
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

    // 4. MENÚ FLOTANTE SUPERIOR (Exclusivo de subpáginas)
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

    // 5. AUTO-CIERRE DE ACORDEONES (Universal)
    // Agrupa todos los <details> que tengan un atributo "name"
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
// 6. FUNCIÓN COMPARTIR (Dinámica y Global)
// =========================================================
function compartirWeb() {
    // Detecta automáticamente la URL y el Título de la página actual
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

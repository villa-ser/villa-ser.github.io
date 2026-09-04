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

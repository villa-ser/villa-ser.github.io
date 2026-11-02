<!-- ============================================== -->
<!-- SCRIPT NATIVO DE INTERFAZ -->
<!-- ============================================== -->
    // LÓGICA DE ACORDEONES EXCLUSIVOS
    function setupAccordion(className) {
        const groups = document.querySelectorAll(className);
        groups.forEach((acc) => {
            acc.addEventListener('toggle', () => {
                if (acc.open) {
                    // Cierra los otros elementos del mismo nivel
                    groups.forEach((other) => {
                        if (other !== acc) other.removeAttribute('open');
                    });
                }
            });
        });
    }

    // ELIMINACIÓN DEL SPINNER CUANDO EL IFRAME CARGA
    function hideLoader(iframe) {
        const loader = iframe.previousElementSibling;
        if (loader && loader.classList.contains('loader-overlay')) {
            loader.style.display = 'none';
        }
    }

    // INICIALIZACIÓN
    document.addEventListener('DOMContentLoaded', () => {
        setupAccordion('.gnc-main-acc');
        setupAccordion('.gnc-sub-acc');
    });

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../genda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
        { nombre: 'Proveedores', icon: 'fa-solid fa-truck-fast', url: '../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-solid fa-book-open', url: '#', active: true }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});

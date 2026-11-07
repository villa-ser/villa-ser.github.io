// ==============================================
// SCRIPT NATIVO DE INTERFAZ - CATÁLOGOS
// ==============================================

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

// INICIALIZACIÓN DE LA UI
document.addEventListener('DOMContentLoaded', () => {
    setupAccordion('.gnc-main-acc');
    setupAccordion('.gnc-sub-acc');
});

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); 
    if (!footer) return;
    
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
        { nombre: 'Proveedores', icon: 'fa-truck-fast', url: '../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-book-open', url: '#', active: true }
    ];
    
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});

// ==========================================
// VISOR DE CATÁLOGOS A PANTALLA COMPLETA
// ==========================================

function abrirCatalogoInterno(driveId, tituloCatalogo = 'Catálogo') {
    const modal = document.getElementById('modalVisorPDF');
    const iframe = document.getElementById('iframeVisor');
    const loader = document.getElementById('visorLoader');
    const tituloEl = document.getElementById('visorTitle');

    // 1. Configuramos el título y mostramos el estado de carga
    tituloEl.innerHTML = `<i class="fa-solid fa-book-open" style="color: var(--error-red);"></i> ${tituloCatalogo}`;
    loader.style.display = 'block';
    iframe.style.opacity = '0'; // Se mantiene invisible hasta que cargue 100%

    // 2. Mostramos el Modal ocupando toda la pantalla
    modal.classList.remove('oculto');
    // Para asegurar que bloquee el scroll del fondo en móviles
    document.body.style.overflow = 'hidden'; 

    // 3. Inyectamos la URL. SOLO AQUÍ SE CONSUMEN LOS DATOS.
    iframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
}

function ocultarLoaderVisor() {
    const iframe = document.getElementById('iframeVisor');
    const loader = document.getElementById('visorLoader');
    
    // Verificamos que el iframe no esté vacío antes de mostrarlo
    if (iframe.src && iframe.src !== window.location.href) {
        loader.style.display = 'none';
        iframe.style.opacity = '1';
    }
}

function cerrarCatalogoInterno() {
    const modal = document.getElementById('modalVisorPDF');
    const iframe = document.getElementById('iframeVisor');
    
    // 1. Ocultamos el Modal y devolvemos el scroll a la app
    modal.classList.add('oculto');
    document.body.style.overflow = '';
    
    // 2. VACIADO CRÍTICO: Rompemos el enlace para liberar RAM y cortar consumo de datos
    iframe.src = '';
    iframe.style.opacity = '0';
}

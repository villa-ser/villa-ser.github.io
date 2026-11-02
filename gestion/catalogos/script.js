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

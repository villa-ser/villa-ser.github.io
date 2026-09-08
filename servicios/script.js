document.addEventListener("DOMContentLoaded", () => {
    // Visibilidad del Formulario (Móvil vs PC)
    const btnPresupuesto = document.getElementById('btn-presupuesto');
    const formContacto = document.getElementById('formulario-contacto');

    if (btnPresupuesto && formContacto) {
        btnPresupuesto.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (window.innerWidth < 1024) {
                formContacto.classList.toggle('form-visible');
                if (formContacto.classList.contains('form-visible')) {
                    setTimeout(() => {
                        formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100); 
                }
            } else {
                formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                formContacto.style.transition = "box-shadow 0.3s ease";
                formContacto.style.boxShadow = "0 0 25px var(--gnc-neon)";
                setTimeout(() => {
                    formContacto.style.boxShadow = "0 10px 30px var(--card-shadow), inset 0 0 15px rgba(var(--gnc-neon-rgb), 0.05)";
                }, 1200);
            }
        });
    }
});

// Función del botón "Más Información"
function toggleInfo(id) {
    const infoBox = document.getElementById(id);
    if (infoBox) {
        infoBox.classList.toggle('oculto');
        
        if (!infoBox.classList.contains('oculto')) {
            infoBox.style.boxShadow = "inset 0 0 10px rgba(var(--gnc-neon-rgb), 0.1)";
            setTimeout(() => { infoBox.style.boxShadow = "none"; }, 500);
        }
    }
}

// Funciones del Formulario
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    const btnOriginalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        btn.innerHTML = btnOriginalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

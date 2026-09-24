document.addEventListener("DOMContentLoaded", () => {
    // Visibilidad del Formulario (Móvil vs PC)
    const btnPresupuesto = document.getElementById('btn-presupuesto');
    const btnBeneficio = document.getElementById('btn-beneficio');
    const formContacto = document.getElementById('formulario-contacto');

    // Función auxiliar para mover el scroll hacia el formulario con efecto neón
    const animarFormulario = () => {
        if (window.innerWidth < 1024) {
            formContacto.classList.add('form-visible');
        }
        
        setTimeout(() => {
            formContacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); 

        if (window.innerWidth >= 1024) {
            formContacto.style.transition = "box-shadow 0.3s ease";
            formContacto.style.boxShadow = "0 0 20px rgba(var(--ngc-neon-rgb), 0.5)"; // Resplandor al seleccionarlo
            setTimeout(() => {
                formContacto.style.boxShadow = "0 10px 30px var(--card-shadow), inset 0 0 15px rgba(var(--ngc-neon-rgb), 0.05)";
            }, 1200);
        }
    };

    // Evento Botón Estándar (Presupuesto)
    if (btnPresupuesto && formContacto) {
        btnPresupuesto.addEventListener('click', (e) => {
            e.preventDefault();
            animarFormulario();
        });
    }

    // Evento Nuevo Botón (Visita Bonificada)
    if (btnBeneficio && formContacto) {
        btnBeneficio.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Autocompletar el campo de texto con un mensaje que convierte ventas
            const textarea = document.querySelector('textarea[name="entry.615194603"]');
            if(textarea) {
                textarea.value = "【 VISITA TÉCNICA BONIFICADA 】\nHola Sergio. Solicito una visita técnica en mi domicilio para evaluar mis instalaciones y recibir un presupuesto o asesoramiento profesional sin cargo.";
            }

            animarFormulario();
        });
    }
});

// Función del botón "Más Información"
function toggleInfo(id) {
    const infoBox = document.getElementById(id);
    if (infoBox) {
        infoBox.classList.toggle('oculto');
        
        if (!infoBox.classList.contains('oculto')) {
            infoBox.style.boxShadow = "inset 0 0 10px rgba(var(--ngc-neon-rgb), 0.1)";
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

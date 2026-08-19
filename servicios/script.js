document.addEventListener("DOMContentLoaded", () => {
    // Inicializar los iconos de Lucide
    lucide.createIcons();

    // LÓGICA DE UX: Auto-cierre de Acordeones (Details)
    // Permite que solo un servicio esté abierto a la vez, manteniendo la pantalla limpia.
    const accordions = document.querySelectorAll('details[name="servicios"]');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            // Si el usuario hace click en el título (summary) y se va a abrir
            if (!accordion.open) {
                // Cerramos todos los demás
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion) {
                        otherAccordion.removeAttribute('open');
                    }
                });
            }
        });
    });
});

// Función para simular el envío y mostrar mensaje de éxito del Formulario
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    
    // Cambiar texto a enviando (simulación visual)
    const btnOriginalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        // Restaurar botón para futuras consultas
        btn.innerHTML = btnOriginalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

// Función para resetear el formulario y enviar otra consulta
function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

// Función para el botón de compartir del footer
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Servicios Eléctricos',
      text: 'Conocé los servicios eléctricos certificados de Sergio Villagra en Córdoba:',
      url: 'https://villaser.com.ar/servicios'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    // Plan B: Si está en PC, abre WhatsApp Web
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Conocé los servicios eléctricos de Sergio Villagra en Córdoba: https://villaser.com.ar/servicios");
    window.open(whatsappUrl, '_blank');
  }
}

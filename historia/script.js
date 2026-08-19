document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos de Lucide
    lucide.createIcons();

    // 2. LÓGICA DE UX: Auto-cierre de Acordeones (Blindado para todos los navegadores)
    const accordions = document.querySelectorAll('details.gnc-accordion');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            // Si el acordeón sobre el que se hace clic no está abierto
            if (!accordion.hasAttribute('open')) {
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

// 3. Función para simular el envío y mostrar mensaje de éxito del Formulario
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    btn.classList.add('loading');
    
    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        btn.classList.remove('loading');
    }, 1500); // Simula el tiempo de envío al Google Forms
}

// 4. Función para resetear el formulario si quieren enviar otro mensaje
function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

// 5. Función para compartir (API Nativa o WhatsApp)
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Historia y Ley 10.281 - Villaser',
      text: 'Conocé por qué es obligatoria y fundamental la Ley de Seguridad Eléctrica en Córdoba:',
      url: 'https://villaser.com.ar/historia'
    }).catch(console.error);
  } else {
    // Si están en PC y no tienen función de compartir nativa
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Conocé los detalles de la Ley de Seguridad Eléctrica en Córdoba: https://villaser.com.ar/historia");
    window.open(whatsappUrl, '_blank');
  }
}


document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar los iconos de Lucide
    lucide.createIcons();

    // 2. LÓGICA DE UX: Auto-cierre de Acordeones (Historia/Trayectoria)
    // Evita que la pantalla se vuelva excesivamente larga en celulares
    const accordions = document.querySelectorAll('details[name="historia"]');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            // Si el acordeón está cerrado y va a abrirse...
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

// 3. Función para el botón de compartir
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'CV - Sergio Villagra Electricista',
      text: 'Te comparto el currículum y certificaciones de Sergio Villagra, Electricista Cat III:',
      url: 'https://villaser.com.ar/perfil'
    })
    .catch((error) => console.log('Error al compartir', error));
  } else {
    // Plan B: WhatsApp Web
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Te comparto el CV de Sergio Villagra, Electricista Cat III en Córdoba: https://villaser.com.ar/perfil");
    window.open(whatsappUrl, '_blank');
  }
}

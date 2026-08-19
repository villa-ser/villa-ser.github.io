document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos de Lucide
    lucide.createIcons();

    // 2. LÓGICA DE UX: Auto-cierre de Acordeones
    const accordions = document.querySelectorAll('details[name="consejo"]');
    
    accordions.forEach(accordion => {
        accordion.addEventListener('click', (e) => {
            if (!accordion.open) {
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion) {
                        otherAccordion.removeAttribute('open');
                    }
                });
            }
        });
    });
});

// 3. Función para compartir
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Tips de Seguridad Eléctrica - Villaser',
      text: 'Mirá estos consejos útiles de seguridad eléctrica para el hogar por Sergio Villagra:',
      url: 'https://villaser.com.ar/tips'
    }).catch(console.error);
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Consejos de seguridad eléctrica para el hogar: https://villaser.com.ar/tips");
    window.open(whatsappUrl, '_blank');
  }
}

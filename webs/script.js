document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos de Lucide
    lucide.createIcons();

    // 2. LÓGICA DE UX: Auto-cierre de Acordeones
    const accordions = document.querySelectorAll('details[name="info"]');
    
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
      title: 'Webs de Interés - Electricista Villaser',
      text: 'Enlaces y normativas eléctricas de utilidad en Córdoba:',
      url: 'https://villaser.com.ar/webs'
    }).catch(console.error);
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Enlaces y normativas eléctricas en Córdoba: https://villaser.com.ar/webs");
    window.open(whatsappUrl, '_blank');
  }
}


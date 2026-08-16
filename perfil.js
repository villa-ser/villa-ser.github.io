// Inicializar los iconos de Lucide
lucide.createIcons();

// Función para el botón de compartir del footer
function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Electricista Habilitado',
      text: 'Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba:',
      url: 'https://villaser.com.ar'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    // Plan B: Si está en PC, abre WhatsApp Web
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba: https://villaser.com.ar");
    window.open(whatsappUrl, '_blank');
  }
}

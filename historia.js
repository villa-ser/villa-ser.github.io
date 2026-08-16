// Inicializar los iconos de Lucide
lucide.createIcons();

// Función para simular el envío y mostrar mensaje de éxito
function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    btn.classList.add('loading');
    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        btn.classList.remove('loading');
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

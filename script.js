// villaser.github.io - Lógica JS
document.addEventListener("DOMContentLoaded", () => {
    console.log("Villaser Gestión: Interfaz cargada correctamente.");
    
    // Lógica para el menú desplegable "Explorar"
    const btnExplorar = document.getElementById('btn-explorar');
    const menuBotones = document.getElementById('menu-botones');
    const iconoMenu = document.getElementById('icono-menu');

    if (btnExplorar && menuBotones && iconoMenu) {
        btnExplorar.addEventListener('click', () => {
            const estaOculto = menuBotones.classList.contains('menu-oculto');
            
            if (estaOculto) {
                menuBotones.classList.remove('menu-oculto');
                menuBotones.classList.add('menu-visible');
                iconoMenu.classList.add('icono-rotado');
            } else {
                menuBotones.classList.remove('menu-visible');
                menuBotones.classList.add('menu-oculto');
                iconoMenu.classList.remove('icono-rotado');
            }
        });
    }

    // Lógica para mantener el menú abierto si vuelve atrás
    if (sessionStorage.getItem('abrirMenu') === 'true') {
        if (menuBotones && iconoMenu) {
            menuBotones.classList.remove('menu-oculto');
            menuBotones.classList.add('menu-visible');
            iconoMenu.classList.add('icono-rotado'); 
        }
        sessionStorage.removeItem('abrirMenu');
    }
});

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

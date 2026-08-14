// villaser.github.io - Lógica JS
// Inicialización del entorno web

document.addEventListener("DOMContentLoaded", () => {
    console.log("Villaser Gestión: Interfaz cargada correctamente.");
    
    // --- Lógica para el menú desplegable "Explorar Navegación" ---
    const btnExplorar = document.getElementById('btn-explorar');
    const menuBotones = document.getElementById('menu-botones');
    const iconoMenu = document.getElementById('icono-menu');

    // Verificamos que los elementos existan en la página antes de agregar el evento
    if (btnExplorar && menuBotones && iconoMenu) {
        btnExplorar.addEventListener('click', () => {
            // Comprobamos si el menú está oculto actualmente
            const estaOculto = menuBotones.classList.contains('menu-oculto');
            
            if (estaOculto) {
                // Si está oculto, lo mostramos y rotamos la flecha
                menuBotones.classList.remove('menu-oculto');
                menuBotones.classList.add('menu-visible');
                iconoMenu.classList.add('icono-rotado');
            } else {
                // Si está visible, lo ocultamos y devolvemos la flecha a su posición original
                menuBotones.classList.remove('menu-visible');
                menuBotones.classList.add('menu-oculto');
                iconoMenu.classList.remove('icono-rotado');
            }
        });
    }
});

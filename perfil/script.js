// =========================================================
// SCRIPTS ESPECÍFICOS DE LA PÁGINA "PERFIL"
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // ROTACIÓN DE IMÁGENES (CROSSFADE PERFECTO)
    // ==========================================
    const contenedorFoto = document.querySelector('.ngc-photo-landscape');
    const imgBase = document.querySelector('.ngc-photo-landscape img');

    if (contenedorFoto && imgBase) {
        const imagenesPerfil = [
            '../img/perfil-color.avif',
            '../img/perfil2.avif',
            '../img/perfil3.avif',
            '../img/perfil4.avif',
            '../img/perfil5.avif',
            '../img/perfil6.avif'
        ];

        // Precarga oculta para evitar demoras de red al cambiar
        imagenesPerfil.forEach(src => new Image().src = src);

        // Creamos una segunda capa de imagen dinámica
        const imgSuperpuesta = imgBase.cloneNode();
        imgSuperpuesta.style.position = 'absolute';
        imgSuperpuesta.style.top = '3px';
        imgSuperpuesta.style.left = '3px';
        imgSuperpuesta.style.width = 'calc(100% - 6px)';
        imgSuperpuesta.style.height = 'calc(100% - 6px)';
        imgSuperpuesta.style.zIndex = '2';
        imgSuperpuesta.style.opacity = '0';
        imgSuperpuesta.style.transition = 'opacity 1s ease-in-out';

        contenedorFoto.appendChild(imgSuperpuesta);

        let indexActual = 0;

        // Ejecuta el cambio cada 5 segundos exactos
        setInterval(() => {
            const indexSiguiente = (indexActual + 1) % imagenesPerfil.length;
            
            // Cargamos la foto nueva en la capa superior invisible
            imgSuperpuesta.src = imagenesPerfil[indexSiguiente];
            
            // La hacemos aparecer suavemente sobre la foto vieja
            imgSuperpuesta.style.opacity = '1';

            // Cuando termina la transición (1 segundo), preparamos para el próximo turno
            setTimeout(() => {
                imgBase.src = imagenesPerfil[indexSiguiente];
                
                // Ocultamos la capa superior de golpe para que no se note
                imgSuperpuesta.style.transition = 'none';
                imgSuperpuesta.style.opacity = '0';
                
                // Le devolvemos la transición para el siguiente ciclo
                setTimeout(() => {
                    imgSuperpuesta.style.transition = 'opacity 1s ease-in-out';
                }, 50);

                indexActual = indexSiguiente;
            }, 1000); 
            
        }, 5000);
    }
});

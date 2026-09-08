// =========================================================
// SCRIPTS ESPECÍFICOS DE LA PÁGINA "HISTORIA"
// =========================================================

// ==========================================
// FUNCIONES DEL FORMULARIO DE CONTACTO/CONSULTA
// ==========================================

function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    // Le añade la clase loading (asegurate de tenerla en tu CSS si hace algún efecto visual)
    btn.classList.add('loading'); 
    
    // Simula el tiempo de envío antes de mostrar el mensaje de éxito
    setTimeout(() => {
        document.getElementById('consultForm').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        btn.classList.remove('loading');
    }, 1500); 
}

function resetForm() {
    document.getElementById('consultForm').reset();
    document.getElementById('consultForm').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

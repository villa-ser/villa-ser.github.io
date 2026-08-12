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


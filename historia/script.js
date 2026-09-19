// =========================================================
// SCRIPTS ESPECÍFICOS DE LA PÁGINA "HISTORIA"
// =========================================================

function handleSubmit() {
    const btn = document.getElementById('btnSubmit');
    if (btn) btn.classList.add('loading'); 
    
    setTimeout(() => {
        const consultForm = document.getElementById('consultForm');
        const successMsg = document.getElementById('success-message');
        if (consultForm) consultForm.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
        if (btn) btn.classList.remove('loading');
    }, 1500); 
}

function resetForm() {
    const consultForm = document.getElementById('consultForm');
    const successMsg = document.getElementById('success-message');
    if (consultForm) {
        consultForm.reset();
        consultForm.style.display = 'block';
    }
    if (successMsg) successMsg.style.display = 'none';
}

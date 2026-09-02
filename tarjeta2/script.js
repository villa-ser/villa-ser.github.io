// ==========================================
// 0. DETECCIÓN Y GESTIÓN DE TEMA (DÍA / NOCHE)
// ==========================================
const userTheme = localStorage.getItem('temaVillaserTarjeta');
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

function aplicarTema(esClaro) {
    const iconoSol = document.getElementById('icono-sol');
    const iconoLuna = document.getElementById('icono-luna');

    if (esClaro) {
        document.documentElement.setAttribute('data-theme', 'light');
        if (iconoSol) iconoSol.classList.remove('oculto');
        if (iconoLuna) iconoLuna.classList.add('oculto');
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (iconoSol) iconoSol.classList.add('oculto');
        if (iconoLuna) iconoLuna.classList.remove('oculto');
    }
}

// Inicialización instantánea basada en localStorage o preferencias del SO
if (userTheme === 'light') {
    aplicarTema(true);
} else if (userTheme === 'dark') {
    aplicarTema(false);
} else {
    // Automático según el sistema operativo
    aplicarTema(!sistemaOscuro.matches);
}

document.addEventListener("DOMContentLoaded", () => {
    const btnTemaSutil = document.getElementById('btn-tema-sutil');
    
    if (btnTemaSutil) {
        btnTemaSutil.addEventListener('click', () => {
            const esActualClaro = document.documentElement.getAttribute('data-theme') === 'light';
            if (esActualClaro) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('temaVillaserTarjeta', 'dark');
                aplicarTema(false);
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('temaVillaserTarjeta', 'light');
                aplicarTema(true);
            }
        });
    }
});

function showForm() {
  document.getElementById('headerSection').style.display = 'none';
  document.getElementById('mainButtons').style.display = 'none';
  const fs = document.getElementById('formSection');
  fs.style.display = 'flex';
  fs.style.animation = 'fadeIn 0.5s ease';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideForm() {
  document.getElementById('headerSection').style.display = 'block';
  document.getElementById('mainButtons').style.display = 'flex';
  document.getElementById('formSection').style.display = 'none';
  const btn = document.getElementById('btnSubmit');
  btn.classList.remove('loading');
  document.getElementById('consultForm').reset();
  document.getElementById('consultForm').style.display = 'block';
  document.getElementById('success-message').style.display = 'none';
}

function handleSubmit() {
  const btn = document.getElementById('btnSubmit');
  btn.classList.add('loading');
  setTimeout(() => {
    document.getElementById('consultForm').style.display = 'none';
    document.getElementById('success-message').style.display = 'block';
    btn.classList.remove('loading');
  }, 1500);
}

// Función para generar y descargar el contacto en formato vCard
function descargarVCard() {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Sergio Villagra - Electricista
ORG:Electricista Habilitado Cat III
TEL;TYPE=CELL,VOICE,PREF:+5493513559347
EMAIL:contacto@villaser.com.ar
URL:https://villaser.com.ar
NOTE:Idóneo Registro Nro. 20290293899 - 14027
END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'Sergio_Villagra.vcf';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

function compartirTarjeta() {
  if (navigator.share) {
    navigator.share({
      title: 'Sergio Villagra - Electricista',
      text: '¡Hola! Te comparto el contacto de Sergio Villagra (Electricista Habilitado Cat III):',
      url: 'https://villaser.com.ar/tarjeta/index.html'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("¡Hola! Te comparto el contacto de Sergio Villagra (Electricista Habilitado): https://villaser.com.ar/tarjeta.html");
    window.open(whatsappUrl, '_blank');
  }
}

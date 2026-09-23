// ==========================================
// 0. DETECCIÓN Y GESTIÓN DE TEMA (DÍA / NOCHE)
// ==========================================
const userTheme = localStorage.getItem('temaVillaserTarjeta');
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

function aplicarTema(esClaro) {
    if (esClaro) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

if (userTheme === 'light') {
    aplicarTema(true);
} else if (userTheme === 'dark') {
    aplicarTema(false);
} else {
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

// === FUNCIONES DEL FORMULARIO (LÓGICA PARA MÓVIL Y PC) ===

function showForm() {
  // En móviles: oculta encabezado/botones y muestra el formulario
  document.getElementById('headerSection').style.display = 'none';
  document.getElementById('mainButtons').style.display = 'none';
  
  const fs = document.getElementById('formSection');
  fs.style.display = 'block';
  fs.style.animation = 'fadeIn 0.5s ease';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideFormMobile() {
  // En móviles: restaura encabezado/botones y oculta el formulario
  document.getElementById('headerSection').style.display = 'block';
  document.getElementById('mainButtons').style.display = 'flex';
  document.getElementById('formSection').style.display = 'none';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSubmit() {
  const btn = document.getElementById('btnSubmit');
  if (btn) btn.classList.add('loading');
  
  setTimeout(() => {
    const formEl = document.getElementById('consultForm');
    const msgEl = document.getElementById('success-message');
    
    if (formEl) formEl.style.display = 'none';
    if (msgEl) msgEl.style.display = 'block';
    if (btn) btn.classList.remove('loading');
  }, 1500);
}

function resetFormState() {
  const formEl = document.getElementById('consultForm');
  const msgEl = document.getElementById('success-message');
  
  // Limpia y vuelve a mostrar los campos
  if (formEl) {
    formEl.reset();
    formEl.style.display = 'block';
  }
  if (msgEl) {
    msgEl.style.display = 'none';
  }
  
  // Si el usuario está en celular, lo regresamos al menú principal tras terminar
  if (window.innerWidth < 992) {
      hideFormMobile();
  }
}

// === FUNCIONES DE COMPARTIR Y CONTACTO ===

function descargarVCard() {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Sergio Villagra - Electricista
ORG:Electricista Habilitado Cat III
TEL;TYPE=CELL,VOICE,PREF:+5493513559347
EMAIL:contacto@villaser.com.ar
URL:https://villaser.com.ar
NOTE:Idóneo Registro Nro. 29029389 - 14027
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
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("¡Hola! Te comparto el contacto de Sergio Villagra (Electricista Habilitado): https://villaser.com.ar/tarjeta/index.html");
    window.open(whatsappUrl, '_blank');
  }
}

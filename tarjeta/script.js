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
  // Aquí definimos los datos exactos que se guardarán en la agenda del cliente
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Sergio Villagra - Electricista
ORG:Electricista Habilitado Cat III
TEL;TYPE=CELL,VOICE,PREF:+5493513559347
EMAIL:contacto@villaser.com.ar
URL:https://villaser.com.ar
NOTE:Idóneo Registro Nro. 20290293899 - 14027
END:VCARD`;

  // Creamos un archivo virtual tipo Blob con el contenido de la vCard
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  
  // Creamos un enlace temporal (invisible) para forzar la descarga
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'Sergio_Villagra.vcf'; // Nombre del archivo que se descargará
  
  // Lo agregamos a la web, simulamos el clic y lo borramos
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Liberamos la memoria
  URL.revokeObjectURL(url);
}

function compartirTarjeta() {
  // Verifica si el navegador soporta el menú de compartir nativo
  if (navigator.share) {
    navigator.share({
      title: 'Sergio Villagra - Electricista',
      text: '¡Hola! Te comparto el contacto de Sergio Villagra (Electricista Habilitado Cat III):',
      url: 'https://villaser.com.ar/tarjeta/index.html'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    // Plan B: Si el navegador no lo soporta (ej. PC de escritorio), abre WhatsApp
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("¡Hola! Te comparto el contacto de Sergio Villagra (Electricista Habilitado): https://villaser.com.ar/tarjeta.html");
    window.open(whatsappUrl, '_blank');
  }
}

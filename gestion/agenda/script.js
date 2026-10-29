let db;
let contactosArray = [];
let contactoSeleccionado = null; // Guarda el ID del contacto abierto en detalle

// Inicialización llamada desde el HTML cuando Firebase Auth verifica al usuario
function initAgenda() {
    db = firebase.firestore();
    cargarContactos();
}

function cargarContactos() {
    // Escucha en tiempo real la colección de contactos de este usuario
    db.collection("usuarios").doc(currentUserUid).collection("contactos")
      .orderBy("timestamp", "desc")
      .onSnapshot((querySnapshot) => {
          contactosArray = [];
          querySnapshot.forEach((doc) => {
              let data = doc.data();
              data.id = doc.id;
              contactosArray.push(data);
          });
          document.getElementById('loaderAgenda').style.display = 'none';
          renderizarContactos();
      }, (error) => {
          console.error("Error obteniendo contactos: ", error);
          document.getElementById('loaderAgenda').innerHTML = '<p style="color:var(--error-red);">Error al cargar agenda.</p>';
      });
}

function renderizarContactos() {
    const contenedor = document.getElementById('listaContactos');
    const textoBuscador = document.getElementById('buscador').value.toLowerCase();
    const orden = document.getElementById('ordenador').value;
    
    contenedor.innerHTML = '';

    // Filtrar
    let filtrados = contactosArray.filter(c => {
        return (c.nombre || '').toLowerCase().includes(textoBuscador) ||
               (c.dir || '').toLowerCase().includes(textoBuscador) ||
               (c.tel || '').toLowerCase().includes(textoBuscador);
    });

    // Ordenar
    if (orden === 'az') {
        filtrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else if (orden === 'za') {
        filtrados.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    } else if (orden === 'antiguos') {
        filtrados.sort((a, b) => a.timestamp - b.timestamp);
    } else {
        // Recientes (Por defecto)
        filtrados.sort((a, b) => b.timestamp - a.timestamp);
    }

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:var(--ngc-text-faded); margin-top:20px;">No se encontraron contactos.</p>`;
        return;
    }

    // Inyectar HTML
    filtrados.forEach(c => {
        const div = document.createElement('div');
        div.className = 'contacto-card gpu-accel';
        div.onclick = () => abrirDetalle(c.id);
        div.innerHTML = `
            <div class="contacto-info">
                <h4>${c.nombre}</h4>
                <p><i class="fa-solid fa-phone"></i> ${c.tel || 'Sin teléfono'}</p>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ngc-text-faded);"></i>
        `;
        contenedor.appendChild(div);
    });
}

function filtrarContactos() {
    renderizarContactos(); // Se ejecuta en vivo al escribir
}

// ======================= MODALES Y FORMULARIO =======================

function abrirModalFormulario(esEdicion = false) {
    if (!esEdicion) {
        // Modo Nuevo
        document.getElementById('contactoId').value = "";
        document.getElementById('formNombre').value = "";
        document.getElementById('formDir').value = "";
        document.getElementById('formTel').value = "";
        document.getElementById('formObs').value = "";
        document.getElementById('formHistorial').value = "";
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo Contacto';
    } else {
        // Modo Editar (absorbe datos del array buscando por ID)
        const c = contactosArray.find(x => x.id === contactoSeleccionado);
        if(!c) return;
        document.getElementById('contactoId').value = c.id;
        document.getElementById('formNombre').value = c.nombre || '';
        document.getElementById('formDir').value = c.dir || '';
        document.getElementById('formTel').value = c.tel || '';
        document.getElementById('formObs').value = c.obs || '';
        document.getElementById('formHistorial').value = c.historial || '';
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-pen"></i> Editar Contacto';
        cerrarModal('modalDetalle');
    }
    document.getElementById('modalFormulario').classList.remove('oculto');
}

function cerrarModal(idModal) {
    document.getElementById(idModal).classList.add('oculto');
}

function guardarContacto() {
    const id = document.getElementById('contactoId').value;
    const data = {
        nombre: document.getElementById('formNombre').value.trim(),
        dir: document.getElementById('formDir').value.trim(),
        tel: document.getElementById('formTel').value.trim(),
        obs: document.getElementById('formObs').value.trim(),
        historial: document.getElementById('formHistorial').value.trim(),
        timestamp: Date.now()
    };

    if (!data.nombre) {
        alert("El nombre es obligatorio.");
        return;
    }

    const docRef = id ? db.collection("usuarios").doc(currentUserUid).collection("contactos").doc(id) 
                      : db.collection("usuarios").doc(currentUserUid).collection("contactos").doc(); // Genera ID automático

    if(id) { delete data.timestamp; } // Si edita, no cambia la fecha de creación original

    docRef.set(data, { merge: true }).then(() => {
        mostrarToast("Guardado", "El contacto se guardó correctamente.");
        cerrarModal('modalFormulario');
        // Firestore dispara onSnapshot automáticamente y actualiza la lista.
    }).catch((error) => {
        console.error("Error al guardar: ", error);
        alert("Error al guardar el contacto.");
    });
}

// ======================= DETALLES Y ACCIONES =======================

function abrirDetalle(id) {
    contactoSeleccionado = id;
    const c = contactosArray.find(x => x.id === id);
    if(!c) return;

    document.getElementById('detNombre').innerText = c.nombre;
    document.getElementById('detCodigo').innerText = `ID: ${c.id.substring(0,6)}`;
    document.getElementById('detDir').innerText = c.dir || 'No especificada';
    document.getElementById('detTel').innerText = c.tel || 'No especificado';
    document.getElementById('detObs').innerText = c.obs || 'Sin observaciones';
    document.getElementById('detHistorial').innerText = c.historial || 'Sin historial.';

    // Habilitar/Deshabilitar botones de acción si no hay datos
    document.getElementById('btnMap').disabled = !c.dir;
    document.getElementById('btnMap').style.opacity = c.dir ? '1' : '0.4';
    document.getElementById('btnWts').disabled = !c.tel;
    document.getElementById('btnWts').style.opacity = c.tel ? '1' : '0.4';

    document.getElementById('modalDetalle').classList.remove('oculto');
}

function eliminarContacto() {
    if (confirm("¿Estás seguro de que deseas eliminar este contacto? Todo su historial se perderá para siempre.")) {
        db.collection("usuarios").doc(currentUserUid).collection("contactos").doc(contactoSeleccionado).delete()
        .then(() => {
            mostrarToast("Eliminado", "El contacto fue borrado permanentemente.");
            cerrarModal('modalDetalle');
        }).catch((error) => {
            console.error("Error borrando contacto: ", error);
        });
    }
}

function abrirWhatsApp() {
    const c = contactosArray.find(x => x.id === contactoSeleccionado);
    if(!c || !c.tel) return;
    
    let cleanNumber = c.tel.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}`, '_blank');
}

function abrirMaps() {
    const c = contactosArray.find(x => x.id === contactoSeleccionado);
    if(!c || !c.dir) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.dir)}`, '_blank');
}

// ======================= UTILIDADES =======================

function mostrarToast(titulo, mensaje) {
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    const toast = document.getElementById('toastAgenda');
    
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 10);
    
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400); 
    }, 4000);
}

// Cerrar modales clickeando afuera (Overlay)
window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.add('oculto');
    }
          }
          

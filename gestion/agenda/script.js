let db;
let contactosArray = [];
let contactoSeleccionado = null; 

function initAgenda() {
    db = firebase.firestore();
    cargarContactos();
}

function cargarContactos() {
    // Apuntamos a la base de datos coincidiendo con tus reglas de Firestore (perfiles)
    db.collection("perfiles").doc(currentUserUid).collection("contactos")
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
          if (error.code === 'permission-denied') {
              document.getElementById('loaderAgenda').innerHTML = '<div style="color:var(--error-red); padding: 15px; border: 1px dashed var(--error-red); border-radius: 8px; font-size: 0.9rem;">⚠️ <strong>Faltan Permisos de Firebase</strong><br><br>Ve a Firebase Console > Firestore Database > Rules y pega las nuevas reglas.</div>';
          } else {
              document.getElementById('loaderAgenda').innerHTML = '<p style="color:var(--error-red);">Error al cargar agenda.</p>';
          }
      });
}

function renderizarContactos() {
    const contenedor = document.getElementById('listaContactos');
    const textoBuscador = document.getElementById('buscador').value.toLowerCase();
    const orden = document.getElementById('ordenador').value;
    
    contenedor.innerHTML = '';

    let filtrados = contactosArray.filter(c => {
        return (c.nombre || '').toLowerCase().includes(textoBuscador) ||
               (c.dir || '').toLowerCase().includes(textoBuscador) ||
               (c.tel || '').toLowerCase().includes(textoBuscador);
    });

    if (orden === 'az') filtrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    else if (orden === 'za') filtrados.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    else if (orden === 'antiguos') filtrados.sort((a, b) => a.timestamp - b.timestamp);
    else filtrados.sort((a, b) => b.timestamp - a.timestamp);

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:var(--ngc-text-faded); margin-top:20px;">No se encontraron contactos.</p>`;
        return;
    }

    filtrados.forEach(c => {
        const div = document.createElement('div');
        div.className = 'contacto-card gpu-accel';
        div.onclick = () => abrirDetalle(c.id);
        
        const codigoID = c.id.substring(0, 6).toUpperCase(); 
        
        div.innerHTML = `
            <div class="contacto-info">
                <h4>${c.nombre} <span style="font-size:0.6rem; color:var(--ngc-neon); border: 1px solid var(--ngc-neon); padding: 2px 4px; border-radius:4px; margin-left: 5px;">#${codigoID}</span></h4>
                <p><i class="fa-solid fa-phone"></i> ${c.tel || 'Sin teléfono'}</p>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ngc-text-faded);"></i>
        `;
        contenedor.appendChild(div);
    });
}

function filtrarContactos() { renderizarContactos(); }

// ======================= MODALES Y FORMULARIO =======================

function abrirModalFormulario(esEdicion = false) {
    if (!esEdicion) {
        document.getElementById('contactoId').value = "";
        document.getElementById('formNombre').value = "";
        document.getElementById('formDir').value = "";
        document.getElementById('formTel').value = "";
        document.getElementById('formObs').value = "";
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo Contacto';
    } else {
        const c = contactosArray.find(x => x.id === contactoSeleccionado);
        if(!c) return;
        document.getElementById('contactoId').value = c.id;
        document.getElementById('formNombre').value = c.nombre || '';
        document.getElementById('formDir').value = c.dir || '';
        document.getElementById('formTel').value = c.tel || '';
        document.getElementById('formObs').value = c.obs || '';
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-pen"></i> Editar Contacto';
        cerrarModal('modalDetalle');
    }
    document.getElementById('modalFormulario').classList.remove('oculto');
}

function cerrarModal(idModal) { document.getElementById(idModal).classList.add('oculto'); }

function guardarContacto() {
    const id = document.getElementById('contactoId').value;
    const data = {
        nombre: document.getElementById('formNombre').value.trim(),
        dir: document.getElementById('formDir').value.trim(),
        tel: document.getElementById('formTel').value.trim(),
        obs: document.getElementById('formObs').value.trim(),
        timestamp: Date.now()
    };

    if (!data.nombre) {
        alert("El nombre es obligatorio.");
        return;
    }

    const docRef = id ? db.collection("perfiles").doc(currentUserUid).collection("contactos").doc(id) 
                      : db.collection("perfiles").doc(currentUserUid).collection("contactos").doc(); 

    if(id) delete data.timestamp; 

    docRef.set(data, { merge: true }).then(() => {
        mostrarToast("Guardado", "El contacto se guardó correctamente.");
        cerrarModal('modalFormulario');
    }).catch((error) => {
        console.error("Error al guardar: ", error);
        alert("Error al guardar el contacto. Revisa tu conexión y reglas de Firebase.");
    });
}

// ======================= DETALLES Y BORRADORES =======================

function abrirDetalle(id) {
    contactoSeleccionado = id;
    const c = contactosArray.find(x => x.id === id);
    if(!c) return;

    document.getElementById('detNombre').innerText = c.nombre;
    document.getElementById('detCodigo').innerText = `ID: ${c.id.substring(0,6).toUpperCase()}`;
    document.getElementById('detDir').innerText = c.dir || 'No especificada';
    document.getElementById('detTel').innerText = c.tel || 'No especificado';
    document.getElementById('detObs').innerText = c.obs || 'Sin observaciones';

    document.getElementById('btnMap').disabled = !c.dir;
    document.getElementById('btnMap').style.opacity = c.dir ? '1' : '0.4';
    document.getElementById('btnWts').disabled = !c.tel;
    document.getElementById('btnWts').style.opacity = c.tel ? '1' : '0.4';
    
    buscarBorradoresActivos(c.nombre);

    document.getElementById('modalDetalle').classList.remove('oculto');
}

// Escanea la memoria global (LocalStorage) para buscar trabajos en curso
function buscarBorradoresActivos(nombreContacto) {
    const contenedor = document.getElementById('detHistorial');
    contenedor.innerHTML = '';
    let hayBorradores = false;
    const nombreClean = nombreContacto.toLowerCase().trim();

    try {
        const guardado = localStorage.getItem('villaser_cliente_global');
        if (guardado) {
            const datos = JSON.parse(guardado);
            if (datos.nombre && datos.nombre.toLowerCase().trim() === nombreClean) {
                hayBorradores = true;
                contenedor.innerHTML += `
                    <div style="background: rgba(0, 212, 255, 0.1); border-left: 3px solid var(--ngc-neon); padding: 10px; border-radius: 4px; font-size: 0.85rem;">
                        <i class="fa-solid fa-file-signature" style="color: var(--ngc-neon);"></i> 
                        <strong>Borrador Activo en Memoria</strong><br>
                        <span style="color: var(--ngc-text-faded); font-size: 0.75rem; display: block; margin-top: 4px;">Este cliente está actualmente cargado en el sistema. Puedes ir a Presupuestos, Materiales o Informes para continuar editando sus datos o generar sus PDFs.</span>
                    </div>`;
            }
        }
    } catch(e) {}

    if (!hayBorradores) {
        contenedor.innerHTML = '<span style="color: var(--ngc-text-faded); font-size: 0.8rem; font-style: italic;">No hay trabajos activos en memoria para este cliente.</span>';
    }
}

function eliminarContacto() {
    if (confirm("¿Estás seguro de que deseas eliminar este contacto?")) {
        db.collection("perfiles").doc(currentUserUid).collection("contactos").doc(contactoSeleccionado).delete()
        .then(() => {
            mostrarToast("Eliminado", "El contacto fue borrado permanentemente.");
            cerrarModal('modalDetalle');
        }).catch((error) => console.error("Error borrando contacto: ", error));
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

window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) event.target.classList.add('oculto');
}

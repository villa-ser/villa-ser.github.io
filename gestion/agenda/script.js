let db;
let contactosArray = [];
let contactoSeleccionado = null;
let borradoresClienteCache = {};
let busquedaBorradoresToken = 0;

// Configuración de los módulos que almacenan borradores en la nube
const MODULOS_BORRADORES = [
    {
        id: 'presupuestos',
        titulo: 'Presupuestos',
        icon: 'fa-file-invoice-dollar',
        color: '#e91e63',
        url: '../presupuesto/index.html',
        storageKey: 'presupuesto_estado_actual',
        colecciones: [
            { tipo: 'subperfil', nombre: 'presupuestos' }
        ]
    },
    {
        id: 'materiales',
        titulo: 'Materiales',
        icon: 'fa-boxes-stacked',
        color: '#00d4ff',
        url: '../materiales/index.html',
        storageKey: 'materiales_estado_actual',
        colecciones: [
            { tipo: 'subperfil', nombre: 'materiales' },
            { tipo: 'subperfil', nombre: 'borradores_materiales' }
        ]
    },
    {
        id: 'potencia',
        titulo: 'Potencia',
        icon: 'fa-bolt',
        color: '#f5c33b',
        url: '../potencia/index.html',
        storageKey: 'potencia_estado_actual',
        colecciones: [
            { tipo: 'raiz', nombre: 'borradores_potencia' },
            { tipo: 'subperfil', nombre: 'potencia' },
            { tipo: 'subperfil', nombre: 'borradores_potencia' }
        ]
    },
    {
        id: 'informes',
        titulo: 'Informes',
        icon: 'fa-clipboard-check',
        color: '#31a24c',
        url: '../informes/index.html',
        storageKey: 'informes_estado_actual',
        colecciones: [
            { tipo: 'subperfil', nombre: 'informes' },
            { tipo: 'subperfil', nombre: 'borradores_informes' }
        ]
    },
    {
        id: 'costos',
        titulo: 'Mano de Obra',
        icon: 'fa-hand-holding-dollar',
        color: '#a855f7',
        url: '../costos/index.html',
        storageKey: 'costos_estado_actual',
        colecciones: [
            { tipo: 'subperfil', nombre: 'costos' },
            { tipo: 'subperfil', nombre: 'mano_obra' }
        ]
    }
];

function initAgenda() {
    db = firebase.firestore();
    cargarContactos();
}

function cargarContactos() {
    db.collection("perfiles").doc(currentUserUid).collection("contactos")
      .orderBy("timestamp", "desc")
      .onSnapshot((querySnapshot) => {
          contactosArray = [];
          querySnapshot.forEach((doc) => {
              let data = doc.data();
              data.id = doc.id;
              contactosArray.push(data);
          });
          const loader = document.getElementById('loaderAgenda');
          if (loader) loader.style.display = 'none';
          renderizarContactos();
      }, (error) => {
          console.error("Error obteniendo contactos: ", error);
          const loader = document.getElementById('loaderAgenda');
          if (!loader) return;
          if (error.code === 'permission-denied') {
              loader.innerHTML = '<div style="color:var(--error-red); padding: 15px; border: 1px dashed var(--error-red); border-radius: 8px; font-size: 0.9rem;">⚠️ <strong>Faltan Permisos de Firebase</strong><br><br>Ve a Firebase Console > Firestore Database > Rules y pega las nuevas reglas.</div>';
          } else {
              loader.innerHTML = '<p style="color:var(--error-red);">Error al cargar agenda.</p>';
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
    else if (orden === 'antiguos') filtrados.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    else filtrados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:var(--ngc-text-faded); margin-top:20px;">No se encontraron contactos.</p>`;
        return;
    }

    filtrados.forEach(c => {
        const div = document.createElement('div');
        
        div.style.cssText = "background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 12px; transition: 0.2s;";
        
        div.onmouseover = () => { div.style.borderColor = "var(--ngc-neon)"; div.style.transform = "translateY(-2px)"; };
        div.onmouseout = () => { div.style.borderColor = "var(--ngc-privacy-border)"; div.style.transform = "none"; };
        
        div.onclick = () => abrirDetalle(c.id);
        
        const codigoID = c.id.substring(0, 6).toUpperCase(); 
        
        div.innerHTML = `
            <div>
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; color: var(--ngc-text-main); display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <span>${escapeHtml(c.nombre)}</span>
                    <span style="font-size:0.6rem; color:var(--ngc-neon); border: 1px solid var(--ngc-neon); padding: 2px 4px; border-radius:4px;">#${codigoID}</span>
                </h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--ngc-text-faded);">
                    <i class="fa-solid fa-phone"></i> ${escapeHtml(c.tel || 'Sin teléfono')}
                </p>
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
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-plus corp-accent-color"></i> Nuevo Contacto';
    } else {
        const c = contactosArray.find(x => x.id === contactoSeleccionado);
        if (!c) return;
        document.getElementById('contactoId').value = c.id;
        document.getElementById('formNombre').value = c.nombre || '';
        document.getElementById('formDir').value = c.dir || '';
        document.getElementById('formTel').value = c.tel || '';
        document.getElementById('formObs').value = c.obs || '';
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-pen corp-accent-color"></i> Editar Contacto';
        cerrarModal('modalDetalle');
    }
    document.getElementById('modalFormulario').classList.remove('oculto');
}

function cerrarModal(idModal) {
    const el = document.getElementById(idModal);
    if (el) el.classList.add('oculto');
}

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

    if (id) delete data.timestamp; 

    docRef.set(data, { merge: true }).then(() => {
        mostrarToast("Guardado", "El contacto se guardó correctamente.");
        cerrarModal('modalFormulario');
    }).catch((error) => {
        console.error("Error al guardar: ", error);
        alert("Error al guardar el contacto. Revisa tu conexión y reglas de Firebase.");
    });
}

// ======================= DETALLES Y BORRADORES EN LA NUBE =======================

function abrirDetalle(id) {
    contactoSeleccionado = id;
    const c = contactosArray.find(x => x.id === id);
    if (!c) return;

    document.getElementById('detNombre').innerText = c.nombre;
    document.getElementById('detCodigo').innerText = `ID: ${c.id.substring(0,6).toUpperCase()}`;
    document.getElementById('detDir').innerText = c.dir || 'No especificada';
    document.getElementById('detTel').innerText = c.tel || 'No especificado';
    document.getElementById('detObs').innerText = c.obs || 'Sin observaciones';

    document.getElementById('btnMap').disabled = !c.dir;
    document.getElementById('btnMap').style.opacity = c.dir ? '1' : '0.4';
    document.getElementById('btnWts').disabled = !c.tel;
    document.getElementById('btnWts').style.opacity = c.tel ? '1' : '0.4';
    
    buscarBorradoresNube(c);

    document.getElementById('modalDetalle').classList.remove('oculto');
}

async function buscarBorradoresNube(contacto) {
    const contenedor = document.getElementById('detHistorial');
    if (!contenedor || !db || !currentUserUid) return;

    const tokenActual = ++busquedaBorradoresToken;
    borradoresClienteCache = {};

    contenedor.innerHTML = `
        <div style="text-align: center; color: var(--ngc-neon); font-size: 0.85rem; padding: 10px 0;">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Buscando borradores en la nube...
        </div>
    `;

    const nombreClean = (contacto.nombre || '').toLowerCase().trim();
    const contactoId = contacto.id;

    try {
        const resultadosPorModulo = await Promise.all(
            MODULOS_BORRADORES.map(async (modulo) => {
                const vistosEnModulo = new Set();
                const itemsModulo = [];

                for (const col of modulo.colecciones) {
                    try {
                        let snap;
                        if (col.tipo === 'subperfil') {
                            snap = await db.collection("perfiles")
                                .doc(currentUserUid)
                                .collection(col.nombre)
                                .get();
                        } else {
                            snap = await db.collection(col.nombre)
                                .where("userId", "==", currentUserUid)
                                .get();
                        }

                        snap.forEach((doc) => {
                            if (vistosEnModulo.has(doc.id)) return;
                            const data = doc.data() || {};

                            const nombreDoc = (
                                data.cliNombre ||
                                data.clienteNombre ||
                                data.nombre ||
                                ''
                            ).toString().toLowerCase().trim();

                            const coincideId = data.clienteId && data.clienteId === contactoId;
                            const coincideNombre = nombreClean !== '' && nombreDoc === nombreClean;

                            if (coincideId || coincideNombre) {
                                vistosEnModulo.add(doc.id);
                                itemsModulo.push({
                                    docId: doc.id,
                                    colTipo: col.tipo,
                                    colNombre: col.nombre,
                                    data: data
                                });
                            }
                        });
                    } catch (errCol) {
                        // Si una colección opcional no existe o no tiene permisos, continúa con las demás
                        console.warn(`Aviso leyendo ${col.nombre}:`, errCol.message);
                    }
                }

                // Ordenar por fecha más reciente primero
                itemsModulo.sort((a, b) => obtenerTimestampBorrador(b.data) - obtenerTimestampBorrador(a.data));

                return { modulo, items: itemsModulo };
            })
        );

        // Si el usuario cambió de contacto mientras cargaba, abortamos este render
        if (tokenActual !== busquedaBorradoresToken) return;

        renderizarBorradoresSegmentados(contenedor, resultadosPorModulo, contacto);

    } catch (error) {
        if (tokenActual !== busquedaBorradoresToken) return;
        console.error("Error buscando borradores del cliente:", error);
        contenedor.innerHTML = `<span style="color: var(--error-red); font-size: 0.8rem;">Error al consultar borradores en la nube.</span>`;
    }
}

function obtenerTimestampBorrador(data) {
    if (!data) return 0;
    if (typeof data.fechaGuardado === 'number') return data.fechaGuardado;
    if (typeof data.timestamp === 'number') return data.timestamp;
    if (data.fecha) {
        const parsed = Date.parse(data.fecha);
        if (!isNaN(parsed)) return parsed;
    }
    return 0;
}

function formatearFechaBorrador(data) {
    const ts = obtenerTimestampBorrador(data);
    if (!ts) return 'Sin fecha';
    return new Date(ts).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function obtenerResumenBorrador(moduloId, data) {
    const partes = [];
    const fechaStr = formatearFechaBorrador(data);
    partes.push(fechaStr);

    if (data.totalMonto !== undefined && data.totalMonto !== null && Number(data.totalMonto) > 0) {
        partes.push(`$${Number(data.totalMonto).toLocaleString('es-AR')}`);
    }
    if (Array.isArray(data.items) && data.items.length > 0) {
        partes.push(`${data.items.length} ítem${data.items.length === 1 ? '' : 's'}`);
    }
    if (Array.isArray(data.listaAmbientes) && data.listaAmbientes.length > 0) {
        partes.push(`${data.listaAmbientes.length} amb.`);
    }
    if (Array.isArray(data.circuitos) && data.circuitos.length > 0) {
        partes.push(`${data.circuitos.length} circ.`);
    }

    return partes.join(' • ');
}

function renderizarBorradoresSegmentados(contenedor, resultadosPorModulo, contacto) {
    const segmentosConDatos = resultadosPorModulo.filter(r => r.items.length > 0);

    if (segmentosConDatos.length === 0) {
        contenedor.innerHTML = `
            <span style="color: var(--ngc-text-faded); font-size: 0.8rem; font-style: italic;">
                No hay borradores guardados en la nube para este cliente.
            </span>
        `;
        return;
    }

    let html = `
        <div style="font-size: 0.78rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: var(--ngc-text-faded); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-cloud" style="color: var(--ngc-neon);"></i> Borradores en la Nube
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 260px; overflow-y: auto; padding-right: 2px;">
    `;

    segmentosConDatos.forEach(({ modulo, items }) => {
        html += `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--ngc-privacy-border); border-radius: 8px; padding: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--ngc-privacy-border);">
                    <span style="font-size: 0.8rem; font-weight: bold; color: ${modulo.color}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid ${modulo.icon}"></i> ${modulo.titulo}
                    </span>
                    <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); color: var(--ngc-text-main); padding: 1px 7px; border-radius: 10px; font-weight: bold;">
                        ${items.length}
                    </span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        items.forEach((item) => {
            const cacheKey = `${modulo.id}__${item.colNombre}__${item.docId}`;
            borradoresClienteCache[cacheKey] = {
                modulo,
                colTipo: item.colTipo,
                colNombre: item.colNombre,
                docId: item.docId,
                data: item.data,
                contacto
            };

            const tituloBorrador =
                item.data.nombreBorrador ||
                item.data.cliProyecto ||
                item.data.proyecto ||
                item.data.cliNombre ||
                item.data.clienteNombre ||
                item.docId;

            const resumen = obtenerResumenBorrador(modulo.id, item.data);

            html += `
                <div id="borrador-card-${escapeHtml(cacheKey)}" style="background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); border-left: 3px solid ${modulo.color}; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--ngc-text-main); word-break: break-word; line-height: 1.25;">
                            ${escapeHtml(String(tituloBorrador))}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--ngc-text-faded); margin-top: 3px;">
                            ${escapeHtml(resumen)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0;">
                        <button type="button" class="corp-btn-small" style="border: 1px solid ${modulo.color}; color: ${modulo.color}; background: rgba(255,255,255,0.04); padding: 5px 10px; font-size: 0.75rem; font-weight: bold; cursor: pointer;" onclick="abrirBorradorEnModulo('${escapeHtml(cacheKey)}')">
                            <i class="fa-solid fa-folder-open"></i> Abrir
                        </button>
                        <button type="button" class="corp-btn-small danger" style="border: 1px solid var(--error-red); color: var(--error-red); background: transparent; padding: 5px 8px; font-size: 0.75rem; cursor: pointer;" onclick="eliminarBorradorNubeAgenda('${escapeHtml(cacheKey)}')" title="Eliminar borrador">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

function abrirBorradorEnModulo(cacheKey) {
    const registro = borradoresClienteCache[cacheKey];
    if (!registro) return;

    const { modulo, docId, data, contacto } = registro;

    // Preparamos el payload completo del borrador para que el módulo destino lo cargue listo para editar
    const estadoCargar = Object.assign({}, data);
    estadoCargar.clienteDesdeAgenda = true;
    estadoCargar.permiteGuardarNube = true;
    estadoCargar.clienteId = contacto.id;
    if (!estadoCargar.nombreBorrador) {
        estadoCargar.nombreBorrador = docId;
    }

    try {
        // 1. Guardamos el borrador específico en el storageKey del módulo correspondiente
        localStorage.setItem(modulo.storageKey, JSON.stringify(estadoCargar));

        // 2. Sincronizamos también los datos globales del cliente activo en la PWA
        const clienteGlobal = {
            nombre: estadoCargar.cliNombre || estadoCargar.clienteNombre || contacto.nombre || '',
            direccion: estadoCargar.cliDireccion || estadoCargar.direccion || contacto.dir || '',
            proyecto: estadoCargar.cliProyecto || estadoCargar.proyecto || '',
            telefono: contacto.tel || estadoCargar.telefonoClienteActual || estadoCargar.cliTel || ''
        };
        localStorage.setItem('villaser_cliente_global', JSON.stringify(clienteGlobal));

        // 3. Redirigimos directamente al módulo correspondiente
        window.location.href = modulo.url;
    } catch (e) {
        console.error("Error preparando borrador para abrir:", e);
        alert("No se pudo preparar el borrador en memoria.");
    }
}

function eliminarBorradorNubeAgenda(cacheKey) {
    const registro = borradoresClienteCache[cacheKey];
    if (!registro || !db || !currentUserUid) return;

    if (!confirm("¿Eliminar este borrador de la nube permanentemente?")) return;

    const { colTipo, colNombre, docId, contacto } = registro;
    const docRef = colTipo === 'subperfil'
        ? db.collection("perfiles").doc(currentUserUid).collection(colNombre).doc(docId)
        : db.collection(colNombre).doc(docId);

    docRef.delete()
        .then(() => {
            delete borradoresClienteCache[cacheKey];
            mostrarToast("Borrador Eliminado", "El borrador fue borrado de la nube.");
            // Refresca la vista segmentada del contacto actual
            buscarBorradoresNube(contacto);
        })
        .catch((error) => {
            console.error("Error eliminando borrador:", error);
            alert("No se pudo eliminar el borrador de la nube.");
        });
}

// ======================= ACCIONES DE CONTACTO =======================

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
    if (!c || !c.tel) return;
    
    let cleanNumber = c.tel.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}`, '_blank');
}

// ==========================================
// VISOR DE MAPA WEB A PANTALLA COMPLETA
// ==========================================
function abrirMaps() {
    const c = contactosArray.find(x => x.id === contactoSeleccionado);
    if (!c || !c.dir) return;

    const query = encodeURIComponent(c.dir.trim());
    const urlEmbed = `https://www.google.com/maps?q=${query}&output=embed`;

    const iframe = document.getElementById('iframeMapa');
    const modal = document.getElementById('modalVisorMapa');
    const loader = document.getElementById('visorLoaderMapa');
    const titleEl = document.getElementById('mapaTitle');

    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-map-location-dot corp-accent-color"></i> ${escapeHtml(c.nombre)}`;
    }

    iframe.style.opacity = '0';
    loader.style.display = 'block';
    iframe.src = urlEmbed;

    modal.classList.remove('oculto');
    modal.style.display = 'flex';
}

function ocultarLoaderMapa() {
    const iframe = document.getElementById('iframeMapa');
    const loader = document.getElementById('visorLoaderMapa');
    
    if (iframe && iframe.src && iframe.src !== window.location.href && iframe.src !== 'about:blank') {
        if (loader) loader.style.display = 'none';
        iframe.style.opacity = '1';
    }
}

function cerrarMapaInterno() {
    const modal = document.getElementById('modalVisorMapa');
    const iframe = document.getElementById('iframeMapa');
    
    if (modal) {
        modal.classList.add('oculto');
        modal.style.display = 'none';
    }
    if (iframe) {
        iframe.src = ''; // Libera memoria al instante
    }
    window.scrollTo(0, 0);
}

function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.add('oculto');
    }
};

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); 
    if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '#', active: true },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
        { nombre: 'Calculadora', icon: 'fa-calculator', url: '../leyescalc/index.html' },
        { nombre: 'Proveedores', icon: 'fa-truck-fast', url: '../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-book-open', url: '../catalogos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if (!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });

    // Centra automáticamente el botón activo en la vista
    requestAnimationFrame(() => {
        const btnActivo = footer.querySelector('.corp-nav-item.active');
        if (btnActivo) {
            const footerRect = footer.getBoundingClientRect();
            const btnRect = btnActivo.getBoundingClientRect();
            footer.scrollLeft += (btnRect.left - footerRect.left) - (footerRect.width / 2) + (btnRect.width / 2);
        }
    });
});

// ==========================================
// COMPORTAMIENTO ACORDEÓN DEL ORDENADOR
// ==========================================
function cambiarOrden(valor, texto) {
    document.getElementById('ordenador').value = valor;
    document.getElementById('sumOrden').innerText = texto;
    document.getElementById('detOrden').removeAttribute('open');
    renderizarContactos();
}

document.addEventListener('click', function(event) {
    const details = document.querySelectorAll('.corp-custom-select');
    details.forEach(det => {
        if (det.open && !det.contains(event.target)) {
            det.removeAttribute('open');
        }
    });
});

// ==========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ==========================================
let db = null;
let uidSeguro = null;
let informeParrafos = [];
let clienteDesdeAgenda = false;
let permiteGuardarNube = false;
let clienteActualId = null;
let nombreBorradorActual = null;

function arrancarModulo() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            db = firebase.firestore();
            if (typeof firebase.auth === 'function') {
                firebase.auth().onAuthStateChanged(user => {
                    if (user) uidSeguro = user.uid;
                });
            }
        }
    } catch (e) {
        console.warn("Aviso: Firebase no pudo iniciar.", e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarModulo);
} else {
    arrancarModulo();
}

function obtenerUid() {
    if (uidSeguro) return uidSeguro;
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    return null;
}

// ==========================================
// AGENDA Y VALIDACIONES
// ==========================================
async function abrirModalAgenda() {
    document.getElementById('modalAdvertenciaAgenda').classList.add('oculto');
    document.getElementById('modalAgenda').classList.remove('oculto');
    const container = document.getElementById('listaContactosModal');
    container.innerHTML = '<div style="text-align:center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando agenda...</div>';
    
    const uid = obtenerUid();
    if (!uid || !db) {
        container.innerHTML = '<div style="color:var(--error-red); text-align:center;">No hay conexión con la agenda.</div>';
        return;
    }

    try {
        const snapshot = await db.collection("perfiles").doc(uid).collection("contactos").get();
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<div style="text-align:center; color:var(--ngc-text-faded);">Agenda vacía.</div>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'contacto-item';
            div.style.cssText = "background: rgba(255,255,255,0.05); border: 1px solid var(--ngc-privacy-border); border-radius: 8px; padding: 10px; cursor: pointer;";
            div.innerHTML = `<b style="color:var(--ngc-neon);">${data.nombre}</b><br><small style="color:var(--ngc-text-faded);">${data.telefono || 'Sin Tel'}</small>`;
            div.onclick = () => seleccionarClienteAgenda(doc.id, data.nombre, data.telefono, data.direccion);
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = '<div style="color:var(--error-red); text-align:center;">Error al cargar.</div>';
    }
}

function filtrarAgenda() {
    const texto = document.getElementById('buscadorAgenda').value.toLowerCase();
    const items = document.getElementById('listaContactosModal').querySelectorAll('div.contacto-item');
    items.forEach(item => {
        if(item.innerText.toLowerCase().includes(texto)) item.style.display = 'block';
        else item.style.display = 'none';
    });
}

function cerrarModalAgenda() {
    document.getElementById('modalAgenda').classList.add('oculto');
}

function seleccionarClienteAgenda(id, nombre, tel, dir) {
    clienteActualId = id;
    clienteDesdeAgenda = true;
    permiteGuardarNube = true;
    document.getElementById('cliNombre').value = nombre;
    document.getElementById('cliTel').value = tel;
    document.getElementById('cliDir').value = dir;
    cerrarModalAgenda();
    mostrarToast("Cliente Seleccionado", "Datos cargados desde la agenda.");
}

function verificarClienteManual() {
    if(clienteDesdeAgenda) return;
    const nombre = document.getElementById('cliNombre').value.trim();
    if(nombre.length > 2) document.getElementById('modalAdvertenciaAgenda').classList.remove('oculto');
}

function continuarSinAgenda() {
    permiteGuardarNube = false;
    clienteDesdeAgenda = false;
    document.getElementById('modalAdvertenciaAgenda').classList.add('oculto');
}

// ==========================================
// FLUJO INFORME Y PÁRRAFOS
// ==========================================
function nuevoInforme() {
    if (confirm("¿Iniciar un nuevo informe? Se borrarán los datos actuales.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliTel').value = '';
        document.getElementById('cliDir').value = '';
        document.getElementById('obsGenerales').value = '';
        informeParrafos = [];
        clienteDesdeAgenda = false;
        permiteGuardarNube = false;
        nombreBorradorActual = null;
        
        document.getElementById('step-trabajo').classList.add('oculto');
        document.getElementById('step-cliente').classList.remove('oculto');
        renderizarParrafos();
    }
}

function iniciarInforme() {
    const nombre = document.getElementById('cliNombre').value.trim();
    if (!nombre) return alert("Por favor, ingrese el nombre del cliente.");
    
    document.getElementById('step-cliente').classList.add('oculto');
    document.getElementById('step-trabajo').classList.remove('oculto');
    document.getElementById('step-trabajo').classList.add('flex-column', 'gap-15');
    actualizarVistaPreviews();
}

function agregarParrafo() {
    const texto = document.getElementById('textoInforme').value.trim();
    if (!texto) return alert("Escriba un párrafo antes de agregar.");
    
    informeParrafos.push(texto);
    document.getElementById('textoInforme').value = "";
    renderizarParrafos();
}

function eliminarParrafo(index) {
    if (confirm("¿Eliminar este párrafo?")) {
        informeParrafos.splice(index, 1);
        renderizarParrafos();
    }
}

function editarParrafo(index) {
    document.getElementById('textoInforme').value = informeParrafos[index];
    informeParrafos.splice(index, 1);
    renderizarParrafos();
    document.getElementById('textoInforme').focus();
}

function renderizarParrafos() {
    const contenedor = document.getElementById('lista-parrafos');
    contenedor.innerHTML = '';
    
    informeParrafos.forEach((parrafo, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(0,0,0,0.4); border: 1px solid var(--ngc-privacy-border); padding: 12px; border-radius: 8px; position: relative; font-size: 0.85rem; line-height: 1.5;';
        div.innerHTML = `
            <p>${parrafo}</p>
            <div style="display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end;">
                <button onclick="editarParrafo(${index})" style="background: transparent; border: none; color: #ff9800; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                <button onclick="eliminarParrafo(${index})" style="background: transparent; border: none; color: var(--error-red); cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        contenedor.appendChild(div);
    });
    actualizarVistaPreviews();
}

// ==========================================
// RENDERIZADO, PDF Y MEMBRETE
// ==========================================
function actualizarVistaPreviews() {
    const cliNombre = document.getElementById('cliNombre').value || 'Sin Nombre';
    const cliDir = document.getElementById('cliDir').value || '-';
    
    const infoClientArea = document.getElementById('previewClientInfo');
    infoClientArea.innerHTML = `<strong>Cliente:</strong> ${cliNombre}<br><strong>Dirección:</strong> ${cliDir}`;
    
    const previewArea = document.getElementById('previewInforme');
    previewArea.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 15px;">${p}</p>`).join('');

    const og = document.getElementById('obsGenerales').value;
    const previewGlobales = document.getElementById('previewNotasGlobales');
    if (og) {
        previewGlobales.innerText = `Nota: ${og}`;
        previewGlobales.style.display = 'block';
    } else {
        previewGlobales.style.display = 'none';
    }

    // Actualizar PDF Mapeo
    const pdfFecha = document.getElementById('pdf-fecha');
    const pdfCliente = document.getElementById('pdf-cliente');
    const pdfDir = document.getElementById('pdf-dir');
    const pdfTexto = document.getElementById('pdf-texto-contenido');
    const pdfNotasBox = document.getElementById('pdf-notas-box');
    const pdfNotas = document.getElementById('pdf-notas');

    if(pdfFecha) pdfFecha.innerText = new Date().toLocaleDateString('es-AR');
    if(pdfCliente) pdfCliente.innerText = cliNombre;
    if(pdfDir) pdfDir.innerText = cliDir;
    if(pdfTexto) pdfTexto.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 20px;">${p}</p>`).join('');

    if (og && pdfNotasBox && pdfNotas) {
        pdfNotas.innerText = og;
        pdfNotasBox.style.display = 'block';
    } else if (pdfNotasBox) {
        pdfNotasBox.style.display = 'none';
    }
    
    actualizarPDFHeaders();
}

function actualizarPDFHeaders() {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';

    const elTelFooter = document.getElementById('pdf-tel-footer');
    if(elTelFooter) elTelFooter.innerText = profTel ? `📞 ${profTel}` : '';
    const elSlogan = document.getElementById('pdf-slogan');
    if(elSlogan) elSlogan.innerText = profSlogan || '¡Electricidad Segura, Hogar Tranquilo!';
    const elCredenciales = document.getElementById('pdf-credenciales');
    if(elCredenciales) elCredenciales.innerText = profNombre;

    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (imgPdf && txtPdf) {
        if (profLogo && profLogo.startsWith('data:image')) {
            imgPdf.src = profLogo; imgPdf.style.display = 'block'; txtPdf.style.display = 'none';
        } else {
            imgPdf.style.display = 'none'; txtPdf.innerText = profNombre.toUpperCase(); txtPdf.style.display = 'block';
        }
    }
}

async function generarPDF() {
    if (informeParrafos.length === 0) return alert("Agregue al menos un párrafo.");
    actualizarVistaPreviews();
    const element = document.getElementById('plantilla-pdf');
    element.style.display = 'block';
    window.scrollTo(0, 0);
    
    const shortName = (document.getElementById('cliNombre').value || "Cliente").split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    const opt = {
        margin:       0, 
        filename:     `${shortName}_Informe_Tecnico.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if(permiteGuardarNube) { guardarBorradorFirebase(false, true); }
    
    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        alert("Ocurrió un error al generar el PDF.");
    } finally {
        element.style.display = 'none';
    }
}

async function takeScreenshot() {
    if (informeParrafos.length === 0) return alert("El informe está vacío.");
    const area = document.getElementById('captureSection');
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor = isLightMode ? "#ffffff" : "#181818";
    
    area.style.color = isLightMode ? "#1a1a1a" : "#ffffff";
    area.style.border = "none";
    
    html2canvas(area, { backgroundColor: bgColor, scale: 2, useCORS: true, scrollY: 0 }).then(canvas => {
        const link = document.createElement('a');
        const shortName = (document.getElementById('cliNombre').value || "Cliente").split(' ')[0];
        link.download = `Informe_${shortName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        area.style.color = ""; 
        area.style.border = "";
    });
}

// ==========================================
// WHATSAPP
// ==========================================
function abrirModalWhatsApp() {
    if (informeParrafos.length === 0) return alert("Debes cargar información primero.");
    const telGuardado = document.getElementById('cliTel').value.trim();
    document.getElementById('inputWspManual').value = ""; 
    document.getElementById('modalWhatsApp').classList.remove('oculto');
    
    const btnWspGuardado = document.getElementById('btnWspGuardado');
    if(telGuardado) {
        btnWspGuardado.style.display = 'flex';
        btnWspGuardado.innerHTML = `<i class="fa-brands fa-whatsapp"></i> ENVIAR AL CLIENTE (${telGuardado})`;
        btnWspGuardado.onclick = () => procesarEnvioWsp(telGuardado);
    } else {
        btnWspGuardado.style.display = 'none';
    }
}

function cerrarModalWhatsApp() {
    document.getElementById('modalWhatsApp').classList.add('oculto');
}

function enviarWspManual() {
    const numero = document.getElementById('inputWspManual').value.trim();
    if (!numero) return alert("Por favor, ingresá un número válido.");
    procesarEnvioWsp(numero);
}

function procesarEnvioWsp(numero) {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL';
    let text = `*${profNombre.toUpperCase()} - INFORME TÉCNICO*\n`;
    text += `*Cliente:* ${document.getElementById('cliNombre').value}\n\n`;
    
    informeParrafos.forEach(p => text += `${p}\n\n`);
    
    const og = document.getElementById('obsGenerales').value;
    if (og) text += `*NOTAS GLOBALES:*\n${og}\n`;

    let tel = numero.replace(/\D/g, '');
    if (tel.length === 10) tel = "549" + tel;
    else if (!tel.startsWith("54")) tel = "549" + tel;
    
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(text)}`, '_blank');
    cerrarModalWhatsApp();
}

// ==========================================
// NUBE (FIREBASE)
// ==========================================
async function guardarBorradorFirebase(mostrarAlerta = false, autoGuardado = false) {
    const uid = obtenerUid();
    if (!uid || !db) {
        if (mostrarAlerta) alert("⚠️ Sesión no detectada para la nube.");
        return;
    }
    if (!permiteGuardarNube) {
        if (mostrarAlerta) alert("⚠️ Acción bloqueada: Cliente no agendado.");
        return;
    }
    if (informeParrafos.length === 0) return;
    
    const nombreCli = (document.getElementById('cliNombre').value.trim() || 'Sin_Nombre').replace(/\s+/g, '_');
    let nombreSugerido = `${nombreCli}_borrador_informe`;
    let nombreFinal = nombreSugerido;

    if (!autoGuardado) {
        const nombreIngresado = prompt("Guardar borrador como:", nombreBorradorActual || nombreSugerido);
        if (nombreIngresado === null) return;
        nombreFinal = nombreIngresado.trim() || nombreSugerido;
        nombreBorradorActual = nombreFinal;
    } else {
        nombreFinal = nombreBorradorActual || nombreSugerido;
    }

    const estado = {
        cliNombre: document.getElementById('cliNombre').value,
        cliTel: document.getElementById('cliTel').value,
        cliDir: document.getElementById('cliDir').value,
        obsGenerales: document.getElementById('obsGenerales').value,
        parrafos: informeParrafos,
        fechaGuardado: Date.now(),
        nombreBorrador: nombreFinal
    };
    
    let docId = nombreFinal.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    try {
        await db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).set(estado);
        if (mostrarAlerta) mostrarToast("Guardado", "Sincronizado con la nube.");
    } catch (e) {
        console.error("Error Firebase:", e);
        if (mostrarAlerta) alert("Error al guardar.");
    }
}

async function abrirModalBorradores() {
    if(!clienteDesdeAgenda) {
        alert("Selecciona un cliente de la agenda para ver sus borradores de informe.");
        return;
    }
    document.getElementById('modalBorradores').classList.remove('oculto');
    const lista = document.getElementById('listaBorradores');
    lista.innerHTML = '<div style="text-align: center; color: #e91e63;"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...</div>';

    const uid = obtenerUid();
    if (!uid || !db) return lista.innerHTML = '<div style="color:var(--error-red);">Sin conexión.</div>';

    try {
        const snapshot = await db.collection("perfiles").doc(uid).collection("borradores_informe")
            .where('cliNombre', '==', document.getElementById('cliNombre').value.trim())
            .get();
            
        let docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
        docs.sort((a,b) => (b.data.fechaGuardado || 0) - (a.data.fechaGuardado || 0));
            
        lista.innerHTML = '';
        if (docs.length === 0) {
            lista.innerHTML = '<div style="color:var(--ngc-text-faded); text-align:center;">No hay borradores.</div>';
            return;
        }

        docs.forEach(b => {
            const p = b.data;
            const fechaStr = p.fechaGuardado ? new Date(p.fechaGuardado).toLocaleDateString() : 'Sin fecha';
            lista.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); border-left: 3px solid #e91e63; padding: 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong style="color: var(--ngc-text-main);">${p.nombreBorrador || p.cliNombre}</strong>
                    </div>
                    <div style="color: var(--ngc-text-faded); font-size: 0.75rem; margin-bottom: 10px;">${fechaStr}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="ngc-btn-small" style="flex:1;" onclick="cargarBorradorNube('${b.id}')">Abrir</button>
                        <button class="ngc-btn-small danger" onclick="eliminarBorradorNube('${b.id}', this)"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        lista.innerHTML = '<div style="color:var(--error-red); text-align:center;">Error al cargar.</div>';
    }
}

function cerrarModalBorradores() {
    document.getElementById('modalBorradores').classList.add('oculto');
}

async function cargarBorradorNube(docId) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    try {
        const doc = await db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('cliNombre').value = data.cliNombre || '';
            document.getElementById('cliTel').value = data.cliTel || '';
            document.getElementById('cliDir').value = data.cliDir || '';
            document.getElementById('obsGenerales').value = data.obsGenerales || '';
            informeParrafos = data.parrafos || [];
            
            clienteDesdeAgenda = true;
            permiteGuardarNube = true;
            nombreBorradorActual = data.nombreBorrador || null;
            
            cerrarModalBorradores();
            document.getElementById('step-cliente').classList.add('oculto');
            document.getElementById('step-trabajo').classList.remove('oculto');
            renderizarParrafos();
            mostrarToast("Borrador Abierto", "Los datos han sido cargados.");
        }
    } catch(e) {
        alert("Error al cargar el borrador.");
    }
}

function eliminarBorradorNube(docId, btnElement) {
    const uid = obtenerUid();
    if (!uid || !db) return;
    if (confirm("¿Eliminar este borrador de la nube?")) {
        db.collection("perfiles").doc(uid).collection("borradores_informe").doc(docId).delete().then(() => {
            btnElement.closest('div').remove();
        });
    }
}

// Utilidad Toast
function mostrarToast(titulo, mensaje) {
    const toast = document.getElementById('toastCliente');
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 10);
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }, 4000);
}

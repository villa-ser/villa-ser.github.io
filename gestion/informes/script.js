// =======================================================
// 1. VARIABLES GLOBALES Y ESTADO
// =======================================================
let clientDetails = { nombre: "", tel: "", dir: "", obs: "" };
let currentClientName = "";
let selectedPhone = "";
let informeParrafos = []; 

// =======================================================
// 2. INICIALIZACIÓN Y MEMORIA GLOBAL
// =======================================================
window.onload = () => {
    cargarClienteGlobal();
    cargarDatosEmpresa();
    renderizarParrafos(); // Por si hay un borrador guardado
};

// Carga la información de la empresa configurada en el menú principal
function cargarDatosEmpresa() {
    const profNombre = localStorage.getItem('villaser_conf_nombre') || 'PROFESIONAL INDEPENDIENTE';
    const profTel = localStorage.getItem('villaser_conf_telefono') || '';
    const profSlogan = localStorage.getItem('villaser_conf_slogan') || '';
    const profLogo = localStorage.getItem('villaser_conf_logo') || '';

    // Llenamos el pie de página del PDF
    document.getElementById('pdf-tel-footer').innerText = profTel ? `📞 ${profTel}` : '';
    document.getElementById('pdf-slogan').innerText = profSlogan || '¡Electricidad Segura, Hogar Tranquilo!';
    document.getElementById('pdf-credenciales').innerText = profNombre;

    // Llenamos el logo del PDF
    const imgPdf = document.getElementById('pdf-img-logo');
    const txtPdf = document.getElementById('pdf-text-logo');
    
    if (imgPdf && txtPdf) {
        if (profLogo && profLogo.startsWith('data:image')) {
            imgPdf.src = profLogo; 
            imgPdf.style.display = 'block'; 
            txtPdf.style.display = 'none';
        } else {
            imgPdf.style.display = 'none'; 
            txtPdf.innerText = profNombre.toUpperCase(); 
            txtPdf.style.display = 'block';
        }
    }
}

// Carga el cliente de otro módulo
function cargarClienteGlobal() {
    const guardado = localStorage.getItem('villaser_cliente_global');
    if (guardado) {
        try {
            const datos = JSON.parse(guardado);
            if (datos.nombre || datos.tel || datos.dir) {
                document.getElementById('cliNombre').value = datos.nombre || '';
                document.getElementById('cliTel').value = datos.tel || '';
                document.getElementById('cliDir').value = datos.dir || '';
                document.getElementById('cliObs').value = datos.obs || datos.proyecto || ''; // Soporta "proyecto" del módulo materiales
                
                clientDetails = datos;
                currentClientName = datos.nombre || '';
                selectedPhone = datos.tel ? datos.tel.replace(/\D/g, '') : '';
                
                mostrarToast();
            }
        } catch (e) {
            console.error("Error al leer cliente global", e);
        }
    }
}

function guardarClienteGlobal() {
    clientDetails = {
        nombre: document.getElementById('cliNombre').value.trim(),
        tel: document.getElementById('cliTel').value.trim(),
        dir: document.getElementById('cliDir').value.trim(),
        obs: document.getElementById('cliObs').value.trim(),
        proyecto: document.getElementById('cliObs').value.trim() // Retrocompatibilidad
    };
    
    currentClientName = clientDetails.nombre;
    selectedPhone = clientDetails.tel.replace(/\D/g, '');
    
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clientDetails));
}

function mostrarToast() {
    const toast = document.getElementById('toastCliente');
    if (toast) {
        toast.classList.remove('oculto');
        setTimeout(cerrarToast, 5000); 
    }
}

function cerrarToast() {
    const toast = document.getElementById('toastCliente');
    if (toast) toast.classList.add('oculto');
}

function confirmarCliente() {
    guardarClienteGlobal(); 
    
    if (!clientDetails.nombre) {
        alert("Por favor, ingrese al menos el nombre del cliente.");
        document.getElementById('cliNombre').focus();
        return;
    }
    
    const b = document.getElementById('btnCli'); 
    b.innerText = "✓ LISTO"; 
    b.classList.add('btn-success-active');
    
    setTimeout(() => { 
        document.getElementById('section-client').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        actualizarVistaPreviews();
    }, 500);
}

// =======================================================
// 3. GESTIÓN DE PÁRRAFOS DEL INFORME
// =======================================================

function revisarOrtografia() {
    const textarea = document.getElementById('textoInforme');
    if (textarea.value.trim() === '') {
        alert("No hay texto para revisar.");
        return;
    }
    textarea.focus();
    textarea.select();
    btnAlert('btnRevisar', '🔍 REVISAR');
}

function agregarParrafo() {
    const texto = document.getElementById('textoInforme').value.trim();
    if (texto === "") {
        alert("Escriba un párrafo antes de agregar.");
        return;
    }
    informeParrafos.push(texto);
    document.getElementById('textoInforme').value = "";
    
    btnAlert('btnAgregarParrafo', '+ AGREGAR');
    renderizarParrafos();
}

function eliminarParrafo(index) {
    if (confirm("¿Eliminar este párrafo?")) {
        informeParrafos.splice(index, 1);
        renderizarParrafos();
    }
}

function editarParrafo(index) {
    const parrafoActual = informeParrafos[index];
    document.getElementById('textoInforme').value = parrafoActual;
    informeParrafos.splice(index, 1);
    renderizarParrafos();
    document.getElementById('textoInforme').focus();
}

function renderizarParrafos() {
    const contenedor = document.getElementById('lista-parrafos');
    contenedor.innerHTML = '';
    
    informeParrafos.forEach((parrafo, index) => {
        const div = document.createElement('div');
        div.className = 'parrafo-item';
        div.innerHTML = `
            <p>${parrafo}</p>
            <div class="parrafo-actions">
                <button class="btn-edit-p" onclick="editarParrafo(${index})" title="Editar">✏️</button>
                <button class="btn-del-p" onclick="eliminarParrafo(${index})" title="Eliminar">🗑️</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
    
    actualizarVistaPreviews();
}

function actualizarVistaPreviews() {
    // 1. Llenar Preview de Pantalla
    const infoClientArea = document.getElementById('previewClientInfo');
    infoClientArea.innerHTML = `
        <strong>Cliente:</strong> ${clientDetails.nombre}<br>
        <strong>Dirección:</strong> ${clientDetails.dir || '-'}<br>
        <strong>Referencia:</strong> ${clientDetails.obs || '-'}
    `;
    
    const previewArea = document.getElementById('previewInforme');
    previewArea.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 15px;">${p}</p>`).join('');

    // 2. Llenar Preview del PDF Oculto
    const fechaLarga = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('pdf-fecha').innerText = fechaLarga;
    document.getElementById('pdf-cliente').innerText = clientDetails.nombre;
    document.getElementById('pdf-dir').innerText = clientDetails.dir || 'A coordinar';
    
    const pdfTexto = document.getElementById('pdf-texto-contenido');
    pdfTexto.innerHTML = informeParrafos.map(p => `<p>${p}</p>`).join('');
}

// =======================================================
// 4. ACCIONES FINALES (PDF, Imagen, WhatsApp, Export)
// =======================================================

function btnAlert(id, text) {
    const b = document.getElementById(id); 
    b.innerHTML = "¡LISTO!"; 
    b.classList.add('btn-success-active');
    setTimeout(() => { 
        b.innerHTML = text; 
        b.classList.remove('btn-success-active'); 
    }, 800);
}

async function copyTitle() {
    const shortName = currentClientName ? currentClientName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : "Cliente";
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const title = `${shortName}_Villaser_Informe_${dd}-${mm}-${yyyy}`;
    
    try {
        await navigator.clipboard.writeText(title);
        btnAlert('btnCopyTitle', '📋 TÍTULO');
    } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = title;
        textArea.style.position = "fixed"; textArea.style.left = "-9999px";
        document.body.appendChild(textArea); 
        textArea.focus(); textArea.select();
        document.execCommand('copy'); 
        btnAlert('btnCopyTitle', '📋 TÍTULO');
        document.body.removeChild(textArea);
    }
}

async function takeScreenshot() {
    if (informeParrafos.length === 0) {
        alert("El informe está vacío.");
        return;
    }
    
    const area = document.getElementById('captureSection');
    
    // Preparar colores para la captura
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor = isLightMode ? "#ffffff" : "#181818";
    area.style.color = isLightMode ? "#1a1a1a" : "#ffffff";
    area.style.border = "none";
    window.scrollTo(0, 0);

    html2canvas(area, { backgroundColor: bgColor, scale: 2, useCORS: true, scrollY: 0 }).then(canvas => {
        const link = document.createElement('a');
        const shortName = currentClientName ? currentClientName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : "Cliente";
        link.download = `Informe_${shortName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        area.style.color = ""; 
        area.style.border = "";
    });
}

async function generarPDF() {
    if (informeParrafos.length === 0) {
        alert("Agregue al menos un párrafo para generar el informe.");
        return;
    }
    
    actualizarVistaPreviews();
    const element = document.getElementById('plantilla-pdf');
    
    // Lo mostramos temporalmente para html2pdf
    element.style.display = 'block';
    window.scrollTo(0, 0);
    
    const shortName = currentClientName ? currentClientName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : "Cliente";
    
    const opt = {
        margin:       0, 
        filename:     `${shortName}_Informe_Tecnico.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    btnAlert('btnGenerarPDF', '📄 GENERANDO...');
    
    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error("Error al generar PDF", error);
        alert("Ocurrió un error al generar el PDF.");
    } finally {
        element.style.display = 'none';
    }
}

function sendWSP() {
    if (informeParrafos.length === 0) {
        alert("El informe está vacío.");
        return;
    }
    
    let text = `*INFORME TÉCNICO*\n`;
    text += `*Cliente:* ${clientDetails.nombre}\n`;
    if(clientDetails.dir) text += `*Dirección:* ${clientDetails.dir}\n`;
    text += `\n`;
    
    informeParrafos.forEach(p => {
        text += `${p}\n\n`;
    });

    let cleanNumber = selectedPhone;
    if (!cleanNumber) { 
        cleanNumber = prompt("Ingrese el número de WhatsApp del cliente (Ej: 3511234567):", "");
        if (!cleanNumber) return;
        cleanNumber = cleanNumber.replace(/\D/g, '');
    }

    if (cleanNumber.length === 10) cleanNumber = "549" + cleanNumber;
    else if (!cleanNumber.startsWith("54")) cleanNumber = "549" + cleanNumber;
    
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`, '_blank');
}

// =======================================================
// 5. EXPORTAR / IMPORTAR BORRADORES (.TXT / JSON)
// =======================================================

function exportToTxt() {
    if (informeParrafos.length === 0 && !clientDetails.nombre) {
        alert("No hay datos para guardar.");
        return;
    }
    
    const data = {
        cliente: clientDetails,
        parrafos: informeParrafos
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const shortName = currentClientName ? currentClientName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : "Borrador";
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_${shortName}_Villaser.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    btnAlert('btnExport', '💾 GUARDADO');
}

function importFromTxt(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.cliente) {
                document.getElementById('cliNombre').value = data.cliente.nombre || '';
                document.getElementById('cliTel').value = data.cliente.tel || '';
                document.getElementById('cliDir').value = data.cliente.dir || '';
                document.getElementById('cliObs').value = data.cliente.obs || '';
                guardarClienteGlobal();
            }
            
            if (data.parrafos && Array.isArray(data.parrafos)) {
                informeParrafos = data.parrafos;
            }
            
            // Forzar avance a la pantalla de edición
            document.getElementById('section-client').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            
            renderizarParrafos();
            btnAlert('btnImport', '📂 CARGADO');
            
        } catch (error) {
            console.error(error);
            alert("El archivo no tiene el formato correcto.");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // reset input
}

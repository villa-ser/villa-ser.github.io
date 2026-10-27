// --- LÓGICA DE TEMA AUTOMÁTICO EN TIEMPO REAL ---
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
    
    // Solo cambia automáticamente si el usuario lo tiene en modo "Sistema"
    if (temaGuardado === 'system') {
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
});

let clientDetails = { nombre: "", tel: "", dir: "", obs: "" };
let currentClientName = "";
let selectedPhone = "";
let informeParrafos = []; 

window.onload = () => {
    cargarClienteGlobal();
    cargarDatosEmpresa();
    renderizarParrafos(); 
};

function cargarDatosEmpresa() {
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

function cargarClienteGlobal() {
    const guardado = localStorage.getItem('villaser_cliente_global');
    if (guardado) {
        try {
            const datos = JSON.parse(guardado);
            if (datos.nombre || datos.dir) {
                document.getElementById('cliNombre').value = datos.nombre || '';
                document.getElementById('cliDir').value = datos.dir || '';
                document.getElementById('cliObs').value = datos.obs || datos.proyecto || ''; 
                
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
        tel: selectedPhone, 
        dir: document.getElementById('cliDir').value.trim(),
        obs: document.getElementById('cliObs').value.trim(),
        proyecto: document.getElementById('cliObs').value.trim() 
    };
    currentClientName = clientDetails.nombre;
    localStorage.setItem('villaser_cliente_global', JSON.stringify(clientDetails));
}

function mostrarToast() {
    const toast = document.getElementById('toastCliente');
    if (toast) {
        toast.classList.remove('oculto');
        setTimeout(() => toast.classList.add('mostrar'), 10);
        setTimeout(cerrarToast, 5000); 
    }
}

function cerrarToast() {
    const toast = document.getElementById('toastCliente');
    if (toast) {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400); 
    }
}

function confirmarCliente() {
    guardarClienteGlobal(); 
    
    if (!clientDetails.nombre) {
        alert("Por favor, ingrese al menos el nombre del cliente.");
        document.getElementById('cliNombre').focus();
        return;
    }
    
    const b = document.getElementById('btnCli'); 
    b.innerHTML = '<i class="fa-solid fa-check"></i> LISTO'; 
    b.style.background = 'var(--success-green)'; b.style.color = '#fff'; b.style.borderColor = 'var(--success-green)';
    
    setTimeout(() => { 
        document.getElementById('section-client').classList.add('oculto');
        document.getElementById('main-content').classList.remove('oculto');
        document.getElementById('main-content').classList.add('flex-column', 'gap-15');
        
        b.innerHTML = '<i class="fa-solid fa-play"></i> Comenzar Informe';
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '';
        actualizarVistaPreviews();
    }, 500);
}

function agregarParrafo() {
    const texto = document.getElementById('textoInforme').value.trim();
    if (texto === "") {
        alert("Escriba un párrafo antes de agregar.");
        return;
    }
    informeParrafos.push(texto);
    document.getElementById('textoInforme').value = "";
    
    btnAlert('btnAgregarParrafo', '<i class="fa-solid fa-plus"></i> AGREGAR PÁRRAFO');
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
                <button class="btn-edit-p" onclick="editarParrafo(${index})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-del-p" onclick="eliminarParrafo(${index})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        contenedor.appendChild(div);
    });
    
    actualizarVistaPreviews();
}

function actualizarVistaPreviews() {
    const infoClientArea = document.getElementById('previewClientInfo');
    infoClientArea.innerHTML = `
        <strong>Cliente:</strong> ${clientDetails.nombre}<br>
        <strong>Dirección:</strong> ${clientDetails.dir || '-'}<br>
        <strong>Referencia:</strong> ${clientDetails.obs || '-'}
    `;
    
    const previewArea = document.getElementById('previewInforme');
    previewArea.innerHTML = informeParrafos.map(p => `<p style="margin-bottom: 10px; text-indent: 15px;">${p}</p>`).join('');

    // Actualizar Global Notes en la Captura
    const og = document.getElementById('obsGenerales').value;
    const previewGlobales = document.getElementById('previewNotasGlobales');
    if (og) {
        previewGlobales.innerText = `Nota: ${og}`;
        previewGlobales.style.display = 'block';
    } else {
        previewGlobales.style.display = 'none';
    }

    // Actualizar Global Notes en PDF
    const pdfFecha = document.getElementById('pdf-fecha');
    const pdfCliente = document.getElementById('pdf-cliente');
    const pdfDir = document.getElementById('pdf-dir');
    const pdfTexto = document.getElementById('pdf-texto-contenido');
    const pdfNotasBox = document.getElementById('pdf-notas-box');
    const pdfNotas = document.getElementById('pdf-notas');

    if(pdfFecha) pdfFecha.innerText = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    if(pdfCliente) pdfCliente.innerText = clientDetails.nombre;
    if(pdfDir) pdfDir.innerText = clientDetails.dir || 'A coordinar';
    if(pdfTexto) pdfTexto.innerHTML = informeParrafos.map(p => `<p>${p}</p>`).join('');

    if (og && pdfNotasBox && pdfNotas) {
        pdfNotas.innerText = og;
        pdfNotasBox.style.display = 'block';
    } else if (pdfNotasBox) {
        pdfNotasBox.style.display = 'none';
    }
}

function btnAlert(id, text) {
    const b = document.getElementById(id); 
    const originalText = b.innerHTML;
    b.innerHTML = '<i class="fa-solid fa-check"></i> ¡LISTO!'; 
    b.style.background = 'var(--success-green)'; b.style.color = '#fff'; b.style.borderColor = 'var(--success-green)';
    setTimeout(() => { 
        b.innerHTML = text || originalText; 
        b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; 
    }, 1000);
}

async function takeScreenshot() {
    if (informeParrafos.length === 0) {
        alert("El informe está vacío.");
        return;
    }
    
    const area = document.getElementById('captureSection');
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

    btnAlert('btnGenerarPDF', '<i class="fa-solid fa-file-pdf"></i> GENERANDO...');
    
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

    const og = document.getElementById('obsGenerales').value;
    if (og) text += `*NOTAS GLOBALES:*\n${og}\n`;

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

function exportToTxt() {
    const og = document.getElementById('obsGenerales').value;
    if (informeParrafos.length === 0 && !clientDetails.nombre && !og) {
        alert("No hay datos para guardar.");
        return;
    }
    
    const data = {
        cliente: clientDetails,
        parrafos: informeParrafos,
        obsGenerales: og
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
                document.getElementById('cliDir').value = data.cliente.dir || '';
                document.getElementById('cliObs').value = data.cliente.obs || '';
                selectedPhone = data.cliente.tel || '';
                guardarClienteGlobal();
            }
            
            if (data.parrafos && Array.isArray(data.parrafos)) {
                informeParrafos = data.parrafos;
            }

            if (data.obsGenerales) {
                document.getElementById('obsGenerales').value = data.obsGenerales;
            } else {
                document.getElementById('obsGenerales').value = '';
            }
            
            document.getElementById('section-client').classList.add('oculto');
            document.getElementById('main-content').classList.remove('oculto');
            
            renderizarParrafos();
            
        } catch (error) {
            console.error(error);
            alert("El archivo no tiene el formato correcto.");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; 
}

function nuevoInforme() {
    if (confirm("¿Estás seguro de iniciar un nuevo informe? Se borrarán los datos actuales de la pantalla.")) {
        document.getElementById('cliNombre').value = '';
        document.getElementById('cliDir').value = '';
        document.getElementById('cliObs').value = '';
        document.getElementById('obsGenerales').value = '';
        selectedPhone = '';
        
        informeParrafos = [];
        
        document.getElementById('main-content').classList.add('oculto');
        document.getElementById('section-client').classList.remove('oculto');
        
        guardarClienteGlobal();
        renderizarParrafos();
    }
}
    

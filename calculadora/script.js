document.addEventListener("DOMContentLoaded", () => {
    // 1. LÓGICA DE ANIMACIÓN FADE-IN EN ESCALERA (SCROLL)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -20px 0px', 
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        const elementosVisibles = entries.filter(entry => entry.isIntersecting);
        elementosVisibles.forEach((entry, index) => {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 120); 
            observer.unobserve(entry.target);
        });
    }, observerOptions);

    const elementosAnimar = document.querySelectorAll('.fade-in-up');
    elementosAnimar.forEach(el => observer.observe(el));

    // Renderizar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

let listado = [];
let tarifasGlobales = null;

const recomendacionesData = {
    "Heladera con Freezer": { horas: 8, dias: 7, desc: "El compresor arranca y se detiene automáticamente. En promedio, consume energía nominal únicamente unas 8 horas al día." },
    "Freezer Pozo": { horas: 8, dias: 7, desc: "Al igual que una heladera, el compresor corta cuando alcanza la temperatura óptima." },
    "Aire Acondicionado (3000f)": { horas: 4, dias: 7, desc: "Si lo usas 8 horas para dormir (ej. 24°C), el compresor corta periódicamente. Estimamos 4 horas de consumo real nominal." },
    "Aire Acondicionado (4500f)": { horas: 4, dias: 7, desc: "El motor no funciona el 100% del tiempo. Se estiman aproximadamente 4 horas de consumo nominal." },
    "Termotanque Eléctrico": { horas: 3, dias: 7, desc: "La resistencia calienta agua entre 2 y 4 horas diarias, dependiendo del uso." },
    "Radiador Eléctrico": { horas: 4, dias: 7, desc: "Posee un termostato de corte. La resistencia funcionará la mitad del tiempo de encendido." },
    "Caloventor / Estufa Cuarzo": { horas: 4, dias: 7, desc: "Suelen apagarse por termostato interno o manualmente. Promedio de 4 horas a potencia nominal." },
    "Plancha de Ropa": { horas: 1, dias: 2, desc: "Corta el consumo constantemente. Una sesión de 2 horas reales consume energía por aproximadamente 1 hora." }
};

let aparatoActualRecomendado = null;

document.addEventListener("DOMContentLoaded", () => {
    const sliderHoras = document.getElementById("horas");
    const labelHoras = document.getElementById("horas-val");
    if(sliderHoras && labelHoras) {
        sliderHoras.addEventListener("input", (e) => {
            labelHoras.innerText = e.target.value + " hs";
        });
    }

    const sliderDias = document.getElementById("dias");
    const labelDias = document.getElementById("dias-val");
    if(sliderDias && labelDias) {
        sliderDias.addEventListener("input", (e) => {
            labelDias.innerText = e.target.value + " días";
        });
    }

    fetch('tarifas.json')
        .then(res => res.json())
        .then(datos => {
            tarifasGlobales = datos;
            recalcularTotal();
        })
        .catch(() => {
            tarifasGlobales = {
                con_subsidio: [121.84597, 191.10731, 219.23668, 333.61670],
                sin_subsidio: [217.91977, 296.03448, 327.75950, 358.33820],
                factor_impuestos: 1.36
            };
            recalcularTotal();
        });
});

function abrirModalAparatos() { 
    document.getElementById('modal-aparatos').classList.remove('oculto'); 
}

function cerrarModalAparatos() { 
    document.getElementById('modal-aparatos').classList.add('oculto'); 
    
    // Resetea los acordeones para que al volver a abrir estén prolijamente cerrados
    setTimeout(() => {
        document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.acc-icon-indicator').forEach(i => i.style.transform = 'rotate(0deg)');
    }, 300);
}

// Función que abre y cierra las listas del modal
function toggleAccordion(targetId) {
    const targetContent = document.getElementById(targetId);
    if(!targetContent) return;

    const headerIcon = targetContent.previousElementSibling.querySelector('.acc-icon-indicator');
    const isOpening = targetContent.style.display === 'none' || targetContent.style.display === '';

    // Primero cerramos absolutamente todos los acordeones
    document.querySelectorAll('.accordion-content').forEach(c => {
        c.style.display = 'none';
    });
    // Volvemos todas las flechitas a su posición original
    document.querySelectorAll('.acc-icon-indicator').forEach(i => {
        i.style.transform = 'rotate(0deg)';
    });

    // Si se hizo clic para abrirlo, lo desplegamos
    if (isOpening) {
        targetContent.style.display = 'flex'; 
        targetContent.style.flexDirection = 'column'; 
        if(headerIcon) headerIcon.style.transform = 'rotate(180deg)';
    }
}

// ==========================================
// CONTROL SECUENCIAL DE MODALES Y SELECCIÓN
// ==========================================

function selectOption(val, text) {
    const hiddenInput = document.getElementById('aparato');
    hiddenInput.value = val;
    hiddenInput.setAttribute('data-text', text);
    
    document.getElementById('aparato-seleccionado-nombre').innerText = text;
    document.getElementById('aparato-seleccionado-watts').innerText = val + " W de potencia (Nominal)"; 
    
    // Mostramos qué aparato se eligió de fondo
    document.getElementById('btn-aparato-trigger').classList.add('oculto');
    document.getElementById('aparato-seleccionado-container').classList.remove('oculto');
    
    // 1. Cerramos el primer modal (Selección de aparato)
    cerrarModalAparatos();

    // 2. Comprobamos si hay recomendación y aplicamos el retraso (animación)
    if (recomendacionesData[text]) {
        aparatoActualRecomendado = text;
        
        // Retraso de 0.6 segundos para que abra el modal de recomendación suavemente
        setTimeout(() => {
            abrirModalRecomendacion();
        }, 600); 
        
    } else {
        aparatoActualRecomendado = null;
        
        // Si no hay recomendación, esperamos 0.6s y mostramos el modal manual
        setTimeout(() => {
            abrirModalManual();
        }, 600);
    }
}

// Funciones del Modal Técnico (Recomendación)
function abrirModalRecomendacion() {
    if(!aparatoActualRecomendado || !recomendacionesData[aparatoActualRecomendado]) return;
    
    const data = recomendacionesData[aparatoActualRecomendado];
    
    // Inyectamos el título y el texto dinámico en el modal
    document.getElementById('modal-titulo').innerText = "Configuración Recomendada";
    document.getElementById('modal-reco-desc').innerHTML = `
        <strong style="color: var(--ngc-neon); display: block; margin-bottom: 12px; font-size: 1.05rem;">
            Uso sugerido: ${data.horas} hs y ${data.dias} días.
        </strong>
        ${data.desc}
    `;
    
    document.getElementById('modal-recomendacion').classList.remove('oculto');
}

function cerrarModalRecomendacion() {
    document.getElementById('modal-recomendacion').classList.add('oculto');
}

function usarRecomendacion() {
    if(!aparatoActualRecomendado || !recomendacionesData[aparatoActualRecomendado]) return;
    const { horas, dias } = recomendacionesData[aparatoActualRecomendado];
    document.getElementById('horas').value = horas;
    document.getElementById('horas-val').innerText = horas + " hs";
    document.getElementById('dias').value = dias;
    document.getElementById('dias-val').innerText = dias + " días";
    
    cerrarModalRecomendacion();
    
    // Un pequeño retraso para que cierre el modal antes de agregar a la lista
    setTimeout(() => {
        agregarItem();
    }, 400);
}

function ingresoManual() {
    // Cerramos el modal de recomendación
    cerrarModalRecomendacion();
    
    // Retraso de 0.6 segundos para que termine la animación de cierre 
    // antes de mostrar el panel manual
    setTimeout(() => {
        abrirModalManual();
    }, 600);
}

// Funciones del Nuevo Modal Manual
function abrirModalManual() {
    document.getElementById('modal-manual').classList.remove('oculto');
}

function cerrarModalManual() {
    document.getElementById('modal-manual').classList.add('oculto');
}


// Cierre global haciendo click en el fondo de cualquier modal
document.addEventListener("click", function(event) {
    const modalAparatos = document.getElementById('modal-aparatos');
    const modalReco = document.getElementById('modal-recomendacion');
    const modalManual = document.getElementById('modal-manual'); 
    
    if (event.target === modalAparatos) cerrarModalAparatos();
    if (event.target === modalReco) cerrarModalRecomendacion();
    if (event.target === modalManual) cerrarModalManual();
});

// ==========================================
// FUNCIONES GENERALES (AGREGAR, RESETEAR Y CALCULAR)
// ==========================================

function agregarItem() {
    const inputObj = document.getElementById('aparato');
    const horasObj = document.getElementById('horas');
    const diasObj = document.getElementById('dias');
    
    if (!inputObj || inputObj.value == "0") return;
    
    const nombre = inputObj.getAttribute('data-text'); 
    const kwhMensual = (parseFloat(inputObj.value) * parseFloat(horasObj.value) * (parseFloat(diasObj.value)/7) * 30) / 1000;
    
    listado.push({ id: Date.now(), nombre, kwhMensual });
    
    inputObj.value = "0";
    
    // Resetea la interfaz de fondo y oculta la configuración actual
    document.getElementById('btn-aparato-trigger').classList.remove('oculto');
    document.getElementById('aparato-seleccionado-container').classList.add('oculto');
    
    // Cierra el modal manual automáticamente al añadir
    cerrarModalManual();
    
    render();
}


function resetAll() {
    listado = [];
    const inputObj = document.getElementById('aparato');
    if(inputObj) {
        inputObj.value = "0";
        inputObj.setAttribute('data-text', "");
    }
    
    document.getElementById("horas").value = 4; document.getElementById("horas-val").innerText = "4 hs";
    document.getElementById("dias").value = 7; document.getElementById("dias-val").innerText = "7 días";
    
    document.getElementById('btn-aparato-trigger').classList.remove('oculto');
    document.getElementById('aparato-seleccionado-container').classList.add('oculto');
    
    // Nos aseguramos que todos los modales estén cerrados si alguien hace un reset forzado
    cerrarModalRecomendacion();
    cerrarModalManual();
    
    render();
}

function eliminar(id) {
    listado = listado.filter(i => i.id !== id);
    render();
}

function render() {
    const lista = document.getElementById('lista-items');
    lista.innerHTML = '';
    
    listado.forEach(item => {
        const div = document.createElement('div');
        div.className = 'corp-card fade-in-up visible';
        div.style.padding = '15px';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="font-weight: 700; color: var(--ngc-text-main); font-size: 0.95rem;">${item.nombre}</div>
                    <div style="font-size: 0.75rem; color: var(--ngc-text-faded); margin-top: 3px;">
                        <i class="fa-solid fa-bolt corp-accent-color"></i> ${item.kwhMensual.toFixed(1)} kWh agregados
                    </div>
                </div>
                <button class="corp-btn-icon danger" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="eliminar(${item.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
            <div id="item-desglose-${item.id}" style="font-size: 0.8rem; background: var(--ngc-bg-input); padding: 10px; border-radius: 8px; border: 1px solid var(--ngc-privacy-border);"></div>
        `;
        lista.prepend(div); 
    });
    recalcularTotal();
}

function recalcularTotal() {
    const tarifaRadio = document.querySelector('input[name="tarifa"]:checked');
    if (!tarifaRadio || !tarifasGlobales) return; 
    
    const tipoTarifa = tarifaRadio.value;
    let kwhAcumulados = 0;
    let costoEnergiaPuraTotal = 0;
    let tarifasRangos = tipoTarifa === "con_subsidio" ? tarifasGlobales.con_subsidio : tarifasGlobales.sin_subsidio;
    
    const resultadosCalculados = listado.map(item => {
        let kwhRestantes = item.kwhMensual;
        let costoItem = 0;
        let desgloseLineas = [];

        while (kwhRestantes > 0.0001) {
            let finEscalon = 0, precioKwh = 0, nombreEscalon = "", colorHex = "";
            if (kwhAcumulados < 120) { finEscalon = 120; precioKwh = tarifasRangos[0]; nombreEscalon = "Esc. 1 (0-120)"; colorHex = "var(--success-green)"; } 
            else if (kwhAcumulados < 500) { finEscalon = 500; precioKwh = tarifasRangos[1]; nombreEscalon = "Esc. 2 (121-500)"; colorHex = "#F5C33B"; } 
            else if (kwhAcumulados < 700) { finEscalon = 700; precioKwh = tarifasRangos[2]; nombreEscalon = "Esc. 3 (501-700)"; colorHex = "#FF9800"; } 
            else { finEscalon = Infinity; precioKwh = tarifasRangos[3]; nombreEscalon = "Esc. 4 (>700)"; colorHex = "var(--error-red)"; }

            let kwhEnEsteEscalon = Math.min(kwhRestantes, finEscalon - kwhAcumulados);
            let costoParcial = kwhEnEsteEscalon * precioKwh;
            
            costoItem += costoParcial;
            kwhAcumulados += kwhEnEsteEscalon;
            kwhRestantes -= kwhEnEsteEscalon;

            desgloseLineas.push({ texto: `${kwhEnEsteEscalon.toFixed(1)} kWh - ${nombreEscalon}`, subtotal: Math.round(costoParcial * tarifasGlobales.factor_impuestos), color: colorHex });
        }
        costoEnergiaPuraTotal += costoItem;
        return { id: item.id, desglose: desgloseLineas };
    });

    const totalKwh = listado.reduce((sum, i) => sum + i.kwhMensual, 0);
    const totalPesos = Math.round(costoEnergiaPuraTotal * tarifasGlobales.factor_impuestos);

    const kwhUI = document.getElementById('total-kwh');
    const pesosUI = document.getElementById('total-pesos');
    if(kwhUI) kwhUI.innerText = totalKwh.toFixed(2);
    if(pesosUI) pesosUI.innerText = "$ " + totalPesos.toLocaleString('es-AR');

    resultadosCalculados.forEach(res => {
        const contenedor = document.getElementById(`item-desglose-${res.id}`);
        if (contenedor) {
            contenedor.innerHTML = '';
            res.desglose.forEach(linea => {
                const divRow = document.createElement('div');
                divRow.style = 'display: flex; justify-content: space-between; margin-bottom: 4px;';
                divRow.innerHTML = `
                    <span style="color: var(--ngc-text-main);"><i class="fa-solid fa-layer-group" style="color: ${linea.color}; margin-right: 4px; font-size: 0.7rem;"></i> ${linea.texto}</span>
                    <span style="font-weight: 600; color: ${linea.color};">$ ${linea.subtotal.toLocaleString('es-AR')}</span>
                `;
                contenedor.prepend(divRow);
            });
        }
    });

    const tierUI = document.getElementById('tier-indicator');
    if (totalKwh > 0 && tierUI) {
        let textoEscalon = "", nivel = 1;
        if (totalKwh <= 120) { textoEscalon = "Consumo Base (Hasta 120 kWh)"; nivel = 1; } 
        else if (totalKwh <= 500) { textoEscalon = "Consumo Medio (121 a 500 kWh)"; nivel = 2; } 
        else if (totalKwh <= 700) { textoEscalon = "Consumo Alto (501 a 700 kWh)"; nivel = 3; } 
        else { textoEscalon = "Consumo Excedente (Más de 700 kWh)"; nivel = 4; }
        
        document.getElementById('tier-text-container').innerHTML = `
            <i class="fa-solid fa-chart-line corp-accent-color"></i> <span style="color: var(--ngc-text-main);">${textoEscalon}</span> 
            <span style="opacity:0.8; font-size:0.75rem; display:block; margin-top:3px; color: var(--ngc-text-faded);">${tipoTarifa === "con_subsidio" ? "N2/N3 (Con SEF)" : "N1 (Sin SEF)"}</span>
        `;
        
        document.getElementById('seg-1').style.background = nivel >= 1 ? "var(--success-green)" : "var(--ngc-privacy-border)";
        document.getElementById('seg-2').style.background = nivel >= 2 ? "#F5C33B" : "var(--ngc-privacy-border)";
        document.getElementById('seg-3').style.background = nivel >= 3 ? "#FF9800" : "var(--ngc-privacy-border)";
        document.getElementById('seg-4').style.background = nivel >= 4 ? "var(--error-red)" : "var(--ngc-privacy-border)";
        
        tierUI.classList.remove('oculto');
    } else if (tierUI) {
        tierUI.classList.add('oculto');
    }
}
    
// LÓGICA PARA COMPARTIR LA WEB (Nativo en celulares)
function compartirWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'Calculadora de consumo eléctrico en Córdoba Capital | Villaser',
            text: 'Calculá el consumo eléctrico de tu hogar y estimá tu factura de EPEC. Herramienta gratuita para controlar tu gasto y optimizar el ahorro.',
            url: window.location.href
        }).catch((error) => console.log('Error al compartir:', error));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        });
    }
}


    

let listado = [];
let tarifasGlobales = null;

// ==========================================
// BASE DE DATOS DE RECOMENDACIONES TÉCNICAS
// ==========================================
const recomendacionesData = {
    "Heladera con Freezer": { 
        horas: 8, dias: 7, 
        desc: "Aunque la heladera está enchufada 24 horas, su motor (compresor) arranca y se detiene automáticamente gracias al termostato. En promedio, consume energía nominal únicamente unas 8 horas al día." 
    },
    "Freezer Pozo": { 
        horas: 8, dias: 7, 
        desc: "Al igual que una heladera, el compresor corta cuando alcanza la temperatura óptima. Su funcionamiento real promedio es de unas 8 horas diarias." 
    },
    "Aire Acondicionado (3000f)": { 
        horas: 4, dias: 7, 
        desc: "Si lo usas 8 horas para dormir a una temperatura media (ej. 24°C), el compresor corta periódicamente. Se estiman unas 4 horas reales de consumo a potencia nominal." 
    },
    "Aire Acondicionado (4500f)": { 
        horas: 4, dias: 7, 
        desc: "Si lo usas 8 horas a 24°C, el motor no funciona el 100% del tiempo. Se estiman aproximadamente 4 horas de consumo a potencia nominal." 
    },
    "Termotanque Eléctrico": { 
        horas: 3, dias: 7, 
        desc: "Mantiene el agua caliente y corta automáticamente. Aunque está conectado 24/7, la resistencia calienta agua entre 2 y 4 horas diarias, dependiendo de tu uso." 
    },
    "Radiador Eléctrico": { 
        horas: 4, dias: 7, 
        desc: "Posee un termostato de corte. Si lo mantienes encendido 8 horas en una habitación, la resistencia funcionará y consumirá energía aproximadamente la mitad de ese tiempo." 
    },
    "Caloventor / Estufa Cuarzo": { 
        horas: 4, dias: 7, 
        desc: "Al generar mucho calor rápidamente, suelen apagarse por su termostato interno o el usuario los apaga. En un uso de 8 horas, funcionan a potencia nominal unas 4 horas." 
    },
    "Plancha de Ropa": { 
        horas: 1, dias: 2, 
        desc: "La plancha corta el consumo constantemente por temperatura. Una sesión de planchado de 2 horas reales consume energía nominal por aproximadamente 1 hora." 
    }
};

let aparatoActualRecomendado = null; // Para guardar la sugerencia actual

// ==========================================
// 1. CARGA PRINCIPAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- A. ACTIVAR SLIDERS ---
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

    // --- B. CARGAR EL JSON DE TARIFAS ---
    fetch('tarifas.json')
        .then(respuesta => {
            if (!respuesta.ok) throw new Error("No se pudo cargar el archivo");
            return respuesta.json();
        })
        .then(datos => {
            tarifasGlobales = datos;
            recalcularTotal();
        })
        .catch(error => {
            console.warn("No se pudo cargar tarifas.json, usando tarifas por defecto.", error);
            tarifasGlobales = {
                con_subsidio: [121.84597, 191.10731, 219.23668, 333.61670],
                sin_subsidio: [217.91977, 296.03448, 327.75950, 358.33820],
                factor_impuestos: 1.36
            };
            recalcularTotal();
        });
});

// ==========================================
// 2. FUNCIONES DEL MODAL FLOTANTE Y VISIBILIDAD
// ==========================================
function abrirModalAparatos() {
    document.getElementById('modal-aparatos').classList.remove('oculto');
}

function cerrarModalAparatos() {
    document.getElementById('modal-aparatos').classList.add('oculto');
}

function selectOption(val, text) {
    const hiddenInput = document.getElementById('aparato');
    const nameDisplay = document.getElementById('aparato-seleccionado-nombre');
    const wattsDisplay = document.getElementById('aparato-seleccionado-watts');
    
    hiddenInput.value = val;
    hiddenInput.setAttribute('data-text', text);
    nameDisplay.innerText = text;
    
    // Ocultar botón inicial y mostrar contenedor de nombre de aparato
    document.getElementById('btn-aparato-trigger').classList.add('oculto');
    document.getElementById('aparato-seleccionado-container').classList.remove('oculto');
    
    // --- LÓGICA DE RECOMENDACIÓN TÉCNICA ---
    if (recomendacionesData[text]) {
        // El aparato tiene termostato/ciclo
        aparatoActualRecomendado = text;
        wattsDisplay.innerText = val + " W de potencia (Nominal)"; // Etiqueta (Nominal)
        
        document.getElementById('reco-texto').innerText = `Configuración recomendada de ${recomendacionesData[text].horas} horas y ${recomendacionesData[text].dias} días.`;
        document.getElementById('recomendacion-container').classList.remove('oculto');
        
        // Ocultar los deslizadores por defecto para que lean la sugerencia
        document.getElementById('sliders-container').classList.add('oculto');
        document.getElementById('btn-agregar-lista').classList.add('oculto');
    } else {
        // Aparato normal sin ciclos (luces, tv, microondas)
        aparatoActualRecomendado = null;
        wattsDisplay.innerText = val + " W de potencia";
        
        document.getElementById('recomendacion-container').classList.add('oculto');
        document.getElementById('sliders-container').classList.remove('oculto');
        document.getElementById('btn-agregar-lista').classList.remove('oculto');
    }

    cerrarModalAparatos();
}

// Cierra el modal de aparatos si se toca la zona oscura
document.addEventListener("click", function(event) {
    const modalAparatos = document.getElementById('modal-aparatos');
    const modalReco = document.getElementById('modal-recomendacion');
    if (event.target === modalAparatos) cerrarModalAparatos();
    if (event.target === modalReco) cerrarModalRecomendacion();
});

// ==========================================
// 3. LOGICA DEL MODAL DE RECOMENDACIÓN
// ==========================================
function abrirModalRecomendacion() {
    if(!aparatoActualRecomendado || !recomendacionesData[aparatoActualRecomendado]) return;
    
    document.getElementById('modal-reco-desc').innerText = recomendacionesData[aparatoActualRecomendado].desc;
    document.getElementById('modal-recomendacion').classList.remove('oculto');
}

function cerrarModalRecomendacion() {
    document.getElementById('modal-recomendacion').classList.add('oculto');
}

function usarRecomendacion() {
    if(!aparatoActualRecomendado || !recomendacionesData[aparatoActualRecomendado]) return;
    
    // Setear los valores recomendados en los sliders (aunque estén ocultos, sirven para agregarItem)
    const h = recomendacionesData[aparatoActualRecomendado].horas;
    const d = recomendacionesData[aparatoActualRecomendado].dias;
    
    document.getElementById('horas').value = h;
    document.getElementById('horas-val').innerText = h + " hs";
    document.getElementById('dias').value = d;
    document.getElementById('dias-val').innerText = d + " días";
    
    // Cerrar modal y simular clic en agregar
    cerrarModalRecomendacion();
    agregarItem();
}

function ingresoManual() {
    cerrarModalRecomendacion();
    // Ocultar sugerencia y revelar deslizadores normales
    document.getElementById('recomendacion-container').classList.add('oculto');
    document.getElementById('sliders-container').classList.remove('oculto');
    document.getElementById('btn-agregar-lista').classList.remove('oculto');
}

// ==========================================
// 4. FUNCIONES DE CALCULADORA (AGREGAR / RESET)
// ==========================================
function resetAll() {
    listado = [];
    const inputObj = document.getElementById('aparato');
    const sliderHoras = document.getElementById("horas");
    const labelHoras = document.getElementById("horas-val");
    const sliderDias = document.getElementById("dias");
    const labelDias = document.getElementById("dias-val");

    if(inputObj) {
        inputObj.value = "0";
        inputObj.setAttribute('data-text', "");
    }
    if(sliderHoras && labelHoras) { sliderHoras.value = 4; labelHoras.innerText = "4 hs"; }
    if(sliderDias && labelDias) { sliderDias.value = 7; labelDias.innerText = "7 días"; }
    
    // LÓGICA DE VISIBILIDAD (VOLVER AL INICIO)
    const trigger = document.getElementById('btn-aparato-trigger');
    const containerSelected = document.getElementById('aparato-seleccionado-container');
    const recoContainer = document.getElementById('recomendacion-container');
    const sliders = document.getElementById('sliders-container');
    const btnAdd = document.getElementById('btn-agregar-lista');

    if(trigger) trigger.classList.remove('oculto');
    if(containerSelected) containerSelected.classList.add('oculto');
    if(recoContainer) recoContainer.classList.add('oculto');
    if(sliders) sliders.classList.add('oculto');
    if(btnAdd) btnAdd.classList.add('oculto');

    render();
}

function agregarItem() {
    const inputObj = document.getElementById('aparato');
    const horasObj = document.getElementById('horas');
    const diasObj = document.getElementById('dias');
    
    if (!inputObj || !horasObj || !diasObj || inputObj.value == "0") return;
    
    const nombre = inputObj.getAttribute('data-text'); 
    const w = parseFloat(inputObj.value);
    const h = parseFloat(horasObj.value);
    const d = parseFloat(diasObj.value);
    const kwhMensual = (w * h * (d/7) * 30) / 1000;
    
    listado.push({ id: Date.now(), nombre, kwhMensual });
    
    // Resetear el selector después de agregar
    inputObj.value = "0";
    inputObj.setAttribute('data-text', "");
    
    // Preparar UI para nuevo aparato
    document.getElementById('btn-aparato-trigger').classList.remove('oculto');
    document.getElementById('aparato-seleccionado-container').classList.add('oculto');
    document.getElementById('recomendacion-container').classList.add('oculto');
    document.getElementById('sliders-container').classList.add('oculto');
    document.getElementById('btn-agregar-lista').classList.add('oculto');
    
    render();
}

function eliminar(id) {
    listado = listado.filter(i => i.id !== id);
    render();
}

function render() {
    const lista = document.getElementById('lista-items');
    if(!lista) return;

    lista.innerHTML = '';
    
    listado.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row gpu-accel'; 
        div.innerHTML = `
            <div class="item-header">
                <div class="item-info">
                    <strong>${item.nombre}</strong>
                    <span style="display:block; opacity:0.8;"><i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> ${item.kwhMensual.toFixed(1)} kWh agregados</span>
                </div>
                <button class="btn-delete" onclick="eliminar(${item.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
            <div class="item-desglose" id="item-desglose-${item.id}"></div>
        `;
        lista.prepend(div); 
    });
    recalcularTotal();
}

// ==========================================
// 5. LÓGICA DE TARIFAS Y BARRA DE PROGRESO
// ==========================================
function recalcularTotal() {
    const tarifaRadio = document.querySelector('input[name="tarifa"]:checked');
    if (!tarifaRadio || !tarifasGlobales) return; 
    
    const tipoTarifa = tarifaRadio.value;
    let kwhAcumulados = 0;
    let costoEnergiaPuraTotal = 0;

    let tarifasRangos = tipoTarifa === "con_subsidio" ? tarifasGlobales.con_subsidio : tarifasGlobales.sin_subsidio;
    const FACTOR_IMPUESTOS = tarifasGlobales.factor_impuestos;

    const resultadosCalculados = listado.map(item => {
        let kwhRestantes = item.kwhMensual;
        let costoItem = 0;
        let desgloseLineas = [];

        while (kwhRestantes > 0.0001) {
            let finEscalon = 0, precioKwh = 0, nombreEscalon = "", claseColor = "";

            if (kwhAcumulados < 120) {
                finEscalon = 120; precioKwh = tarifasRangos[0]; nombreEscalon = "Esc. 1 (0-120)"; claseColor = "esc-verde";
            } else if (kwhAcumulados < 500) {
                finEscalon = 500; precioKwh = tarifasRangos[1]; nombreEscalon = "Esc. 2 (121-500)"; claseColor = "esc-amarillo";
            } else if (kwhAcumulados < 700) {
                finEscalon = 700; precioKwh = tarifasRangos[2]; nombreEscalon = "Esc. 3 (501-700)"; claseColor = "esc-naranja";
            } else {
                finEscalon = Infinity; precioKwh = tarifasRangos[3]; nombreEscalon = "Esc. 4 (>700)"; claseColor = "esc-rojo";
            }

            let espacioEnEscalon = finEscalon - kwhAcumulados;
            let kwhEnEsteEscalon = Math.min(kwhRestantes, espacioEnEscalon);

            let costoParcial = kwhEnEsteEscalon * precioKwh;
            costoItem += costoParcial;
            kwhAcumulados += kwhEnEsteEscalon;
            kwhRestantes -= kwhEnEsteEscalon;

            desgloseLineas.push({
                texto: `${kwhEnEsteEscalon.toFixed(1)} kWh - ${nombreEscalon}`,
                subtotal: Math.round(costoParcial * FACTOR_IMPUESTOS), 
                clase: claseColor
            });
        }

        costoEnergiaPuraTotal += costoItem;
        return { id: item.id, desglose: desgloseLineas };
    });

    const totalKwh = listado.reduce((sum, i) => sum + i.kwhMensual, 0);
    const totalPesos = Math.round(costoEnergiaPuraTotal * FACTOR_IMPUESTOS);

    const kwhUI = document.getElementById('total-kwh');
    const pesosUI = document.getElementById('total-pesos');
    
    if(kwhUI) kwhUI.innerText = totalKwh.toFixed(2);
    if(pesosUI) pesosUI.innerText = "$ " + totalPesos.toLocaleString('es-AR');

    resultadosCalculados.forEach(res => {
        const contenedorDesglose = document.getElementById(`item-desglose-${res.id}`);
        if (contenedorDesglose) {
            contenedorDesglose.innerHTML = '';
            res.desglose.forEach(linea => {
                const divRow = document.createElement('div');
                divRow.className = 'desglose-line-row';
                divRow.innerHTML = `
                    <span class="linea-escalon ${linea.clase}"><i class="fa-solid fa-layer-group" style="font-size:0.55rem;"></i> ${linea.texto}</span>
                    <span class="item-costo ${linea.clase}">$ ${linea.subtotal.toLocaleString('es-AR')}</span>
                `;
                contenedorDesglose.prepend(divRow);
            });
        }
    });

    const tierUI = document.getElementById('tier-indicator');
    const tierText = document.getElementById('tier-text-container');
    
    if (totalKwh > 0 && tierUI && tierText) {
        
        let textoEscalon = "";
        let nivel = 1;
        
        if (totalKwh <= 120) {
            textoEscalon = "Consumo Base (Hasta 120 kWh)";
            nivel = 1;
        } else if (totalKwh <= 500) {
            textoEscalon = "Consumo Medio (121 a 500 kWh)";
            nivel = 2;
        } else if (totalKwh <= 700) {
            textoEscalon = "Consumo Alto (501 a 700 kWh)";
            nivel = 3;
        } else {
            textoEscalon = "Consumo Excedente (Más de 700 kWh)";
            nivel = 4;
        }
        
        const subText = tipoTarifa === "con_subsidio" ? "Categoría N2/N3 (Subsidio)" : "Categoría N1 (Sin Subsidio)";
        
        tierText.innerHTML = `
            <i class="fa-solid fa-chart-line"></i> <span style="color: var(--ngc-text);">${textoEscalon}</span> 
            <span style="opacity:0.8; font-size:0.65rem; display:block; margin-top:3px; color: var(--ngc-text-muted);">${subText}</span>
        `;
        
        document.getElementById('seg-1').className = 'tier-segment segment-1 ' + (nivel >= 1 ? 'active-1' : '');
        document.getElementById('seg-2').className = 'tier-segment segment-2 ' + (nivel >= 2 ? 'active-2' : '');
        document.getElementById('seg-3').className = 'tier-segment segment-3 ' + (nivel >= 3 ? 'active-3' : '');
        document.getElementById('seg-4').className = 'tier-segment segment-4 ' + (nivel >= 4 ? 'active-4' : '');
        
        tierUI.classList.remove('oculto');
        
    } else if (tierUI) {
        tierUI.classList.add('oculto');
    }
}
    

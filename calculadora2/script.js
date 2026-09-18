let listado = [];
let tarifasGlobales = null;

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
    
    // Asignar el valor al input invisible para los cálculos
    hiddenInput.value = val;
    hiddenInput.setAttribute('data-text', text);
    
    // Mostrar el texto y watts en la cajita inferior
    nameDisplay.innerText = text;
    wattsDisplay.innerText = val + " W de potencia";
    
    // --- LÓGICA DE VISIBILIDAD (FLUJO DE SELECCIÓN) ---
    document.getElementById('btn-aparato-trigger').classList.add('oculto');
    document.getElementById('aparato-seleccionado-container').classList.remove('oculto');
    document.getElementById('sliders-container').classList.remove('oculto');
    document.getElementById('btn-agregar-lista').classList.remove('oculto');
    
    cerrarModalAparatos();
}

// Cierra el modal si se toca la zona oscura fuera de la caja
document.addEventListener("click", function(event) {
    const modal = document.getElementById('modal-aparatos');
    if (event.target === modal) {
        cerrarModalAparatos();
    }
});

// ==========================================
// 3. FUNCIONES DE CALCULADORA (AGREGAR / RESET)
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
    
    // --- LÓGICA DE VISIBILIDAD (VOLVER AL INICIO) ---
    const trigger = document.getElementById('btn-aparato-trigger');
    const containerSelected = document.getElementById('aparato-seleccionado-container');
    const sliders = document.getElementById('sliders-container');
    const btnAdd = document.getElementById('btn-agregar-lista');

    if(trigger) trigger.classList.remove('oculto');
    if(containerSelected) containerSelected.classList.add('oculto');
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
    
    // --- LÓGICA DE VISIBILIDAD (PREPARAR PARA NUEVO APARATO) ---
    document.getElementById('btn-aparato-trigger').classList.remove('oculto');
    document.getElementById('aparato-seleccionado-container').classList.add('oculto');
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
// 4. LÓGICA DE TARIFAS Y BARRA DE PROGRESO
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

    // ACTUALIZACIÓN DEL ESCALAFÓN CON BARRA DE PROGRESO
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
        
        // Encender los segmentos de la barra de acuerdo al nivel actual
        document.getElementById('seg-1').className = 'tier-segment segment-1 ' + (nivel >= 1 ? 'active-1' : '');
        document.getElementById('seg-2').className = 'tier-segment segment-2 ' + (nivel >= 2 ? 'active-2' : '');
        document.getElementById('seg-3').className = 'tier-segment segment-3 ' + (nivel >= 3 ? 'active-3' : '');
        document.getElementById('seg-4').className = 'tier-segment segment-4 ' + (nivel >= 4 ? 'active-4' : '');
        
        tierUI.classList.remove('oculto');
        
    } else if (tierUI) {
        tierUI.classList.add('oculto');
    }
            }

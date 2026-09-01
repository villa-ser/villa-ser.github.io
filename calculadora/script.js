// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE Y CARGAR TARIFAS
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

let listado = [];

// VARIABLE GLOBAL PARA ALMACENAR LAS TARIFAS DEL JSON
let tarifasGlobales = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- CARGA DEL ARCHIVO JSON ---
    try {
        const respuesta = await fetch('tarifas.json');
        if (!respuesta.ok) throw new Error("No se pudo cargar el archivo");
        tarifasGlobales = await respuesta.json();
    } catch (error) {
        console.warn("No se pudo cargar tarifas.json, usando tarifas por defecto.", error);
        // Salvavidas por si el archivo no carga (ej. abriendo localmente sin servidor)
        tarifasGlobales = {
            con_subsidio: [121.84597, 191.10731, 219.23668, 333.61670],
            sin_subsidio: [217.91977, 296.03448, 327.75950, 358.33820],
            factor_impuestos: 1.36
        };
    }

    // --- LÓGICA DEL MENÚ FLOTANTE ---
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });
    }

    document.addEventListener('click', (e) => {
        if (btnMenuFlotante && dropdownFlotante) {
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        }
    });

    // --- LÓGICA DEL MODO DÍA / NOCHE ---
    const btnTema = document.getElementById('btn-tema');
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
        }

        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            if (temaActual === 'light') {
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // --- LÓGICA DE LOS SLIDERS ---
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
});

// ==========================================
// 4. FUNCIONES DEL SELECTOR Y CALCULADORA
// ==========================================

function toggleDropdown(listId, displayId, event) {
    if (event) {
        event.stopPropagation();
    } else if (window.event) {
        window.event.stopPropagation();
    }
    
    const list = document.getElementById(listId);
    const display = document.getElementById(displayId);
    if(!list || !display) return;
    
    const isShowing = list.classList.contains('show');
    closeAllDropdowns();
    
    if (!isShowing) { 
        list.classList.add('show'); 
        display.classList.add('select-arrow-active'); 
    }
}

function selectOption(val, text) {
    const displayAparato = document.getElementById('display-aparato');
    const hiddenInput = document.getElementById('aparato');
    
    if (displayAparato && hiddenInput) {
        displayAparato.innerText = text;
        hiddenInput.value = val;
        hiddenInput.setAttribute('data-text', text);
        closeAllDropdowns();
        actualizarWatts();
    }
}

function closeAllDropdowns() {
    const list = document.getElementById('list-aparato');
    const display = document.getElementById('display-aparato');
    if (list) list.classList.remove('show');
    if (display) display.classList.remove('select-arrow-active');
}

document.addEventListener("click", function(event) {
    const customSelect = event.target.closest('.custom-select');
    if (!customSelect) {
        closeAllDropdowns();
    }
});

function actualizarWatts() {
    const valObj = document.getElementById('aparato');
    const wattsDisplay = document.getElementById('watts_display');
    if(!valObj || !wattsDisplay) return;

    const val = valObj.value;
    if(val == "0") {
        wattsDisplay.innerText = "0 Watts de potencia";
    } else {
        wattsDisplay.innerText = val + " Watts de potencia";
    }
}

function resetAll() {
    listado = [];
    const inputObj = document.getElementById('aparato');
    const displayObj = document.getElementById('display-aparato');
    const wattsDisplay = document.getElementById('watts_display');
    const sliderHoras = document.getElementById("horas");
    const labelHoras = document.getElementById("horas-val");
    const sliderDias = document.getElementById("dias");
    const labelDias = document.getElementById("dias-val");

    if(inputObj && displayObj && wattsDisplay) {
        inputObj.value = "0";
        inputObj.setAttribute('data-text', "");
        displayObj.innerText = "Seleccionar artefacto...";
        wattsDisplay.innerText = "0 Watts de potencia";
    }
    
    if(sliderHoras && labelHoras) { sliderHoras.value = 4; labelHoras.innerText = "4 hs"; }
    if(sliderDias && labelDias) { sliderDias.value = 7; labelDias.innerText = "7 días"; }
    
    render();
}

function agregarItem() {
    const inputObj = document.getElementById('aparato');
    const horasObj = document.getElementById('horas');
    const diasObj = document.getElementById('dias');
    
    if (!inputObj || !horasObj || !diasObj) return;
    if (inputObj.value == "0") return;
    
    const nombre = inputObj.getAttribute('data-text'); 
    const w = parseFloat(inputObj.value);
    const h = parseFloat(horasObj.value);
    const d = parseFloat(diasObj.value);
    
    const kwhMensual = (w * h * (d/7) * 30) / 1000;
    
    listado.push({ id: Date.now(), nombre, kwhMensual });
    
    inputObj.value = "0";
    inputObj.setAttribute('data-text', "");
    
    const displayObj = document.getElementById('display-aparato');
    const wattsDisplay = document.getElementById('watts_display');
    if(displayObj) displayObj.innerText = "Seleccionar artefacto...";
    if(wattsDisplay) wattsDisplay.innerText = "0 Watts de potencia";
    
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

// LÓGICA DE TARIFAS Y LLENADO ACUMULATIVO POR ESCALONES
function recalcularTotal() {
    const tarifaRadio = document.querySelector('input[name="tarifa"]:checked');
    if (!tarifaRadio || !tarifasGlobales) return; // Esperar a que las tarifas estén cargadas
    
    const tipoTarifa = tarifaRadio.value;
    let kwhAcumulados = 0;
    let costoEnergiaPuraTotal = 0;

    // Llamamos a los datos desde nuestro JSON
    let tarifasRangos = tipoTarifa === "con_subsidio" ? tarifasGlobales.con_subsidio : tarifasGlobales.sin_subsidio;
    const FACTOR_IMPUESTOS = tarifasGlobales.factor_impuestos;

    const resultadosCalculados = listado.map(item => {
        let kwhRestantes = item.kwhMensual;
        let costoItem = 0;
        let desgloseLineas = [];

        while (kwhRestantes > 0.0001) {
            let finEscalon = 0;
            let precioKwh = 0;
            let nombreEscalon = "";
            let claseColor = "";

            if (kwhAcumulados < 120) {
                finEscalon = 120;
                precioKwh = tarifasRangos[0];
                nombreEscalon = "Esc. 1 (0-120)";
                claseColor = "esc-verde";
            } else if (kwhAcumulados < 500) {
                finEscalon = 500;
                precioKwh = tarifasRangos[1];
                nombreEscalon = "Esc. 2 (121-500)";
                claseColor = "esc-amarillo";
            } else if (kwhAcumulados < 700) {
                finEscalon = 700;
                precioKwh = tarifasRangos[2];
                nombreEscalon = "Esc. 3 (501-700)";
                claseColor = "esc-naranja";
            } else {
                finEscalon = Infinity;
                precioKwh = tarifasRangos[3];
                nombreEscalon = "Esc. 4 (>700)";
                claseColor = "esc-rojo";
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
    if (totalKwh > 0) {
        let textoEscalon = "";
        let colorEscalon = "var(--gnc-neon)";
        let bgEscalon = "rgba(var(--gnc-neon-rgb), 0.1)";
        
        if (totalKwh <= 120) {
            textoEscalon = "Consumo Base (Hasta 120 kWh)";
        } else if (totalKwh <= 500) {
            textoEscalon = "Consumo Medio (121 a 500 kWh)";
            colorEscalon = "#ffc107";
            bgEscalon = "rgba(255, 193, 7, 0.1)";
        } else if (totalKwh <= 700) {
            textoEscalon = "Consumo Alto (501 a 700 kWh)";
            colorEscalon = "#fd7e14";
            bgEscalon = "rgba(253, 126, 20, 0.1)";
        } else {
            textoEscalon = "Consumo Excedente (Más de 700 kWh)";
            colorEscalon = "var(--gnc-danger)";
            bgEscalon = "rgba(255, 77, 77, 0.1)"; 
        }
        
        const subText = tipoTarifa === "con_subsidio" ? "Categoría N2/N3 (Subsidio)" : "Categoría N1 (Sin Subsidio)";
        
        if (tierUI) {
            tierUI.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${textoEscalon} <span style="opacity:0.8; font-size:0.65rem; display:block; margin-top:3px;">${subText}</span>`;
            tierUI.style.color = colorEscalon;
            tierUI.style.borderColor = colorEscalon;
            tierUI.style.backgroundColor = bgEscalon;
            tierUI.classList.remove('oculto');
        }
    } else {
        if (tierUI) tierUI.classList.add('oculto');
    }
}

function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Calculadora de Consumo',
      text: 'Evaluá el gasto de tus electrodomésticos con la calculadora de Sergio Villagra:',
      url: 'https://villaser.com.ar/calculadora'
    })
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Calculá tu consumo eléctrico con la herramienta de Sergio Villagra: https://villaser.com.ar/calculadora");
    window.open(whatsappUrl, '_blank');
  }
    }
            

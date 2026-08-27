// ==========================================
// 0. APLICAR TEMA INSTANTÁNEAMENTE (Evita parpadeos)
// ==========================================
const temaGuardado = localStorage.getItem('temaVillaser');
if (temaGuardado === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

// Inicializar iconos de Lucide (si se usan)
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

let listado = [];

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. LÓGICA DEL MENÚ FLOTANTE SUPERIOR
    // ==========================================
    const btnMenuFlotante = document.getElementById('btn-menu-flotante');
    const dropdownFlotante = document.getElementById('dropdown-flotante');

    if (btnMenuFlotante && dropdownFlotante) {
        btnMenuFlotante.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague al document
            dropdownFlotante.classList.toggle('oculto');
        });
    }

    // Cerrar menú flotante al hacer clic fuera (Lógica Segura)
    document.addEventListener('click', (e) => {
        if (btnMenuFlotante && dropdownFlotante) {
            // Si el clic NO fue en el botón Explorar, ni en su contenido, lo cerramos
            if (!btnMenuFlotante.contains(e.target) && !dropdownFlotante.contains(e.target)) {
                dropdownFlotante.classList.add('oculto');
            }
        }
    });

    // ==========================================
    // 2. LÓGICA DEL MODO DÍA / MODO NOCHE
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        // Sincronizar iconos según el tema actual guardado
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
        }

        // Alternar tema
        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                // Volver a Modo Oscuro
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
            } else {
                // Cambiar a Modo Día
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // ==========================================
    // 3. LÓGICA DE LOS SLIDERS
    // ==========================================
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
    // Seguridad para navegadores antiguos y nuevos
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

// Cerrar dropdown de aparatos al tocar fuera de él
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
    
    // Resetear sliders si existen
    if(sliderHoras && labelHoras) {
        sliderHoras.value = 4;
        labelHoras.innerText = "4 hs";
    }
    if(sliderDias && labelDias) {
        sliderDias.value = 7;
        labelDias.innerText = "7 días";
    }
    
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
    
    // Reseteamos el selector visualmente tras agregar
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
            <div class="item-info">
                <strong>${item.nombre}</strong>
                <span><i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> ${item.kwhMensual.toFixed(1)} kWh agregados al mes</span>
            </div>
            <div class="item-actions">
                <span class="item-costo" id="item-costo-${item.id}">$ 0</span>
                <button class="btn-delete" onclick="eliminar(${item.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
    recalcularTotal();
}

// LÓGICA DE TARIFAS SEGMENTADAS ESCALONADAS EPEC
function recalcularTotal() {
    const totalKwh = listado.reduce((sum, i) => sum + i.kwhMensual, 0);
    const tarifaRadio = document.querySelector('input[name="tarifa"]:checked');
    if (!tarifaRadio) return; 
    
    const tipoTarifa = tarifaRadio.value;
    let costoEnergiaPura = 0;

    if (totalKwh > 0) {
        if (tipoTarifa === "con_subsidio") {
            if (totalKwh <= 120) {
                costoEnergiaPura = totalKwh * 121.84597;
            } else if (totalKwh <= 500) {
                let bloque1 = 120 * 147.82742;
                let excedente120 = totalKwh - 120;
                let bloque2 = Math.min(excedente120, 180) * 191.10731; 
                let excedente300 = Math.max(0, totalKwh - 300);
                let bloque3 = excedente300 * 278.37436;
                costoEnergiaPura = bloque1 + bloque2 + bloque3;
            } else if (totalKwh <= 700) {
                let bloque1 = 120 * 174.28235;
                let excedente120 = totalKwh - 120;
                let bloque2 = Math.min(excedente120, 180) * 219.23668;
                let excedente300 = Math.max(0, totalKwh - 300);
                let bloque3 = excedente300 * 306.50373;
                costoEnergiaPura = bloque1 + bloque2 + bloque3;
            } else { 
                let bloque1 = 120 * 195.45331;
                let excedente120 = totalKwh - 120;
                let bloque2 = Math.min(excedente120, 180) * 246.34965;
                let excedente300 = Math.max(0, totalKwh - 300);
                let bloque3 = excedente300 * 333.61670;
                costoEnergiaPura = bloque1 + bloque2 + bloque3;
            }
        } else {
            if (totalKwh <= 120) {
                costoEnergiaPura = totalKwh * 217.91977;
            } else if (totalKwh <= 500) {
                let bloque1 = 120 * 247.22232;
                let excedente120 = totalKwh - 120;
                let bloque2 = excedente120 * 296.03448;
                costoEnergiaPura = bloque1 + bloque2;
            } else if (totalKwh <= 700) {
                let bloque1 = 120 * 277.05886;
                let excedente120 = totalKwh - 120;
                let bloque2 = excedente120 * 327.75950;
                costoEnergiaPura = bloque1 + bloque2;
            } else { 
                let bloque1 = 120 * 300.93601;
                let excedente120 = totalKwh - 120;
                let bloque2 = excedente120 * 358.33820;
                costoEnergiaPura = bloque1 + bloque2;
            }
        }
    }

    const FACTOR_IMPUESTOS = 1.36; 
    const totalPesos = Math.round(costoEnergiaPura * FACTOR_IMPUESTOS);

    const kwhUI = document.getElementById('total-kwh');
    const pesosUI = document.getElementById('total-pesos');
    
    if(kwhUI) kwhUI.innerText = totalKwh.toFixed(2);
    if(pesosUI) pesosUI.innerText = "$ " + totalPesos.toLocaleString('es-AR');

    // Distribuimos el total en base al % de consumo de cada aparato
    listado.forEach(item => {
        const itemCostoUI = document.getElementById(`item-costo-${item.id}`);
        if (itemCostoUI) {
            if (totalKwh > 0) {
                const proporcion = item.kwhMensual / totalKwh;
                const costoItem = Math.round(totalPesos * proporcion);
                itemCostoUI.innerText = `$ ${costoItem.toLocaleString('es-AR')}`;
            } else {
                itemCostoUI.innerText = `$ 0`;
            }
        }
    });

    // --- NUEVA LÓGICA: ACTUALIZAR BADGE DE ESCALAFÓN ---
    const tierUI = document.getElementById('tier-indicator');
    if (totalKwh > 0) {
        let textoEscalon = "";
        let colorEscalon = "var(--gnc-neon)";
        let bgEscalon = "rgba(var(--gnc-neon-rgb), 0.1)";
        
        if (totalKwh <= 120) {
            textoEscalon = "Escalón 1: Base (Hasta 120 kWh)";
        } else if (totalKwh <= 500) {
            textoEscalon = "Escalón 2: Medio (121 a 500 kWh)";
        } else if (totalKwh <= 700) {
            textoEscalon = "Escalón 3: Alto (501 a 700 kWh)";
        } else {
            // Peligro por exceso de consumo
            textoEscalon = "Escalón 4: Excedente (Más de 700 kWh)";
            colorEscalon = "var(--gnc-danger)";
            bgEscalon = "rgba(255, 77, 77, 0.1)"; 
        }
        
        const subText = tipoTarifa === "con_subsidio" ? "Tarifa N2/N3 (Subsidio)" : "Tarifa N1 (Sin Subsidio)";
        
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


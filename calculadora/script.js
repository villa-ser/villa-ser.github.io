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
            e.stopPropagation();
            dropdownFlotante.classList.toggle('oculto');
        });

        // Cerrar menú flotante al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownFlotante.contains(e.target) && e.target !== btnMenuFlotante) {
                dropdownFlotante.classList.add('oculto');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DEL MODO DÍA / MODO NOCHE Y LOGO
    // ==========================================
    const btnTema = document.getElementById('btn-tema');
    const imgLogoPrincipal = document.getElementById('img-logo-principal');
    
    if (btnTema) {
        const iconTema = btnTema.querySelector('i');
        
        // Sincronizar iconos según el tema actual guardado
        if (temaGuardado === 'light') {
            iconTema.classList.replace('fa-sun', 'fa-moon');
            if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logoclaro.avif';
        }

        // Alternar tema y logo al hacer click
        btnTema.addEventListener('click', () => {
            const temaActual = document.documentElement.getAttribute('data-theme');
            
            if (temaActual === 'light') {
                // Volver a Modo Oscuro
                document.documentElement.removeAttribute('data-theme'); 
                localStorage.setItem('temaVillaser', 'dark');
                iconTema.classList.replace('fa-moon', 'fa-sun');
                if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logo.avif';
            } else {
                // Cambiar a Modo Día
                document.documentElement.setAttribute('data-theme', 'light'); 
                localStorage.setItem('temaVillaser', 'light');
                iconTema.classList.replace('fa-sun', 'fa-moon');
                if (imgLogoPrincipal) imgLogoPrincipal.src = '../img/logoclaro.avif';
            }
        });
    }

    // ==========================================
    // 3. LÓGICA DE LOS SLIDERS
    // ==========================================
    const sliderHoras = document.getElementById("horas");
    const labelHoras = document.getElementById("horas-val");
    if(sliderHoras) {
        sliderHoras.addEventListener("input", (e) => {
            labelHoras.innerText = e.target.value + " hs";
        });
    }

    const sliderDias = document.getElementById("dias");
    const labelDias = document.getElementById("dias-val");
    if(sliderDias) {
        sliderDias.addEventListener("input", (e) => {
            labelDias.innerText = e.target.value + " días";
        });
    }
});

// ==========================================
// 4. FUNCIONES DEL SELECTOR Y CALCULADORA
// ==========================================

function toggleDropdown(listId, displayId) {
    if (window.event) {
        window.event.stopPropagation();
    }
    
    const list = document.getElementById(listId);
    const display = document.getElementById(displayId);
    const isShowing = list.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isShowing) { 
        list.classList.add('show'); 
        display.classList.add('select-arrow-active'); 
    }
}

function selectOption(val, text) {
    document.getElementById('display-aparato').innerText = text;
    const hiddenInput = document.getElementById('aparato');
    hiddenInput.value = val;
    hiddenInput.setAttribute('data-text', text);
    
    closeAllDropdowns();
    actualizarWatts();
}

function closeAllDropdowns() {
    const list = document.getElementById('list-aparato');
    const display = document.getElementById('display-aparato');
    if (list) list.classList.remove('show');
    if (display) display.classList.remove('select-arrow-active');
}

// Cerrar dropdown al tocar fuera
document.addEventListener("click", function(event) {
    if (!event.target.closest('.custom-select')) {
        closeAllDropdowns();
    }
});

function actualizarWatts() {
    const val = document.getElementById('aparato').value;
    if(val == "0") {
        document.getElementById('watts_display').innerText = "0 Watts de potencia";
    } else {
        document.getElementById('watts_display').innerText = val + " Watts de potencia";
    }
}

function resetAll() {
    listado = [];
    const inputObj = document.getElementById('aparato');
    inputObj.value = "0";
    inputObj.setAttribute('data-text', "");
    document.getElementById('display-aparato').innerText = "Seleccionar artefacto...";
    document.getElementById('watts_display').innerText = "0 Watts de potencia";
    
    // Resetear sliders
    document.getElementById("horas").value = 4;
    document.getElementById("horas-val").innerText = "4 hs";
    document.getElementById("dias").value = 7;
    document.getElementById("dias-val").innerText = "7 días";
    
    render();
}

function agregarItem() {
    const inputObj = document.getElementById('aparato');
    if (inputObj.value == "0") return;
    
    const nombre = inputObj.getAttribute('data-text'); 
    const w = parseFloat(inputObj.value);
    
    const h = parseFloat(document.getElementById('horas').value);
    const d = parseFloat(document.getElementById('dias').value);
    
    const kwhMensual = (w * h * (d/7) * 30) / 1000;
    
    listado.push({ id: Date.now(), nombre, kwhMensual });
    
    // Reseteamos el selector visualmente tras agregar
    inputObj.value = "0";
    inputObj.setAttribute('data-text', "");
    document.getElementById('display-aparato').innerText = "Seleccionar artefacto...";
    document.getElementById('watts_display').innerText = "0 Watts de potencia";
    
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
        div.className = 'item-row';
        div.innerHTML = `
            <div class="item-info">
                <strong>${item.nombre}</strong>
                <span><i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> ${item.kwhMensual.toFixed(1)} kWh agregados al mes</span>
            </div>
            <button class="btn-delete" onclick="eliminar(${item.id})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
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

    document.getElementById('total-kwh').innerText = totalKwh.toFixed(2);
    document.getElementById('total-pesos').innerText = "$ " + totalPesos.toLocaleString('es-AR');
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
            

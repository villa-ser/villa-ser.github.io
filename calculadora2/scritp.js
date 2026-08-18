lucide.createIcons();

let listado = [];

// Funciones del menú desplegable personalizado
function toggleDropdown(listId, displayId) {
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
    if(list) list.classList.remove('show');
    if(display) display.classList.remove('select-arrow-active');
}

document.addEventListener("click", function(event) {
    if (!event.target.matches('.select-selected')) closeAllDropdowns();
});

function actualizarWatts() {
    const val = document.getElementById('aparato').value;
    if(val == "0") {
        document.getElementById('watts_display').innerText = "0 Watts (Aprox)";
    } else {
        document.getElementById('watts_display').innerText = val + " Watts (Aprox)";
    }
}

function resetAll() {
    listado = [];
    const inputObj = document.getElementById('aparato');
    inputObj.value = "0";
    inputObj.setAttribute('data-text', "");
    document.getElementById('display-aparato').innerText = "Seleccionar...";
    document.getElementById('watts_display').innerText = "0 Watts (Aprox)";
    render();
}

function agregarItem() {
    const inputObj = document.getElementById('aparato');
    if(inputObj.value == "0") return;
    
    const nombre = inputObj.getAttribute('data-text'); 
    const w = parseFloat(inputObj.value);
    const h = parseFloat(document.querySelector('input[name="horas"]:checked').value);
    const d = parseFloat(document.querySelector('input[name="dias"]:checked').value);
    const kwhMensual = (w * h * (d/7) * 30) / 1000;
    
    listado.push({ id: Date.now(), nombre, kwhMensual });
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
        div.innerHTML = `<div class="item-info"><strong>${item.nombre}</strong><span>${item.kwhMensual.toFixed(1)} kWh/mes</span></div><button class="btn-delete" onclick="eliminar(${item.id})">🗑️</button>`;
        lista.appendChild(div);
    });
    recalcularTotal();
}

// LÓGICA DE TARIFAS SEGMENTADAS ESCALONADAS
function recalcularTotal() {
    const totalKwh = listado.reduce((sum, i) => sum + i.kwhMensual, 0);
    const tipoTarifa = document.querySelector('input[name="tarifa"]:checked').value;
    
    let costoEnergiaPura = 0;

    if (totalKwh > 0) {
        if (tipoTarifa === "con_subsidio") {
            // SEF (Con Subsidio Energético Focalizado)
            if (totalKwh <= 120) {
                costoEnergiaPura = totalKwh * 121.84597;
            } else if (totalKwh <= 500) {
                let bloque1 = 120 * 147.82742;
                let excedente120 = totalKwh - 120;
                let bloque2 = Math.min(excedente120, 180) * 191.10731; // Cubre los "stes 30" y "stes 150"
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
            } else { // Más de 700 kWh/mes
                let bloque1 = 120 * 195.45331;
                let excedente120 = totalKwh - 120;
                let bloque2 = Math.min(excedente120, 180) * 246.34965;
                let excedente300 = Math.max(0, totalKwh - 300);
                let bloque3 = excedente300 * 333.61670;
                costoEnergiaPura = bloque1 + bloque2 + bloque3;
            }
        } else {
            // SIN SEF (Sin Subsidio)
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
            } else { // Más de 700 kWh/mes
                let bloque1 = 120 * 300.93601;
                let excedente120 = totalKwh - 120;
                let bloque2 = excedente120 * 358.33820;
                costoEnergiaPura = bloque1 + bloque2;
            }
        }
    }

    // MULTIPLICADOR DE IMPUESTOS (21% IVA + 15% Tasas Municipales/Provinciales)
    // El cuadro tarifario refleja la energía sin impuestos; con este coeficiente mantenemos tu funcionalidad original.
    const FACTOR_IMPUESTOS = 1.36; 
    
    const totalPesos = Math.round(costoEnergiaPura * FACTOR_IMPUESTOS);

    document.getElementById('total-kwh').innerText = totalKwh.toFixed(2);
    document.getElementById('total-pesos').innerText = "$ " + totalPesos.toLocaleString('es-AR');
}

function compartirWeb() {
  if (navigator.share) {
    navigator.share({
      title: 'Villaser - Electricista Habilitado',
      text: 'Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba:',
      url: 'https://villaser.com.ar'
    })
    .then(() => console.log('Compartido con éxito'))
    .catch((error) => console.log('Error al compartir', error));
  } else {
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent("Te comparto la web de Sergio Villagra, Electricista Habilitado Cat III en Córdoba: https://villaser.com.ar");
    window.open(whatsappUrl, '_blank');
  }
}


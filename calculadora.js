// Inicializar icono de flecha "Volver"
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
    hiddenInput.setAttribute('data-text', text); // Guardamos el nombre aquí
    closeAllDropdowns();
    actualizarWatts();
}

function closeAllDropdowns() {
    document.getElementById('list-aparato').classList.remove('show');
    document.getElementById('display-aparato').classList.remove('select-arrow-active');
}

document.addEventListener("click", function(event) {
    if (!event.target.matches('.select-selected')) closeAllDropdowns();
});

// Lógica de cálculo 
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

function recalcularTotal() {
    const totalKwh = listado.reduce((sum, i) => sum + i.kwhMensual, 0);
    const tarifa = parseFloat(document.querySelector('input[name="tarifa"]:checked').value);
    const totalPesos = Math.round(totalKwh * tarifa);
    document.getElementById('total-kwh').innerText = totalKwh.toFixed(2);
    document.getElementById('total-pesos').innerText = "$ " + totalPesos.toLocaleString('es-AR');
                                                          }


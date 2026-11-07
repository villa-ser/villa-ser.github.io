let inputActivo = 'inp-v';
let modoActual = 'PRO';

window.onload = () => {
    // Al iniciar, dar foco al primer campo (Tensión)
    setFoco('inp-v');
};

// --- SISTEMA DE TOAST (NOTIFICACIONES) ---
function mostrarToast(titulo, mensaje, esError = false) {
    const toast = document.getElementById('toastNotificacion');
    if (!toast) return;
    
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    
    const icon = document.getElementById('toastIcon');
    if (esError) {
        toast.style.borderLeftColor = 'var(--error-red)';
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.style.color = 'var(--error-red)';
    } else {
        toast.style.borderLeftColor = 'var(--success-green)';
        icon.className = 'fa-solid fa-check-circle';
        icon.style.color = 'var(--success-green)';
    }

    toast.classList.remove('oculto');
    setTimeout(() => toast.classList.add('mostrar'), 10);
    setTimeout(() => cerrarToast(), 3000);
}

function cerrarToast() {
    const toast = document.getElementById('toastNotificacion');
    if (toast) {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.classList.add('oculto'), 400);
    }
}

// --- GESTIÓN DE LA INTERFAZ ---
function setFoco(id) {
    // Apagar todos
    document.querySelectorAll('.calc-input').forEach(el => {
        el.style.borderColor = 'var(--ngc-privacy-border)';
        el.style.boxShadow = 'none';
    });
    
    // Encender el seleccionado
    inputActivo = id;
    const el = document.getElementById(id);
    if(el) {
        el.style.borderColor = 'var(--ngc-neon)';
        el.style.boxShadow = '0 0 10px rgba(var(--ngc-neon-rgb), 0.4)';
    }
}

function cambiarModo(modo) {
    modoActual = modo;
    limpiarTodo();
    
    // Reset visual botones
    document.querySelectorAll('#btn-ohm, #btn-watt, #btn-pro').forEach(btn => btn.classList.remove('modo-activo'));
    
    const contR = document.getElementById('cont-r');
    const contP = document.getElementById('cont-p');
    const instruccion = document.getElementById('instruccion-modo');

    if(modo === 'OHM') {
        document.getElementById('btn-ohm').classList.add('modo-activo');
        contR.style.display = 'block';
        contP.style.display = 'none';
        instruccion.innerHTML = "<b>Ley de Ohm:</b> V = I × R (Ingresa 2 valores)";
        setFoco('inp-v');
    } 
    else if(modo === 'WATT') {
        document.getElementById('btn-watt').classList.add('modo-activo');
        contR.style.display = 'none';
        contP.style.display = 'block';
        instruccion.innerHTML = "<b>Ley de Watt:</b> P = V × I (Ingresa 2 valores)";
        setFoco('inp-v');
    } 
    else {
        document.getElementById('btn-pro').classList.add('modo-activo');
        contR.style.display = 'block';
        contP.style.display = 'block';
        instruccion.innerHTML = "Calculadora PRO: Ingresa <b>2</b> valores para despejar el resto.";
        setFoco('inp-v');
    }
}

// --- TECLADO NUMÉRICO ---
function tecla(val) {
    if(!inputActivo) return;
    const el = document.getElementById(inputActivo);
    
    // Evitar múltiples puntos decimales
    if(val === '.' && el.value.includes('.')) return;
    
    el.value += val;
}

function borrar() {
    if(!inputActivo) return;
    const el = document.getElementById(inputActivo);
    el.value = el.value.slice(0, -1);
}

function limpiarTodo() {
    document.querySelectorAll('.calc-input').forEach(el => el.value = '');
    if(inputActivo) setFoco(inputActivo); // Restaura el foco visual
}

// --- MOTOR MATEMÁTICO DE LEYES ---
function calcular() {
    let v = parseFloat(document.getElementById('inp-v').value);
    let i = parseFloat(document.getElementById('inp-i').value);
    let r = parseFloat(document.getElementById('inp-r').value);
    let p = parseFloat(document.getElementById('inp-p').value);

    let v_ok = !isNaN(v);
    let i_ok = !isNaN(i);
    let r_ok = !isNaN(r);
    let p_ok = !isNaN(p);

    // Contar cuántos valores válidos se ingresaron
    let activos = [v_ok, i_ok, r_ok, p_ok].filter(Boolean).length;

    if (activos < 2) {
        mostrarToast("Faltan Datos", "Debes ingresar exactamente 2 valores.", true);
        return;
    }
    if (activos > 2) {
        mostrarToast("Exceso de Datos", "Borra e ingresa solo 2 valores para calcular el resto.", true);
        return;
    }

    try {
        // Despejes combinados (Rueda Eléctrica Universal)
        if (v_ok && i_ok) { 
            p = v * i; 
            r = v / i; 
        } 
        else if (v_ok && r_ok) { 
            p = (v * v) / r; 
            i = v / r; 
        } 
        else if (v_ok && p_ok) { 
            i = p / v; 
            r = (v * v) / p; 
        } 
        else if (i_ok && r_ok) { 
            v = i * r; 
            p = (i * i) * r; 
        } 
        else if (i_ok && p_ok) { 
            v = p / i; 
            r = p / (i * i); 
        } 
        else if (r_ok && p_ok) { 
            v = Math.sqrt(p * r); 
            i = Math.sqrt(p / r); 
        }

        // Validación de divisiones por cero o negativos
        if (!isFinite(v) || !isFinite(i) || !isFinite(r) || !isFinite(p)) {
            throw new Error("División por cero");
        }

        // Formateo y volcado a los inputs (hasta 2 decimales)
        document.getElementById('inp-v').value = v.toFixed(2).replace(/\.00$/, '');
        document.getElementById('inp-i').value = i.toFixed(2).replace(/\.00$/, '');
        
        if (modoActual !== 'WATT') {
            document.getElementById('inp-r').value = r.toFixed(2).replace(/\.00$/, '');
        }
        if (modoActual !== 'OHM') {
            document.getElementById('inp-p').value = p.toFixed(2).replace(/\.00$/, '');
        }

        mostrarToast("¡Éxito!", "Cálculo realizado correctamente.", false);
        
        // Efecto visual de éxito
        document.querySelectorAll('.calc-input').forEach(el => {
            if(el.value !== "") {
                el.style.borderColor = 'var(--success-green)';
                el.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.2)';
            }
        });

    } catch (error) {
        mostrarToast("Error Matemático", "Los valores ingresados generan un cálculo imposible.", true);
    }
    }
          

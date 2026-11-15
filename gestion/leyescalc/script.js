// ==========================================================================
// VARIABLES DE ESTADO GLOBAL Y NAVEGACIÓN ENTRE CALCULADORAS
// ==========================================================================
let calcActiva = 'leyes'; // 'leyes' | 'caida' | 'termico' | 'potencia'
let toastTimeout = null;

// --- SISTEMA DE TOAST CORPORATIVO ---
function mostrarToast(titulo, mensaje, esError = false) {
    const toast = document.getElementById('toastNotificacion');
    if (!toast) return;
    
    document.getElementById('toastTitle').innerText = titulo;
    document.getElementById('toastMessage').innerText = mensaje;
    
    const icon = document.getElementById('toastIcon');
    if (esError) {
        toast.style.borderLeftColor = 'var(--error-red)';
        toast.style.borderColor = 'var(--error-red)';
        icon.className = 'fa-solid fa-triangle-exclamation toast-icon';
        icon.style.color = 'var(--error-red)';
    } else {
        toast.style.borderLeftColor = 'var(--success-green)';
        toast.style.borderColor = 'var(--success-green)';
        icon.className = 'fa-solid fa-check-circle toast-icon';
        icon.style.color = 'var(--success-green)';
    }

    clearTimeout(toastTimeout);
    toast.classList.add('mostrar');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 3200);
}

// --- CAMBIO ENTRE LAS 4 CALCULADORAS ---
function cambiarCalculadora(id) {
    calcActiva = id;

    // Actualizar botones superiores
    document.querySelectorAll('.nav-calc-btn').forEach(btn => btn.classList.remove('modo-activo'));
    const btnActivo = document.getElementById(`tab-btn-${id}`);
    if (btnActivo) btnActivo.classList.add('modo-activo');

    // Mostrar/Ocultar contenedores
    ['leyes', 'caida', 'termico', 'potencia'].forEach(mod => {
        const sec = document.getElementById(`sec-${mod}`);
        if (sec) sec.classList.toggle('oculto', mod !== id);
    });

    // Actualizar título de barra superior
    const titulos = {
        leyes: '<i class="fa-solid fa-bolt corp-accent-color"></i> LEYES ELÉCTRICAS',
        caida: '<i class="fa-solid fa-arrow-trend-down corp-accent-color"></i> CAÍDA DE TENSIÓN',
        termico: '<i class="fa-solid fa-temperature-half corp-accent-color"></i> BALANCE TÉRMICO',
        potencia: '<i class="fa-solid fa-gears corp-accent-color"></i> POTENCIA Y MOTORES'
    };
    document.getElementById('nav-titulo-modulo').innerHTML = titulos[id] || 'CALCULADORA';
}

function reiniciarModuloActivo() {
    if (calcActiva === 'leyes') leyesLimpiarTodo();
    else if (calcActiva === 'caida') caidaResetAll();
    else if (calcActiva === 'termico') termResetAll();
    else if (calcActiva === 'potencia') potResetAll();
    mostrarToast("Reiniciado", "Valores restablecidos a su estado inicial.");
}

// --- ENRUTADOR DEL TECLADO NUMÉRICO UNIFICADO ---
function numpadTecla(val) {
    if (calcActiva === 'leyes') leyesTecla(val);
    else if (calcActiva === 'caida') caidaPress(val);
    else if (calcActiva === 'termico') termPress(val);
    else if (calcActiva === 'potencia') potPress(val);
}

function numpadBorrar() {
    if (calcActiva === 'leyes') leyesBorrar();
    else if (calcActiva === 'caida') caidaClearVal();
    else if (calcActiva === 'termico') termDel();
    else if (calcActiva === 'potencia') potDel();
}

function numpadLimpiarCampo() {
    if (calcActiva === 'leyes') leyesLimpiarCampoActivo();
    else if (calcActiva === 'caida') caidaLimpiarCampoActivo();
    else if (calcActiva === 'termico') termLimpiarCampoActivo();
    else if (calcActiva === 'potencia') potLimpiarCampoActivo();
}

function numpadCalcular() {
    if (calcActiva === 'leyes') {
        leyesCalcular();
    } else if (calcActiva === 'caida') {
        caidaCalc();
        mostrarToast("Cálculo Actualizado", "Caída de tensión recalculada.");
    } else if (calcActiva === 'termico') {
        termCalculate();
        mostrarToast("Cálculo Actualizado", "Balance térmico recalculado.");
    } else if (calcActiva === 'potencia') {
        potCalc();
        mostrarToast("Cálculo Actualizado", "Potencia / Motor recalculado.");
    }
}

// ==========================================================================
// 1. MÓDULO LEYES ELÉCTRICAS (OHM, WATT, MÁGICO PRO)
// ==========================================================================
const leyesState = {
    foco: 'v',
    modo: 'PRO',
    vals: { v: '', i: '', r: '', p: '' },
    ultimoResumenTexto: ''
};

const leyesPlaceholders = { v: 'Volts', i: 'Amps', r: 'Ohms', p: 'Watts' };

function leyesSetFoco(campo) {
    leyesState.foco = campo;
    ['v', 'i', 'r', 'p'].forEach(k => {
        const box = document.getElementById(`leyes-box-${k}`);
        if (box) box.classList.remove('active');
    });
    const activo = document.getElementById(`leyes-box-${campo}`);
    if (activo) {
        activo.classList.remove('solved');
        activo.classList.add('active');
    }
}

function leyesRenderInputs() {
    ['v', 'i', 'r', 'p'].forEach(k => {
        const span = document.getElementById(`leyes-val-${k}`);
        if (!span) return;
        const val = leyesState.vals[k];
        if (val === '') {
            span.innerText = leyesPlaceholders[k];
            span.style.color = 'var(--ngc-text-faded)';
        } else {
            span.innerText = val;
            span.style.color = 'var(--ngc-text-main)';
        }
    });
}

function leyesCambiarModo(modo) {
    leyesState.modo = modo;
    leyesLimpiarTodo();

    ['PRO', 'OHM', 'WATT'].forEach(m => {
        document.getElementById(`btn-leyes-${m}`).classList.remove('modo-activo');
    });
    document.getElementById(`btn-leyes-${modo}`).classList.add('modo-activo');

    const boxR = document.getElementById('leyes-box-r');
    const boxP = document.getElementById('leyes-box-p');
    const inst = document.getElementById('leyes-instruccion');

    if (modo === 'OHM') {
        boxR.style.display = 'block';
        boxP.style.display = 'none';
        inst.innerHTML = "<b>Ley de Ohm:</b> V = I × R (Ingresa 2 valores y presiona <b>=</b>)";
    } else if (modo === 'WATT') {
        boxR.style.display = 'none';
        boxP.style.display = 'block';
        inst.innerHTML = "<b>Ley de Watt:</b> P = V × I (Ingresa 2 valores y presiona <b>=</b>)";
    } else {
        boxR.style.display = 'block';
        boxP.style.display = 'block';
        inst.innerHTML = "Calculadora PRO: Ingresa <b>2</b> valores y presiona <b>=</b> para despejar el resto.";
    }
    leyesSetFoco('v');
}

function leyesTecla(val) {
    const k = leyesState.foco;
    if (!k) return;
    let str = leyesState.vals[k];

    if (val === '.' && str.includes('.')) return;
    if (str.length >= 8) return;

    if (str === '' && val === '.') str = '0.';
    else if (str === '0' && val !== '.') str = val;
    else str += val;

    leyesState.vals[k] = str;
    leyesRenderInputs();
}

function leyesBorrar() {
    const k = leyesState.foco;
    if (!k) return;
    leyesState.vals[k] = leyesState.vals[k].slice(0, -1);
    leyesRenderInputs();
}

function leyesLimpiarCampoActivo() {
    const k = leyesState.foco;
    if (!k) return;
    leyesState.vals[k] = '';
    const box = document.getElementById(`leyes-box-${k}`);
    if (box) box.classList.remove('solved');
    leyesRenderInputs();
}

function leyesLimpiarTodo() {
    leyesState.vals = { v: '', i: '', r: '', p: '' };
    leyesState.ultimoResumenTexto = '';
    ['v', 'i', 'r', 'p'].forEach(k => {
        const box = document.getElementById(`leyes-box-${k}`);
        if (box) box.classList.remove('solved');
    });
    leyesRenderInputs();
    document.getElementById('leyes-formula-box').innerHTML = `
        <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Fórmulas Aplicadas</span>
        Ingrese 2 magnitudes conocidas y presione <b>=</b> para ver el desarrollo.
    `;
    leyesSetFoco(leyesState.foco || 'v');
}

function leyesCalcular() {
    let v = parseFloat(leyesState.vals.v);
    let i = parseFloat(leyesState.vals.i);
    let r = parseFloat(leyesState.vals.r);
    let p = parseFloat(leyesState.vals.p);

    let v_ok = !isNaN(v);
    let i_ok = !isNaN(i);
    let r_ok = !isNaN(r);
    let p_ok = !isNaN(p);

    let activos = [v_ok, i_ok, r_ok, p_ok].filter(Boolean).length;

    if (activos < 2) {
        mostrarToast("Faltan Datos", "Debes ingresar exactamente 2 valores.", true);
        return;
    }
    if (activos > 2) {
        mostrarToast("Exceso de Datos", "Borra con 'C' e ingresa solo 2 valores.", true);
        return;
    }

    let f1 = '', f2 = '';
    const fmt = n => Number(n.toFixed(2)).toString();

    try {
        if (v_ok && i_ok) {
            p = v * i;
            r = v / i;
            f1 = `P = V × I = ${fmt(v)} × ${fmt(i)} = ${fmt(p)} W`;
            f2 = `R = V / I = ${fmt(v)} / ${fmt(i)} = ${fmt(r)} Ω`;
        } else if (v_ok && r_ok) {
            i = v / r;
            p = (v * v) / r;
            f1 = `I = V / R = ${fmt(v)} / ${fmt(r)} = ${fmt(i)} A`;
            f2 = `P = V² / R = ${fmt(v)}² / ${fmt(r)} = ${fmt(p)} W`;
        } else if (v_ok && p_ok) {
            i = p / v;
            r = (v * v) / p;
            f1 = `I = P / V = ${fmt(p)} / ${fmt(v)} = ${fmt(i)} A`;
            f2 = `R = V² / P = ${fmt(v)}² / ${fmt(p)} = ${fmt(r)} Ω`;
        } else if (i_ok && r_ok) {
            v = i * r;
            p = (i * i) * r;
            f1 = `V = I × R = ${fmt(i)} × ${fmt(r)} = ${fmt(v)} V`;
            f2 = `P = I² × R = ${fmt(i)}² × ${fmt(r)} = ${fmt(p)} W`;
        } else if (i_ok && p_ok) {
            v = p / i;
            r = p / (i * i);
            f1 = `V = P / I = ${fmt(p)} / ${fmt(i)} = ${fmt(v)} V`;
            f2 = `R = P / I² = ${fmt(p)} / ${fmt(i)}² = ${fmt(r)} Ω`;
        } else if (r_ok && p_ok) {
            v = Math.sqrt(p * r);
            i = Math.sqrt(p / r);
            f1 = `V = √(P × R) = √(${fmt(p)} × ${fmt(r)}) = ${fmt(v)} V`;
            f2 = `I = √(P / R) = √(${fmt(p)} / ${fmt(r)}) = ${fmt(i)} A`;
        }

        if (!isFinite(v) || !isFinite(i) || !isFinite(r) || !isFinite(p)) {
            throw new Error("División por cero");
        }

        leyesState.vals.v = fmt(v);
        leyesState.vals.i = fmt(i);
        leyesState.vals.r = (leyesState.modo !== 'WATT') ? fmt(r) : '';
        leyesState.vals.p = (leyesState.modo !== 'OHM') ? fmt(p) : '';

        leyesRenderInputs();

        ['v', 'i', 'r', 'p'].forEach(k => {
            const box = document.getElementById(`leyes-box-${k}`);
            if (box && leyesState.vals[k] !== '') {
                box.classList.add('solved');
            }
        });

        // Armar desglose visual y texto para copiar
        let htmlDesarrollo = `<span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Desarrollo Matemático (${leyesState.modo})</span>`;
        let textoDesarrollo = `CÁLCULO DE LEYES ELÉCTRICAS (Modo ${leyesState.modo})\n`;

        if (leyesState.modo === 'OHM') {
            const lineaOhm = f1.includes('R =') || f1.includes('I =') || f1.includes('V =') ? f1 : f2;
            htmlDesarrollo += `<b>${lineaOhm}</b>`;
            textoDesarrollo += `Fórmula y reemplazo:\n• ${lineaOhm}\n\nResultados:\n• Tensión (V): ${leyesState.vals.v} V\n• Corriente (A): ${leyesState.vals.i} A\n• Resistencia (Ω): ${leyesState.vals.r} Ω`;
        } else if (leyesState.modo === 'WATT') {
            const lineaWatt = f1.includes('P =') ? f1 : (f2.includes('P =') ? f2 : f1);
            htmlDesarrollo += `<b>${lineaWatt}</b>`;
            textoDesarrollo += `Fórmula y reemplazo:\n• ${lineaWatt}\n\nResultados:\n• Tensión (V): ${leyesState.vals.v} V\n• Corriente (A): ${leyesState.vals.i} A\n• Potencia (W): ${leyesState.vals.p} W`;
        } else {
            htmlDesarrollo += `• <b>${f1}</b><br>• <b>${f2}</b>`;
            textoDesarrollo += `Fórmulas y reemplazos:\n• ${f1}\n• ${f2}\n\nResultados:\n• Tensión (V): ${leyesState.vals.v} V\n• Corriente (A): ${leyesState.vals.i} A\n• Resistencia (Ω): ${leyesState.vals.r} Ω\n• Potencia (W): ${leyesState.vals.p} W`;
        }

        document.getElementById('leyes-formula-box').innerHTML = htmlDesarrollo;
        leyesState.ultimoResumenTexto = textoDesarrollo;

        mostrarToast("¡Cálculo Exitoso!", "Resultados despejados correctamente.");
    } catch (error) {
        mostrarToast("Error Matemático", "Operación imposible (verifique ceros).", true);
    }
}

// ==========================================================================
// 2. MÓDULO CAÍDA DE TENSIÓN (AEA 90364-5-52)
// ==========================================================================
let caidaActiveField = 'amp';
let caidaData = { amp: '', mts: '', vnom: '220', cosphi: '0.85', senphi: '0.53' };
let caidaUltimoResumen = '';

const tablaR = {
    'cu': { 1.0: 18.1, 1.5: 13.3, 2.5: 7.98, 4: 4.95, 6: 3.30, 10: 1.91, 16: 1.21, 25: 0.78, 35: 0.554, 50: 0.386 },
    'al': { 1.0: 30.1, 1.5: 21.0, 2.5: 12.6, 4: 7.82, 6: 5.21, 10: 3.08, 16: 1.91, 25: 1.20, 35: 0.868, 50: 0.641 }
};

function caidaSetActive(field) {
    caidaActiveField = field;
    document.querySelectorAll('#sec-caida .calc-box').forEach(el => el.classList.remove('active'));
    document.getElementById('caida-disp-cosphi').classList.remove('sub-active');
    document.getElementById('caida-disp-senphi').classList.remove('sub-active');

    if (field === 'cosphi' || field === 'senphi') {
        document.getElementById('caida-grp-phi').classList.add('active');
        document.getElementById('caida-disp-' + field).classList.add('sub-active');
    } else {
        const grp = document.getElementById('caida-grp-' + field);
        if (grp) grp.classList.add('active');
    }
}

function caidaSetSec(val) {
    document.getElementById('caida-disp-sec-sel').innerHTML = `<span>${val}</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>`;
    document.getElementById('caida-sec-val').value = val;
    document.getElementById('detSec').removeAttribute('open');
    caidaUpdateTable();
}

function caidaSetPreset(cp, sp) {
    caidaData.cosphi = cp.toString();
    caidaData.senphi = sp.toString();
    document.getElementById('caida-disp-cosphi').innerText = cp;
    document.getElementById('caida-disp-senphi').innerText = sp;
    caidaCalc();

    if (cp === 0.30) {
        document.getElementById('modalArranque').classList.remove('oculto');
    }
}

function caidaCloseModal() {
    document.getElementById('modalArranque').classList.add('oculto');
    caidaSetActive('amp');
}

function caidaPress(num) {
    let val = caidaData[caidaActiveField];
    if (num === '.' && val.includes('.')) return;
    if (val.length >= 7) return;

    if (val === '0' && num !== '.') val = '';
    if (val === '' && num === '.') val = '0.';
    else val += num;

    caidaData[caidaActiveField] = val;
    document.getElementById('caida-disp-' + caidaActiveField).innerText = val;
    caidaCalc();
}

function caidaClearVal() {
    let val = caidaData[caidaActiveField];
    if (val.length > 0) {
        val = val.slice(0, -1);
        caidaData[caidaActiveField] = val;
        document.getElementById('caida-disp-' + caidaActiveField).innerText = val === '' ? '0' : val;
        caidaCalc();
    }
}

function caidaLimpiarCampoActivo() {
    caidaData[caidaActiveField] = '';
    document.getElementById('caida-disp-' + caidaActiveField).innerText = '0';
    caidaCalc();
}

function caidaResetAll() {
    caidaData = { amp: '', mts: '', vnom: '220', cosphi: '0.85', senphi: '0.53' };
    document.getElementById('caida-disp-amp').innerText = '0';
    document.getElementById('caida-disp-mts').innerText = '0';
    document.getElementById('caida-disp-vnom').innerText = '220';
    document.getElementById('caida-disp-cosphi').innerText = '0.85';
    document.getElementById('caida-disp-senphi').innerText = '0.53';
    
    caidaSetSec('2.5');
    document.getElementById('caida-pre-normal').checked = true;
    document.getElementById('caida-sis-mono').checked = true;
    document.getElementById('caida-mat-cu').checked = true;
    
    caidaUpdateTable();
    caidaSetActive('amp');
}

function caidaUpdateTable() {
    const m = document.querySelector('input[name="caida-mat"]:checked').value;
    const s = document.getElementById('caida-sec-val').value;
    document.getElementById('caida-disp-res').innerText = tablaR[m][s];
    caidaCalc();
}

function caidaCalc() {
    const sisEl = document.querySelector('input[name="caida-sis"]:checked');
    const matEl = document.querySelector('input[name="caida-mat"]:checked');
    const k = parseFloat(sisEl.value);
    const sisNombre = k === 2 ? 'Monofásico (k=2)' : 'Trifásico (k=√3)';
    const matNombre = matEl.value === 'cu' ? 'Cobre' : 'Aluminio';
    const sec = document.getElementById('caida-sec-val').value;

    const Vn = parseFloat(caidaData.vnom) || 220;
    const I = parseFloat(caidaData.amp) || 0;
    const M = parseFloat(caidaData.mts) || 0;
    const R = parseFloat(document.getElementById('caida-disp-res').innerText);
    const X = 0.08; 
    const cp = parseFloat(caidaData.cosphi) || 0;
    const sp = parseFloat(caidaData.senphi) || 0;

    if (I <= 0 || M <= 0) {
        document.getElementById('caida-out-u').innerText = "0.00 V";
        document.getElementById('caida-out-pct').innerText = "0.00 %";
        document.getElementById('caida-out-fin').innerText = "0.00 V";
        document.getElementById('caida-formula-box').innerHTML = `
            <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Desarrollo ΔU (AEA 90364-5-52)</span>
            ΔU = k · I · L · (R · cos φ + X · sen φ)<br>
            <span style="color: var(--ngc-text-faded);">Ingrese Amperes (I) y Metros (L) para ver el reemplazo.</span>
        `;
        caidaUltimoResumen = '';
        return;
    }

    const L = M / 1000;
    const du = k * I * L * (R * cp + X * sp);
    const pc = (du / Vn) * 100;
    const vf = Vn - du;

    document.getElementById('caida-out-u').innerText = du.toFixed(2) + " V";
    document.getElementById('caida-out-pct').innerText = pc.toFixed(2) + " %";
    document.getElementById('caida-out-fin').innerText = vf.toFixed(2) + " V";

    const eqBase = `ΔU = k · I · L · (R · cos φ + X · sen φ)`;
    const eqReemp = `ΔU = ${k} · ${I} · ${L.toFixed(4)} · (${R} · ${cp} + ${X} · ${sp}) = ${du.toFixed(2)} V`;
    const eqPct = `ΔU% = (${du.toFixed(2)} / ${Vn}) · 100 = ${pc.toFixed(2)} % | U_llegada = ${vf.toFixed(2)} V`;

    document.getElementById('caida-formula-box').innerHTML = `
        <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Desarrollo ΔU (${sisNombre} - ${matNombre} ${sec}mm²)</span>
        ${eqBase}<br>
        <b>${eqReemp}</b><br>
        <span style="color: var(--success-green); font-weight: bold;">${eqPct}</span>
    `;

    caidaUltimoResumen = `CÁLCULO DE CAÍDA DE TENSIÓN (AEA 90364-5-52)\n` +
        `Sistema: ${sisNombre} | Conductor: ${matNombre} ${sec} mm² | V_nom: ${Vn} V\n` +
        `Distancia: ${M} m (${L.toFixed(4)} km) | Corriente: ${I} A | cos φ: ${cp} | sen φ: ${sp}\n\n` +
        `Fórmula:\n${eqBase}\n\n` +
        `Reemplazo de valores:\n${eqReemp}\n${eqPct}`;
}

// ==========================================================================
// 3. MÓDULO BALANCE TÉRMICO EN TABLEROS (AEA 770)
// ==========================================================================
const termState = {
    activeField: 'val',
    phase: 'mono',
    inputs: { val: '0', aux: '0' },
    cabeceras: [],
    salidas: [],
    ultimoResumen: ''
};

const tableDissipation = [
    { max: 10, w: 3 }, { max: 16, w: 3.5 }, { max: 25, w: 4.5 },
    { max: 32, w: 6 }, { max: 40, w: 7.5 }, { max: 50, w: 9 },
    { max: 63, w: 13 }, { max: 100, w: 15 }, { max: 125, w: 20 }
];

function termGetWatts(amps) {
    const entry = tableDissipation.find(e => amps <= e.max);
    return entry ? entry.w : 20;
}

function termSetFocus(fieldId) {
    termState.activeField = fieldId;
    document.querySelectorAll('#sec-termico .calc-box').forEach(el => el.classList.remove('active'));
    document.getElementById(`term-in-${fieldId}`).classList.add('active');
}

function termSetPhase(p) {
    termState.phase = p;
    termCalculate();
}

function termPress(n) {
    let currentString = termState.inputs[termState.activeField];
    if (n === '.' && currentString.includes('.')) return;
    if (currentString.length >= 6) return;

    if (currentString === "0" && n !== '.') currentString = n;
    else if (currentString === "" && n === '.') currentString = "0.";
    else currentString += n;

    termState.inputs[termState.activeField] = currentString;
    document.getElementById(`term-v-${termState.activeField}`).innerText = currentString;
    termCalculate();
}

function termDel() {
    let currentString = termState.inputs[termState.activeField];
    if (currentString.length > 1) currentString = currentString.slice(0, -1);
    else currentString = "0";

    if (currentString === "0.") currentString = "0";
    termState.inputs[termState.activeField] = currentString;
    document.getElementById(`term-v-${termState.activeField}`).innerText = currentString;
    termCalculate();
}

function termLimpiarCampoActivo() {
    termState.inputs[termState.activeField] = "0";
    document.getElementById(`term-v-${termState.activeField}`).innerText = "0";
    termCalculate();
}

function termAddItem(type) {
    const val = parseFloat(termState.inputs.val);
    if (val > 0) {
        if (type === 'CAB') termState.cabeceras.push(val);
        else termState.salidas.push(val);
        
        termState.inputs.val = "0";
        document.getElementById('term-v-val').innerText = "0";
        
        termUpdateList();
        termCalculate();
    } else {
        mostrarToast("Valor Inválido", "Ingresa los Amperes del dispositivo antes de añadir.", true);
    }
}

function termRemoveItem(type, index) {
    if (type === 'CAB') termState.cabeceras.splice(index, 1);
    else termState.salidas.splice(index, 1);
    termUpdateList();
    termCalculate();
}

function termUpdateList() {
    const container = document.getElementById('term-circ-list');
    const poles = (termState.phase === 'mono') ? 2 : 4;

    if (termState.cabeceras.length === 0 && termState.salidas.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 10px; font-size: 0.78rem; color: var(--ngc-text-faded);">Tablero vacío</div>';
        return;
    }
    
    let html = "";
    termState.cabeceras.forEach((v, i) => {
        const wPolo = termGetWatts(v);
        html += `<div class="circuit-item">
            <span><span class="tag-cab">CAB</span> <b>${v}A</b> <small style="color:var(--ngc-text-faded);">(${wPolo}W/polo × ${poles}P)</small></span>
            <span data-html2canvas-ignore="true" style="color:var(--error-red); cursor:pointer; font-weight:bold; padding: 0 6px;" onclick="termRemoveItem('CAB', ${i})">✕</span>
        </div>`;
    });
    termState.salidas.forEach((v, i) => {
        const wPolo = termGetWatts(v);
        html += `<div class="circuit-item">
            <span><span class="tag-pia">PIA</span> <b>${v}A</b> <small style="color:var(--ngc-text-faded);">(${wPolo}W/polo × ${poles}P)</small></span>
            <span data-html2canvas-ignore="true" style="color:var(--error-red); cursor:pointer; font-weight:bold; padding: 0 6px;" onclick="termRemoveItem('PIA', ${i})">✕</span>
        </div>`;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function termCalculate() {
    let k = 1;
    const n = termState.salidas.length;
    if (n >= 2 && n <= 3) k = 0.8;
    else if (n >= 4 && n <= 5) k = 0.7;
    else if (n >= 6 && n <= 9) k = 0.6;
    else if (n >= 10) k = 0.5;

    const ke = 0.85; 
    const poles = (termState.phase === 'mono') ? 2 : 4;
    const sisTexto = termState.phase === 'mono' ? 'Monofásico (2 Polos)' : 'Trifásico (4 Polos)';

    let p_cab_total = 0;
    termState.cabeceras.forEach(amp => { 
        p_cab_total += (termGetWatts(amp) * poles * (ke ** 2)); 
    });

    let p_sal_total = 0;
    termState.salidas.forEach(amp => { 
        p_sal_total += (termGetWatts(amp) * poles * (k ** 2)); 
    });

    const p_aux = parseFloat(termState.inputs.aux) || 0;
    const ptot = ((p_cab_total + p_sal_total) * 1.2) + p_aux;
    const sugGabinete = Math.ceil(ptot * 1.1);

    document.getElementById('term-res-ptot').innerText = ptot.toFixed(1);
    document.getElementById('term-rec-box').innerText = `Gabinete: > ${sugGabinete} W`;

    // Actualizar lista por si cambió fase (2P vs 4P)
    termUpdateList();

    if (termState.cabeceras.length === 0 && termState.salidas.length === 0 && p_aux === 0) {
        document.getElementById('term-math-breakdown').innerHTML = `
            <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Desglose del Cálculo</span>
            Agregue cabeceras o salidas para calcular...
        `;
        termState.ultimoResumen = '';
        return;
    }

    const eqBase = `P_tot = (P_cab + P_sal) · 1.2 + P_aux`;
    const eqReemp = `P_tot = (${p_cab_total.toFixed(2)} + ${p_sal_total.toFixed(2)}) · 1.2 + ${p_aux} = ${ptot.toFixed(1)} W`;

    document.getElementById('term-math-breakdown').innerHTML = `
        <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> Desglose Térmico (${sisTexto})</span>
        • Cabeceras (${termState.cabeceras.length} ud, Ke=${ke}): <b>${p_cab_total.toFixed(2)} W</b><br>
        • Salidas (${termState.salidas.length} ud, K=${k}): <b>${p_sal_total.toFixed(2)} W</b><br>
        • Fórmula: ${eqBase}<br>
        • Reemplazo: <b>${eqReemp}</b><br>
        • Gabinete recomendado (+10%): <b style="color: var(--success-green);">> ${sugGabinete} W</b>
    `;

    const listaCabTxt = termState.cabeceras.length ? termState.cabeceras.map(a => `${a}A`).join(', ') : 'Ninguna';
    const listaSalTxt = termState.salidas.length ? termState.salidas.map(a => `${a}A`).join(', ') : 'Ninguna';

    termState.ultimoResumen = `CÁLCULO DE BALANCE TÉRMICO EN TABLERO (AEA 770)\n` +
        `Sistema: ${sisTexto}\n` +
        `Cabeceras (${termState.cabeceras.length} ud, Ke=${ke}): [${listaCabTxt}] -> ${p_cab_total.toFixed(2)} W\n` +
        `Salidas (${termState.salidas.length} ud, K=${k}): [${listaSalTxt}] -> ${p_sal_total.toFixed(2)} W\n` +
        `Auxiliares (P_aux): ${p_aux} W\n\n` +
        `Fórmula:\n${eqBase}\n\n` +
        `Reemplazo de valores:\n${eqReemp}\n` +
        `Sugerencia Gabinete: > ${sugGabinete} W`;
}

function termResetAll() {
    termState.cabeceras = [];
    termState.salidas = [];
    termState.inputs.val = "0";
    termState.inputs.aux = "0";
    document.getElementById('term-v-val').innerText = "0";
    document.getElementById('term-v-aux').innerText = "0";
    document.getElementById('term-phase-mono').checked = true;
    termState.phase = 'mono';
    termUpdateList();
    termCalculate();
    termSetFocus('val');
}

// ==========================================================================
// 4. MÓDULO POTENCIA, MOTORES Y CAPACITORES
// ==========================================================================
let potActiveCat = 'mono';
let potActiveF = '';
let potCurrentVals = {};
let potSelectedEqId = '';
let potPersistentStore = {};
let potUltimoResumen = '';

const potLabelsMap = {
    U: 'Tensión U (V)',
    I: 'Corriente I (A)',
    cos: 'cos φ',
    sen: 'sen φ',
    P: 'Potencia P (W)',
    n: 'Rend. η',
    tg1: 'tg φ1 (Ini)',
    tg2: 'tg φ2 (Fin)'
};

const potDb = {
    mono: {
        catName: "Sistemas Monofásicos",
        desc: "<b>Potencias Monofásicas:</b> Cargas conectadas entre fase y neutro (220V). La activa es trabajo útil; la reactiva oscila en la red.",
        eqs: {
            p_m: {
                n: "Potencia Activa (W)", unit: "W", short: "Activa (W)",
                f_txt: "P = U · I · cos φ",
                v: { U: 220, I: 0, cos: 0.85 },
                f: d => d.U * d.I * d.cos,
                sub: (d, r) => `P = ${d.U} · ${d.I} · ${d.cos} = ${r.toFixed(2)} W`
            },
            s_m: {
                n: "Potencia Aparente (VA)", unit: "VA", short: "Aparente (VA)",
                f_txt: "S = U · I",
                v: { U: 220, I: 0 },
                f: d => d.U * d.I,
                sub: (d, r) => `S = ${d.U} · ${d.I} = ${r.toFixed(2)} VA`
            },
            q_m: {
                n: "Potencia Reactiva (VAr)", unit: "VAr", short: "Reactiva (VAr)",
                f_txt: "Q = U · I · sen φ",
                v: { U: 220, I: 0, sen: 0.53 },
                f: d => d.U * d.I * d.sen,
                sub: (d, r) => `Q = ${d.U} · ${d.I} · ${d.sen} = ${r.toFixed(2)} VAr`
            }
        }
    },
    tri: {
        catName: "Sistemas Trifásicos",
        desc: "<b>Sistemas Trifásicos (380V):</b> Se introduce √3 (1.732) para compensar el desfase entre las tres fases.",
        eqs: {
            p_t: {
                n: "Potencia Activa (W)", unit: "W", short: "Activa (W)",
                f_txt: "P = √3 · U · I · cos φ",
                v: { U: 380, I: 0, cos: 0.85 },
                f: d => 1.732 * d.U * d.I * d.cos,
                sub: (d, r) => `P = 1.732 · ${d.U} · ${d.I} · ${d.cos} = ${r.toFixed(2)} W`
            },
            s_t: {
                n: "Potencia Aparente (VA)", unit: "VA", short: "Aparente (VA)",
                f_txt: "S = √3 · U · I",
                v: { U: 380, I: 0 },
                f: d => 1.732 * d.U * d.I,
                sub: (d, r) => `S = 1.732 · ${d.U} · ${d.I} = ${r.toFixed(2)} VA`
            },
            q_t: {
                n: "Potencia Reactiva (VAr)", unit: "VAr", short: "Reactiva (VAr)",
                f_txt: "Q = √3 · U · I · sen φ",
                v: { U: 380, I: 0, sen: 0.53 },
                f: d => 1.732 * d.U * d.I * d.sen,
                sub: (d, r) => `Q = 1.732 · ${d.U} · ${d.I} · ${d.sen} = ${r.toFixed(2)} VAr`
            }
        }
    },
    mot: {
        catName: "Cálculo de Motores Eléctricos",
        desc: "<b>Cálculo de Motores:</b> Determina la corriente nominal según la potencia mecánica (P) y el rendimiento (η).",
        eqs: {
            i_mm: {
                n: "Corriente Motor Monofásico (A)", unit: "A", short: "Motor Mono [A]",
                f_txt: "I = P / (U · η · cos φ)",
                v: { P: 1500, U: 220, n: 0.85, cos: 0.8 },
                f: d => d.P / (d.U * d.n * d.cos),
                sub: (d, r) => `I = ${d.P} / (${d.U} · ${d.n} · ${d.cos}) = ${r.toFixed(2)} A`
            },
            i_mt: {
                n: "Corriente Motor Trifásico (A)", unit: "A", short: "Motor Trif [A]",
                f_txt: "I = P / (√3 · U · η · cos φ)",
                v: { P: 5500, U: 380, n: 0.88, cos: 0.82 },
                f: d => d.P / (1.732 * d.U * d.n * d.cos),
                sub: (d, r) => `I = ${d.P} / (1.732 · ${d.U} · ${d.n} · ${d.cos}) = ${r.toFixed(2)} A`
            }
        }
    },
    cap: {
        catName: "Corrección de Factor de Potencia",
        desc: "<b>Corrección cos φ (50Hz, ω = 314.16):</b> Calcula el capacitor en µF para compensar energía reactiva.",
        eqs: {
            c_uf: {
                n: "Capacidad Requerida (µF)", unit: "µF", short: "Capacidad (µF)",
                f_txt: "C = [P · (tg φ1 - tg φ2) · 10⁶] / (ω · U²)",
                v: { P: 1000, tg1: 0.75, tg2: 0.33, U: 220 },
                f: d => (d.P * (d.tg1 - d.tg2) * 1000000) / (314.16 * Math.pow(d.U, 2)),
                sub: (d, r) => `C = [${d.P} · (${d.tg1} - ${d.tg2}) · 10⁶] / (314.16 · ${d.U}²) = ${r.toFixed(2)} µF`
            }
        }
    }
};

function potUpdateCat(catId) {
    potActiveCat = catId;
    document.querySelectorAll('#sec-potencia .nav-calc-btn').forEach(c => c.classList.remove('modo-activo'));
    document.getElementById('pot-card-' + catId).classList.add('modo-activo');
    
    const subArea = document.getElementById('pot-sub-selectors');
    subArea.innerHTML = '';
    
    const eqKeys = Object.keys(potDb[catId].eqs);
    subArea.className = 'sub-cat-grid' + (eqKeys.length === 2 ? ' cols-2' : (eqKeys.length === 1 ? ' cols-1' : ''));

    eqKeys.forEach((k, idx) => {
        let btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'corp-btn' + (idx === 0 ? ' modo-activo' : '');
        btn.style.fontSize = '0.75rem';
        btn.style.padding = '9px 6px';
        btn.innerText = potDb[catId].eqs[k].short;
        
        if (idx === 0) potSelectedEqId = k;
        
        btn.onclick = () => {
            potSelectedEqId = k;
            document.querySelectorAll('#pot-sub-selectors .corp-btn').forEach(b => b.classList.remove('modo-activo'));
            btn.classList.add('modo-activo');
            potRenderInputs();
        };
        
        subArea.appendChild(btn);
    });
    
    potRenderInputs();
}

function potRenderInputs() {
    const eq = potDb[potActiveCat].eqs[potSelectedEqId];
    const area = document.getElementById('pot-input-area');
    area.innerHTML = '';
    potCurrentVals = {};
    
    Object.keys(eq.v).forEach((k, i) => {
        // Evitar arrastrar 220V a trifásico o 380V a monofásico si el usuario no lo forzó
        const storeKey = `${potActiveCat}_${k}`;
        if (potPersistentStore[storeKey] !== undefined) {
            potCurrentVals[k] = potPersistentStore[storeKey];
        } else {
            potCurrentVals[k] = eq.v[k].toString();
        }
        
        let div = document.createElement('div');
        div.className = 'flex-1 calc-box' + (i === 0 ? ' active' : '');
        div.onclick = () => {
            potActiveF = k;
            document.querySelectorAll('#pot-input-area .calc-box').forEach(x => x.classList.remove('active'));
            div.classList.add('active');
        };
        
        const labelTxt = potLabelsMap[k] || k.toUpperCase();
        div.innerHTML = `<label>${labelTxt}</label><span id="pot-v-${k}" class="calc-val">${potCurrentVals[k]}</span>`;
        area.appendChild(div);
        
        if (i === 0) potActiveF = k;
    });
    
    document.getElementById('pot-res-label').innerText = eq.n;
    potCalc();
}

function potPress(n) {
    let val = potCurrentVals[potActiveF];
    if (n === '.' && val.includes('.')) return;
    if (val.length >= 7) return;

    if (val === '0' && n !== '.') val = '';
    if (val === '' && n === '.') val = '0.';
    else val += n;

    potCurrentVals[potActiveF] = val;
    potPersistentStore[`${potActiveCat}_${potActiveF}`] = val;
    document.getElementById('pot-v-' + potActiveF).innerText = val;
    potCalc();
}

function potDel() {
    let val = potCurrentVals[potActiveF].toString();
    if (val.length > 1) val = val.slice(0, -1);
    else val = '0';

    potCurrentVals[potActiveF] = val;
    potPersistentStore[`${potActiveCat}_${potActiveF}`] = val;
    document.getElementById('pot-v-' + potActiveF).innerText = val;
    potCalc();
}

function potLimpiarCampoActivo() {
    potCurrentVals[potActiveF] = '0';
    potPersistentStore[`${potActiveCat}_${potActiveF}`] = '0';
    document.getElementById('pot-v-' + potActiveF).innerText = '0';
    potCalc();
}

function potCalc() {
    const eq = potDb[potActiveCat].eqs[potSelectedEqId];
    const d = {};
    Object.keys(potCurrentVals).forEach(k => d[k] = parseFloat(potCurrentVals[k]) || 0);
    
    const rawRes = eq.f(d);
    const resVal = isFinite(rawRes) ? rawRes : 0;
    const resStr = `${resVal.toFixed(2)} ${eq.unit}`;

    document.getElementById('pot-main-result').innerText = resStr;

    const eqSub = isFinite(rawRes) ? eq.sub(d, resVal) : 'Complete los divisores distintos de cero.';
    document.getElementById('pot-formula-info').innerHTML = `
        <span class="formula-title"><i class="fa-solid fa-square-root-variable"></i> ${eq.n}</span>
        Fórmula: <b>${eq.f_txt}</b><br>
        Reemplazo: <b style="color: var(--success-green);">${eqSub}</b><br>
        <div style="margin-top: 6px; font-size: 0.72rem; color: var(--ngc-text-faded);">${potDb[potActiveCat].desc}</div>
    `;

    potUltimoResumen = `CÁLCULO DE ${potDb[potActiveCat].catName.toUpperCase()} - ${eq.n.toUpperCase()}\n` +
        `Fórmula:\n${eq.f_txt}\n\n` +
        `Reemplazo de valores:\n${eqSub}\n\n` +
        `Resultado Final: ${resStr}`;
}

function potResetAll() {
    potPersistentStore = {};
    potUpdateCat('mono');
      }

// ==========================================================================
// 5. COPIADO DE FÓRMULA AL PORTAPAPELES Y CAPTURA DE IMAGEN PNG
// ==========================================================================
function copiarFormula() {
    let textoCopiar = '';
    if (calcActiva === 'leyes') textoCopiar = leyesState.ultimoResumenTexto;
    else if (calcActiva === 'caida') textoCopiar = caidaUltimoResumen;
    else if (calcActiva === 'termico') textoCopiar = termState.ultimoResumen;
    else if (calcActiva === 'potencia') textoCopiar = potUltimoResumen;

    if (!textoCopiar) {
        mostrarToast("Sin Cálculo", "Realiza un cálculo primero para copiar su fórmula.", true);
        return;
    }

    const firma = `\n\n— Calculado con Villaser Gestión`;
    const textoFinal = textoCopiar + firma;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textoFinal)
            .then(() => mostrarToast("Fórmula Copiada", "Fórmula y valores copiados al portapapeles."))
            .catch(() => copiarFallback(textoFinal));
    } else {
        copiarFallback(textoFinal);
    }
}

function copiarFallback(texto) {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        mostrarToast("Fórmula Copiada", "Fórmula y valores copiados al portapapeles.");
    } catch (err) {
        mostrarToast("Error", "No se pudo copiar el texto.", true);
    }
    document.body.removeChild(textArea);
}

async function capturarResultado() {
    if (typeof html2canvas === 'undefined') {
        mostrarToast("Error", "Librería de captura no disponible.", true);
        return;
    }

    const zona = document.getElementById('zonaCaptura');
    if (!zona) return;

    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor = isLightMode ? "#ffffff" : "#242526";
    const oldBg = zona.style.backgroundColor;
    const oldPadding = zona.style.padding;

    zona.style.backgroundColor = bgColor;
    zona.style.padding = "14px";

    try {
        const scrollY = window.scrollY;
        window.scrollTo(0, 0);

        const canvas = await html2canvas(zona, {
            backgroundColor: bgColor,
            scale: 2,
            useCORS: true,
            scrollY: 0
        });

        window.scrollTo(0, scrollY);

        const nombresArchivo = {
            leyes: 'Leyes_Electricas',
            caida: 'Caida_Tension',
            termico: 'Balance_Termico',
            potencia: 'Potencia_Motores'
        };
        const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
        const link = document.createElement('a');
        link.download = `Villaser_${nombresArchivo[calcActiva]}_${fecha}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        mostrarToast("Captura Descargada", "Imagen guardada lista para tu informe.");
    } catch (e) {
        console.error(e);
        mostrarToast("Error de Captura", "No se pudo generar la imagen.", true);
    } finally {
        zona.style.backgroundColor = oldBg;
        zona.style.padding = oldPadding;
    }
}

// ==========================================================================
// INICIALIZACIÓN DE TODOS LOS SUB-MÓDULOS AL CARGAR
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Leyes
    leyesSetFoco('v');
    leyesRenderInputs();

    // Inicializar Caída de Tensión
    caidaUpdateTable();
    caidaSetActive('amp');

    // Inicializar Balance Térmico
    termUpdateList();
    termCalculate();
    termSetFocus('val');

    // Inicializar Potencia y Motores
    potUpdateCat('mono');
});

// ==========================================
// MENÚ INFERIOR SCROLL (MATCH GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById('corpFooterMenu'); if (!footer) return;
    const modulos = [
        { nombre: 'Inicio', icon: 'fa-house', url: '../index.html' },
        { nombre: 'Presupuestos', icon: 'fa-file-invoice-dollar', url: '../presupuesto/index.html' },
        { nombre: 'Materiales', icon: 'fa-boxes-stacked', url: '../materiales/index.html' },
        { nombre: 'Informes', icon: 'fa-clipboard-check', url: '../informes/index.html' },
        { nombre: 'Potencia', icon: 'fa-bolt', url: '../potencia/index.html' },
        { nombre: 'Agenda', icon: 'fa-address-book', url: '../agenda/index.html' },
        { nombre: 'Mano de Obra', icon: 'fa-hand-holding-dollar', url: '../costos/index.html' },
        { nombre: 'Calculadora', icon: 'fa-calculator', url: '#', active: true },
        { nombre: 'Proveedores', icon: 'fa-truck-fast', url: '../proveedores/index.html' },
        { nombre: 'Catalogos', icon: 'fa-book-open', url: '../catalogos/index.html' }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.replace(mod.url); };
        footer.appendChild(btn);
    });
        // Centra automáticamente el botón activo en la vista
    requestAnimationFrame(() => {
        const btnActivo = footer.querySelector('.corp-nav-item.active');
        if (btnActivo) {
            const footerRect = footer.getBoundingClientRect();
            const btnRect = btnActivo.getBoundingClientRect();
            footer.scrollLeft += (btnRect.left - footerRect.left) - (footerRect.width / 2) + (btnRect.width / 2);
        }
    });
    
});

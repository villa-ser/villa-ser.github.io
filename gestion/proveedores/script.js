const SHEET_ID_CASAS = '1jFvMWkTBPlqpIWJ_kjVy1vSw3gA_q9Jxvar0LajaDnM';
const URL_CASAS = `https://docs.google.com/spreadsheets/d/${SHEET_ID_CASAS}/gviz/tq?tqx=out:json&sheet=Hoja1`;

let dbCasas = [];
let modoListadoCompleto = false;

// ==========================================
// MOTOR DE ARRANQUE ULTRA BLINDADO
// ==========================================
function arrancarModulo() {
    // 1. Guardián de Sesión Firebase (Idéntico a tu App Principal)
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            if (typeof firebase.auth === 'function') {
                firebase.auth().onAuthStateChanged(user => {
                    // Si no hay usuario o no verificó email, lo patea al login
                    if (!user || !user.emailVerified) {
                        window.location.replace('../index.html'); 
                    }
                });
            }
        }
    } catch (e) { 
        console.warn("Aviso: Guardián de seguridad omitido.", e); 
    }

    // 2. Disparamos la búsqueda de la base de datos de proveedores
    fetchCasas();
}

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', arrancarModulo); 
} else { 
    arrancarModulo(); 
}

// ==========================================
// FUNCIONES DE PROVEEDORES
// ==========================================
async function fetchCasas() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(URL_CASAS, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const txt = await res.text();
        const jsonStr = txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
        const data = JSON.parse(jsonStr);

        dbCasas = data.table.rows.map(r => ({
            nombre: r.c[0]?.v || '',
            direccion: r.c[1]?.v || '',
            telefono: r.c[2]?.v || '',
            horario: r.c[3]?.v || '',
            comentarios: r.c[4]?.v || '',
            latitud: r.c[5]?.v || '',
            longitud: r.c[6]?.v || '',
            barrio: r.c[7]?.v || 'Sin Barrio Especificado'
        })).filter(c => c.nombre && c.nombre.toLowerCase() !== "nombre");

        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';

    } catch (e) {
        clearTimeout(timeoutId);
        const loadingDiv = document.getElementById('loading');
        loadingDiv.innerHTML = `⚠️ Error al conectar con la base de datos de proveedores.<br><br><button class="corp-btn" style="width: auto; margin: 0 auto;" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> Reintentar</button>`;
        console.error("Error fetching casas:", e);
    }
}

function generarHtmlTarjeta(casa) {
    const telLimpio = String(casa.telefono).replace(/\D/g, '');
    
    const btnAccionSecundaria = telLimpio.length >= 7 
        ? `<button class="corp-btn success-btn" onclick="window.open('https://wa.me/549${telLimpio}', '_blank')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>` 
        : ``;

    return `
        <div class="corp-card">
            <h4 style="margin-bottom: 8px; color: var(--ngc-text-main); font-size: 1.1rem; text-transform: none;">${casa.nombre}</h4>
            <p style="margin: 0 0 4px 0; font-size: 0.9rem; color: var(--ngc-neon);"><i class="fa-solid fa-location-dot"></i> ${casa.direccion}</p>
            <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: var(--ngc-neon); font-weight: bold;"><i class="fa-solid fa-city"></i> Barrio: ${casa.barrio}</p>
            
            <div style="font-size: 0.85rem; color: var(--ngc-text-faded); margin-bottom: 15px; line-height: 1.5; background: var(--ngc-bg-input); border: 1px solid var(--ngc-privacy-border); padding: 12px; border-radius: 8px;">
                ${casa.horario ? `<div style="margin-bottom:4px;"><b><i class="fa-regular fa-clock"></i> Horario:</b> ${casa.horario}</div>` : ''}
                ${casa.telefono ? `<div style="margin-bottom:4px;"><b><i class="fa-solid fa-phone"></i> Tel:</b> ${casa.telefono}</div>` : ''}
                ${casa.comentarios ? `<div style="margin-top: 8px; border-top: 1px dashed var(--ngc-privacy-border); padding-top: 8px; color: var(--ngc-warning);"><b><i class="fa-solid fa-comment-dots"></i> Info:</b> ${casa.comentarios}</div>` : ''}
            </div>

            <div class="action-grid-main">
                <button class="corp-btn primary-action" onclick="abrirMaps('${escapeHtml(casa.nombre)}', '${escapeHtml(casa.direccion)}', '${casa.latitud}', '${casa.longitud}')">
                    <i class="fa-solid fa-map-location-dot"></i> MAPA
                </button>
                ${btnAccionSecundaria}
            </div>
        </div>
    `;
}

function renderCasas(lista) {
    const contenedor = document.getElementById('resultadosContainer');
    contenedor.innerHTML = '';
    
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="corp-card" style="text-align: center; color: var(--ngc-text-faded);">
                No se encontraron proveedores con esa búsqueda.
            </div>`;
        return;
    }

    lista.forEach(casa => {
        contenedor.innerHTML += generarHtmlTarjeta(casa);
    });
}

function filtrarCasas() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const contenedor = document.getElementById('resultadosContainer');
    const btnVerTodos = document.getElementById('btnVerTodos');

    if (modoListadoCompleto) {
        btnVerTodos.innerHTML = '<i class="fa-solid fa-list"></i> Ver Listado Completo por Barrios';
        btnVerTodos.className = "corp-btn";
        btnVerTodos.style.color = "var(--ngc-warning)";
        btnVerTodos.style.background = "rgba(245, 195, 59, 0.1)";
        modoListadoCompleto = false;
    }

    if (query.trim() === '') {
        contenedor.style.display = 'none';
        return;
    }

    contenedor.style.display = 'flex';

    const filtradas = dbCasas.filter(c => 
        c.nombre.toLowerCase().includes(query) || 
        c.direccion.toLowerCase().includes(query) ||
        c.comentarios.toLowerCase().includes(query) ||
        c.barrio.toLowerCase().includes(query)
    );
    
    renderCasas(filtradas);
}

function mostrarListadoAgrupado() {
    const contenedor = document.getElementById('resultadosContainer');
    const inputSearch = document.getElementById('searchInput');
    const btnVerTodos = document.getElementById('btnVerTodos');

    if (modoListadoCompleto) {
        contenedor.style.display = 'none';
        btnVerTodos.innerHTML = '<i class="fa-solid fa-list"></i> Ver Listado Completo por Barrios';
        btnVerTodos.className = "corp-btn";
        btnVerTodos.style.color = "var(--ngc-warning)";
        btnVerTodos.style.background = "rgba(245, 195, 59, 0.1)";
        modoListadoCompleto = false;
        return;
    }

    inputSearch.value = '';
    modoListadoCompleto = true;
    btnVerTodos.innerHTML = '<i class="fa-solid fa-xmark"></i> Cerrar Listado Completo';
    btnVerTodos.className = "corp-btn danger-btn"; 
    btnVerTodos.style.color = "";
    btnVerTodos.style.background = "";
    
    contenedor.style.display = 'flex';
    contenedor.innerHTML = ''; 

    const casasPorBarrio = dbCasas.reduce((acc, casa) => {
        const barrioKey = casa.barrio.trim() || 'Sin Barrio Especificado';
        if (!acc[barrioKey]) {
            acc[barrioKey] = [];
        }
        acc[barrioKey].push(casa);
        return acc;
    }, {});

    const barriosOrdenados = Object.keys(casasPorBarrio).sort();

    barriosOrdenados.forEach(barrio => {
        const localesDelBarrio = casasPorBarrio[barrio].sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        let grupoHtml = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--ngc-warning); border-bottom: 1px solid var(--ngc-warning); padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-city"></i> ${barrio}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
        `;
        
        localesDelBarrio.forEach(casa => {
            grupoHtml += generarHtmlTarjeta(casa);
        });

        grupoHtml += `</div></div>`;
        contenedor.innerHTML += grupoHtml;
    });

    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirMaps(nombre, direccion, lat, lng) {
    let query = '';
    
    if (lat && lng && lat.toString().trim() !== '' && lng.toString().trim() !== '') {
        const cleanLat = String(lat).replace(',', '.').trim();
        const cleanLng = String(lng).replace(',', '.').trim();
        query = `${cleanLat},${cleanLng}`;
    } else {
        query = encodeURIComponent(`${nombre}, ${direccion}, Córdoba, Argentina`);
    }
    
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

function escapeHtml(unsafe) {
    return unsafe.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

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
        { nombre: 'Proveedores', icon: 'fa-solid fa-truck-fast', url: '#', active: true }
    ];
    modulos.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `corp-nav-item ${mod.active ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid ${mod.icon}"></i><span>${mod.nombre}</span>`;
        btn.onclick = () => { if(!mod.active) window.location.href = mod.url; };
        footer.appendChild(btn);
    });
});
        

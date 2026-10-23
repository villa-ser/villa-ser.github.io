
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. SISTEMA DE TEMA (Idéntico a Villaser Raíz)
    const btnTemaServicios = document.getElementById('btn-tema-servicios');
    
    function sincronizarTema() {
        const temaGuardado = localStorage.getItem('temaVillaser');
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;

        if (temaGuardado) {
            if (temaGuardado === 'light') document.documentElement.setAttribute('data-theme', 'light');
            else document.documentElement.removeAttribute('data-theme');
            return;
        }

        if (prefiereClaro) document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
    }

    sincronizarTema();

    if (btnTemaServicios) {
        btnTemaServicios.addEventListener('click', () => {
            const esActualClaro = document.documentElement.getAttribute('data-theme') === 'light';
            const nuevoTema = esActualClaro ? 'dark' : 'light';
            
            if (nuevoTema === 'light') document.documentElement.setAttribute('data-theme', 'light');
            else document.documentElement.removeAttribute('data-theme');
            
            localStorage.setItem('temaVillaser', nuevoTema);
        });
    }

    // 2. SISTEMA DE SESIÓN (Lógica Excel Temporal)
    if (localStorage.getItem('villaser_sesion_activa') === 'true') {
        document.getElementById('loginScreen').classList.add('oculto');
        document.getElementById('mainHeader').classList.add('oculto');
        document.getElementById('appScreen').classList.remove('oculto');
        document.getElementById('userMenuWrapper').style.display = 'flex';
    }

    try {
        const response = await fetch('clave.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        window.credenciales = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } catch (error) {
        console.error("Error al cargar credenciales", error);
    }
});

// FUNCIONES DE LOGIN Y MENÚS
function verificarCredenciales() {
    const userIn = document.getElementById('username').value.trim();
    const passIn = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    let accesoConcedido = false;

    for (let i = 1; i < window.credenciales.length; i++) {
        const fila = window.credenciales[i];
        if (fila && fila.length >= 2) {
            if (String(fila[0]).trim() === userIn && String(fila[1]).trim() === passIn) {
                accesoConcedido = true;
                break;
            }
        }
    }

    if (accesoConcedido) {
        localStorage.setItem('villaser_sesion_activa', 'true');
        errorMsg.classList.add('oculto');
        
        document.getElementById('loginScreen').classList.add('oculto');
        document.getElementById('mainHeader').classList.add('oculto');
        document.getElementById('userMenuWrapper').style.display = 'flex';
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        welcomeScreen.classList.remove('oculto');
        welcomeScreen.querySelector('.welcome-text').classList.add('animate-welcome');
        
        setTimeout(() => {
            welcomeScreen.classList.add('oculto');
            document.getElementById('appScreen').classList.remove('oculto');
        }, 2500);
        
    } else {
        errorMsg.classList.remove('oculto');
        document.getElementById('password').value = '';
    }
}

function toggleMenu() {
    const grid = document.getElementById('menuGrid');
    const arrow = document.getElementById('menu-arrow');
    grid.classList.toggle('oculto');
    arrow.style.transform = grid.classList.contains('oculto') ? 'rotate(0deg)' : 'rotate(180deg)';
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('oculto');
}

function cerrarSesion() {
    localStorage.removeItem('villaser_sesion_activa');
    window.location.reload();
}

// CERRAR DROPDOWN AL TOCAR FUERA
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userMenuWrapper');
    const dropdown = document.getElementById('userDropdown');
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto')) {
        dropdown.classList.add('oculto');
    }
});

// EVENTOS DE BOTONES (NAVEGACIÓN)
const rutas = {
    'btnPresupuesto': './presupuesto/index.html',
    'btnMateriales': './materiales/index.html',
    'btnVerClientes': './ver_clientes/index.html',
    'btnNuevoCliente': './nuevo_cliente/index.html',
    'btnCatalogos': './catalogos/index.html',
    'btnFotos': './fotos/index.html',
    'btnCostos': './costos/index.html',
    'btnInformeTecnico': './informe_tecnico/index.html',
    'btnPresupuestoPC': './presupuestoPC/index.html',
    'btnMaterialesPC': './materialesPC/index.html',
    'btnPotenciaPC': './potencia/index.html',
    'btnPresupuestoPC2': './presupuestoPC2/index.html',
    'btnPreguntas': './preguntas/index.html',
    'btnProveedores': './proveedores/index.html'
};

Object.keys(rutas).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => window.location.href = rutas[id]);
});

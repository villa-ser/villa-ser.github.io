// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE (Con tus datos)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB993KWlnMrN5hwRKjL-OmTZ95F7v_FFk0",
  authDomain: "villaser-gestion.firebaseapp.com",
  projectId: "villaser-gestion",
  storageBucket: "villaser-gestion.firebasestorage.app",
  messagingSenderId: "1032102638132",
  appId: "1:1032102638132:web:dd3a89e1c6a67de7d35061",
  measurementId: "G-CS6MWCYNFD"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
    
    // 2. SISTEMA DE TEMA (Idéntico a Villaser Raíz)
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

    // 3. VIGILANTE DE ESTADO DE AUTENTICACIÓN FIREBASE
    auth.onAuthStateChanged(user => {
        if (user) {
            // El usuario ya está logueado
            mostrarAppPrincipal(user.email);
        } else {
            // No hay usuario, mostramos pantalla de login
            document.getElementById('loginScreen').classList.remove('oculto');
            document.getElementById('mainHeader').classList.remove('oculto');
            document.getElementById('appScreen').classList.add('oculto');
            document.getElementById('userMenuWrapper').style.display = 'none';
        }
    });

    // Permitir Enter para iniciar sesión
    document.getElementById('passwordInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            iniciarSesion();
        }
    });
});

// ==========================================
// FUNCIONES DE FIREBASE (LOGIN, LOGOUT, RECOVERY)
// ==========================================

function iniciarSesion() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorTextContent');

    if (!email || !password) {
        errorText.innerText = "Completa correo y contraseña.";
        errorMsg.classList.remove('oculto');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Éxito. El listener onAuthStateChanged tomará el control.
            errorMsg.classList.add('oculto');
        })
        .catch((error) => {
            // Manejo de errores amigable
            errorMsg.classList.remove('oculto');
            errorMsg.style.color = "var(--error-red)";
            document.getElementById('passwordInput').value = '';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorText.innerText = "Usuario no registrado.";
                    break;
                case 'auth/wrong-password':
                    errorText.innerText = "Contraseña incorrecta.";
                    break;
                case 'auth/invalid-email':
                    errorText.innerText = "Formato de correo no válido.";
                    break;
                case 'auth/too-many-requests':
                    errorText.innerText = "Demasiados intentos. Intenta más tarde.";
                    break;
                default:
                    errorText.innerText = "Error al ingresar. Revisa los datos.";
                    console.error(error);
            }
        });
}

function cerrarSesion() {
    auth.signOut().then(() => {
        window.location.reload();
    }).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
}

function recuperarPassword() {
    const email = document.getElementById('emailInput').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorTextContent');

    if (!email) {
        errorMsg.style.color = "var(--error-red)";
        errorText.innerText = "Ingresa tu correo para recuperar la contraseña.";
        errorMsg.classList.remove('oculto');
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            errorMsg.classList.remove('oculto');
            errorMsg.style.color = "var(--success-green)";
            errorText.innerText = `Correo enviado a ${email}. Revisa tu bandeja.`;
        })
        .catch((error) => {
            errorMsg.classList.remove('oculto');
            errorMsg.style.color = "var(--error-red)";
            if (error.code === 'auth/user-not-found') {
                errorText.innerText = "No existe cuenta con este correo.";
            } else {
                errorText.innerText = "Error al enviar correo de recuperación.";
                console.error(error);
            }
        });
}


// ==========================================
// FUNCIONES DE UI Y MENÚS
// ==========================================

function mostrarAppPrincipal(emailUsuario) {
    document.getElementById('loginScreen').classList.add('oculto');
    document.getElementById('mainHeader').classList.add('oculto');
    
    // Mostramos correo en el menú flotante
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) emailDisplay.innerText = emailUsuario;
    
    document.getElementById('userMenuWrapper').style.display = 'flex';
    
    // Animación de bienvenida
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.classList.remove('oculto');
    welcomeScreen.querySelector('.welcome-text').classList.add('animate-welcome');
    
    setTimeout(() => {
        welcomeScreen.classList.add('oculto');
        document.getElementById('appScreen').classList.remove('oculto');
    }, 2500);
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

// Cerrar dropdown al tocar fuera
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userMenuWrapper');
    const dropdown = document.getElementById('userDropdown');
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto')) {
        dropdown.classList.add('oculto');
    }
});

// NAVEGACIÓN DE MÓDULOS
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
        

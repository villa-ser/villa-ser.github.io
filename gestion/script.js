// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE
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

// Variable para controlar el flujo de creación sin mostrar pantallas prematuras
let registrandoCuenta = false;

document.addEventListener("DOMContentLoaded", () => {
    
    // SISTEMA DE TEMA 
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

    // VIGILANTE DE ESTADO DE AUTENTICACIÓN FIREBASE
    auth.onAuthStateChanged(user => {
        if (user) {
            if (registrandoCuenta) {
                return;
            }
            
            // VALIDACIÓN ESTRICTA: Solo entra si verificó el mail
            if (user.emailVerified) {
                document.getElementById('errorMessage').classList.add('oculto');
                mostrarAppPrincipal(user.email);
            } else {
                auth.signOut().then(() => {
                    mostrarMensaje("Debes verificar tu correo para ingresar. Revisa tu bandeja de entrada o SPAM.", "error");
                    mostrarPantallaLogin();
                });
            }
        } else {
            mostrarPantallaLogin();
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
// FUNCIONES DE CONTROL DE UI
// ==========================================

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
        toggleIcon.style.color = 'var(--ngc-neon)';
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
        toggleIcon.style.color = 'var(--ngc-text-faded)';
    }
}

function mostrarMensaje(texto, tipo) {
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorTextContent');
    const errorIcon = document.getElementById('errorIcon');

    errorText.innerText = texto;
    errorMsg.classList.remove('oculto');

    if (tipo === "exito") {
        errorMsg.style.color = "var(--success-green)";
        errorIcon.className = "fa-solid fa-circle-check";
    } else {
        errorMsg.style.color = "var(--error-red)";
        errorIcon.className = "fa-solid fa-circle-exclamation";
    }
}

function mostrarPantallaLogin() {
    document.getElementById('loginScreen').classList.remove('oculto');
    document.getElementById('mainHeader').classList.remove('oculto');
    document.getElementById('appScreen').classList.add('oculto');
    document.getElementById('userMenuWrapper').style.display = 'none';
}


// ==========================================
// FUNCIONES DE FIREBASE (AUTH)
// ==========================================

function crearCuenta() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
        mostrarMensaje("Completa correo y contraseña para crear la cuenta.", "error");
        return;
    }

    registrandoCuenta = true;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // El idioma del correo se configura desde la Consola de Firebase
            userCredential.user.sendEmailVerification().catch(e => console.log(e));
            
            auth.signOut().then(() => {
                registrandoCuenta = false;
                mostrarMensaje("¡Cuenta creada! Se envió un correo de validación a tu bandeja o spam.", "exito");
                document.getElementById('passwordInput').value = '';
                
                // Reiniciar el ícono del ojito si estaba visible
                const passwordInput = document.getElementById('passwordInput');
                const toggleIcon = document.getElementById('togglePasswordIcon');
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
                toggleIcon.style.color = 'var(--ngc-text-faded)';
                
                mostrarPantallaLogin();
            });
        })
        .catch((error) => {
            registrandoCuenta = false;
            let msg = "Error al crear la cuenta.";
            if (error.code === 'auth/email-already-in-use') msg = "Este correo ya se encuentra registrado.";
            if (error.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
            if (error.code === 'auth/invalid-email') msg = "Formato de correo no válido.";
            mostrarMensaje(msg, "error");
        });
}

function iniciarSesion() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
        mostrarMensaje("Completa correo y contraseña.", "error");
        return;
    }

    document.getElementById('errorMessage').classList.add('oculto');

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            document.getElementById('passwordInput').value = '';
            
            // Reiniciar el ojito si da error
            const toggleIcon = document.getElementById('togglePasswordIcon');
            document.getElementById('passwordInput').type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
            toggleIcon.style.color = 'var(--ngc-text-faded)';

            let msg = "Error al ingresar. Revisa los datos.";
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = "Correo o contraseña incorrectos.";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "Demasiados intentos. Intenta más tarde.";
            } else if (error.code === 'auth/invalid-email') {
                msg = "Formato de correo no válido.";
            }
            mostrarMensaje(msg, "error");
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

    if (!email) {
        mostrarMensaje("Ingresa tu correo arriba y presiona recuperar.", "error");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            mostrarMensaje(`Enlace de recuperación enviado a ${email}.`, "exito");
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                mostrarMensaje("No existe una cuenta con este correo.", "error");
            } else {
                mostrarMensaje("Error al enviar el correo. Intenta de nuevo.", "error");
            }
        });
}


// ==========================================
// FUNCIONES DEL MENÚ PRINCIPAL
// ==========================================

function mostrarAppPrincipal(emailUsuario) {
    document.getElementById('loginScreen').classList.add('oculto');
    document.getElementById('mainHeader').classList.add('oculto');
    
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) emailDisplay.innerText = emailUsuario;
    
    document.getElementById('userMenuWrapper').style.display = 'flex';
    
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

document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userMenuWrapper');
    const dropdown = document.getElementById('userDropdown');
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto')) {
        dropdown.classList.add('oculto');
    }
});

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
            

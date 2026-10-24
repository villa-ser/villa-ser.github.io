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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let registrandoCuenta = false;

document.addEventListener("DOMContentLoaded", () => {
    
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

    auth.onAuthStateChanged(user => {
        if (user) {
            if (registrandoCuenta) return;
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

    document.getElementById('passwordInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') iniciarSesion();
    });

    // Cargar previsualización de imagen al seleccionarla
    document.getElementById('confLogo').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // 500 KB Max
                alert("La imagen es muy pesada. Debe ser menor a 500KB.");
                this.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('logoPreview').src = event.target.result;
                document.getElementById('logoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
});

// ==========================================
// FUNCIONES DE CONTROL DE UI & CONFIGURACIÓN
// ==========================================

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
        toggleIcon.style.color = 'var(--ngc-neon)';
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
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

function abrirConfiguracion() {
    // Cargar datos previos si existen
    document.getElementById('confNombre').value = localStorage.getItem('villaser_conf_nombre') || '';
    document.getElementById('confSlogan').value = localStorage.getItem('villaser_conf_slogan') || '';
    document.getElementById('confTelefono').value = localStorage.getItem('villaser_conf_telefono') || '';
    
    const logoGuardado = localStorage.getItem('villaser_conf_logo');
    if (logoGuardado) {
        document.getElementById('logoPreview').src = logoGuardado;
        document.getElementById('logoPreview').style.display = 'block';
    }
    
    document.getElementById('modalConfig').classList.remove('oculto');
    document.getElementById('userDropdown').classList.add('oculto');
}

function cerrarConfiguracion() {
    document.getElementById('modalConfig').classList.add('oculto');
}

function guardarConfiguracion() {
    const nombre = document.getElementById('confNombre').value.trim();
    const slogan = document.getElementById('confSlogan').value.trim();
    const telefono = document.getElementById('confTelefono').value.trim();
    const logoPreview = document.getElementById('logoPreview').src;

    localStorage.setItem('villaser_conf_nombre', nombre);
    localStorage.setItem('villaser_conf_slogan', slogan);
    localStorage.setItem('villaser_conf_telefono', telefono);
    
    // Solo guarda el logo si no está vacío o no es un link genérico
    if (logoPreview && logoPreview.startsWith('data:image')) {
        localStorage.setItem('villaser_conf_logo', logoPreview);
    }

    alert("¡Datos de empresa guardados correctamente!");
    cerrarConfiguracion();
}


// ==========================================
// FUNCIONES DE FIREBASE (AUTH)
// ==========================================

function crearCuenta() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
        mostrarMensaje("Completa correo y contraseña.", "error");
        return;
    }

    registrandoCuenta = true;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            userCredential.user.sendEmailVerification().catch(e => console.log(e));
            auth.signOut().then(() => {
                registrandoCuenta = false;
                mostrarMensaje("¡Cuenta creada! Se envió correo de validación.", "exito");
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').type = 'password';
                document.getElementById('togglePasswordIcon').classList.replace('fa-eye-slash', 'fa-eye');
                document.getElementById('togglePasswordIcon').style.color = 'var(--ngc-text-faded)';
                mostrarPantallaLogin();
            });
        })
        .catch((error) => {
            registrandoCuenta = false;
            let msg = "Error al crear la cuenta.";
            if (error.code === 'auth/email-already-in-use') msg = "Correo ya registrado.";
            if (error.code === 'auth/weak-password') msg = "Mínimo 6 caracteres.";
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
            document.getElementById('passwordInput').type = 'password';
            document.getElementById('togglePasswordIcon').classList.replace('fa-eye-slash', 'fa-eye');
            
            let msg = "Error al ingresar. Revisa los datos.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Datos incorrectos.";
            mostrarMensaje(msg, "error");
        });
}

function cerrarSesion() {
    auth.signOut().then(() => window.location.reload());
}

function recuperarPassword() {
    const email = document.getElementById('emailInput').value.trim();
    if (!email) {
        mostrarMensaje("Ingresa tu correo arriba y presiona recuperar.", "error");
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => mostrarMensaje(`Recuperación enviada a ${email}.`, "exito"))
        .catch(() => mostrarMensaje("Error al enviar el correo.", "error"));
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
    document.getElementById('userDropdown').classList.toggle('oculto');
}

// Cierra modal de configuración al tocar fondo
document.getElementById('modalConfig').addEventListener('click', function(e) {
    if(e.target === this) cerrarConfiguracion();
});

document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userMenuWrapper');
    const dropdown = document.getElementById('userDropdown');
    const modal = document.getElementById('modalConfig');
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto') && modal.classList.contains('oculto')) {
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

// ==========================================
// CONFIGURACIÓN PWA (Instalación)
// ==========================================

// 1. Registrar el Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('ServiceWorker registrado con éxito:', reg.scope))
            .catch(err => console.log('Error al registrar ServiceWorker:', err));
    });
}

// 2. Capturar el evento de instalación
let eventoInstalacion;
const btnInstalar = document.getElementById('btn-instalar'); 

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir el comportamiento por defecto de Chrome
    e.preventDefault();
    eventoInstalacion = e;
    
    // Mostrar nuestro botón personalizado en el menú
    if (btnInstalar) {
        btnInstalar.classList.remove('oculto'); 
        btnInstalar.style.display = 'block'; 
    }
});

if (btnInstalar) {
    btnInstalar.addEventListener('click', async (e) => {
        e.preventDefault(); // Evita que la página salte al hacer clic en el enlace '#'
        if (!eventoInstalacion) return;
        
        // Mostrar el prompt nativo de instalación
        eventoInstalacion.prompt();
        
        // Esperar la respuesta del usuario
        const { outcome } = await eventoInstalacion.userChoice;
        if (outcome === 'accepted') {
            console.log('El usuario instaló la aplicación');
            // Ocultar el botón una vez instalada
            btnInstalar.classList.add('oculto');
            btnInstalar.style.display = 'none';
        }
        
        eventoInstalacion = null;
    });
        }
        

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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
let registrandoCuenta = false;
let cargaInicial = true;

document.addEventListener("DOMContentLoaded", () => {
    
    // --- LÓGICA DE SESIÓN Y SPLASH SCREEN ---
    auth.onAuthStateChanged(user => {
        const procesarAcceso = () => {
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
        };

        if (cargaInicial) {
            setTimeout(() => {
                const splash = document.getElementById('customSplashScreen');
                if (splash) {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.classList.add('oculto'), 500);
                }
                procesarAcceso();
                cargaInicial = false;
            }, 1500); 
        } else {
            procesarAcceso();
        }
    });

    document.getElementById('passwordInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') iniciarSesion();
    });

    // --- PREVISUALIZACIÓN DE LOGO EN CONFIG ---
    document.getElementById('confLogo').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { 
                alert("La imagen es muy pesada. Debe ser menor a 500KB.");
                this.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('logoPreview');
                preview.src = event.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
});

// ==========================================
// 2. ENRUTAMIENTO Y ACCESO A MÓDULOS
// ==========================================
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
    if (btn) {
        btn.addEventListener('click', () => {
            window.location.href = rutas[id];
        });
    }
});

// ==========================================
// 3. FUNCIONES DE CONTROL DE UI & CONFIGURACIÓN
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

function mostrarAppPrincipal(emailUsuario) {
    document.getElementById('loginScreen').classList.add('oculto');
    document.getElementById('mainHeader').classList.add('oculto');
    
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) emailDisplay.innerText = emailUsuario;

    document.getElementById('userMenuWrapper').style.display = 'flex';
    document.getElementById('appScreen').classList.remove('oculto');
}

function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('oculto');
}

// Cierra menú flotante al tocar fuera
document.addEventListener('click', (e) => { 
    const wrapper = document.getElementById('userMenuWrapper'); 
    const dropdown = document.getElementById('userDropdown'); 
    const modal = document.getElementById('modalConfig'); 
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto') && (modal ? modal.classList.contains('oculto') : true)) { 
        dropdown.classList.add('oculto'); 
    } 
});

// --- LÓGICA DE CONFIGURACIÓN ---
function abrirConfiguracion() {
    // Cargar textos
    document.getElementById('confNombre').value = localStorage.getItem('villaser_conf_nombre') || '';
    document.getElementById('confSlogan').value = localStorage.getItem('villaser_conf_slogan') || '';
    document.getElementById('confTelefono').value = localStorage.getItem('villaser_conf_telefono') || '';

    // Cargar logo guardado
    const logoGuardado = localStorage.getItem('villaser_conf_logo');
    if (logoGuardado) {
        document.getElementById('logoPreview').src = logoGuardado;
        document.getElementById('logoPreview').style.display = 'block';
    }

    // Sincronizar estado del switch del tema (Modo Noche / Modo Claro)
    const esClaro = document.documentElement.getAttribute('data-theme') === 'light';
    const checkboxTema = document.getElementById('checkboxTema');
    if(checkboxTema) checkboxTema.checked = esClaro;

    document.getElementById('modalConfig').classList.remove('oculto');
    document.getElementById('userDropdown').classList.add('oculto');
}

function cambiarTemaDesdeConfig() {
    const esClaro = document.getElementById('checkboxTema').checked;
    const nuevoTema = esClaro ? 'light' : 'dark';
    
    if (nuevoTema === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('temaVillaser', nuevoTema);
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

    if (logoPreview && logoPreview.startsWith('data:image')) {
        localStorage.setItem('villaser_conf_logo', logoPreview);
    }

    alert("¡Datos guardados correctamente!");
    cerrarConfiguracion();
}

// ==========================================
// 4. FUNCIONES DE FIREBASE (AUTH)
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
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = "Datos incorrectos.";
            }
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
// 5. CONFIGURACIÓN PWA (INSTALACIÓN)
// ==========================================
if ('serviceWorker' in navigator) { 
    window.addEventListener('load', () => { 
        navigator.serviceWorker.register('./sw.js') 
        .then(reg => console.log('ServiceWorker registrado con éxito:', reg.scope)) 
        .catch(err => console.log('Error al registrar ServiceWorker:', err)); 
    }); 
}

let eventoInstalacion; 
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (e) => { 
    e.preventDefault(); 
    eventoInstalacion = e;
    if (btnInstalar) {
        btnInstalar.classList.remove('oculto'); 
        btnInstalar.style.display = 'block'; 
    }
});

if (btnInstalar) { 
    btnInstalar.addEventListener('click', async (e) => { 
        e.preventDefault(); 
        if (!eventoInstalacion) return;
        
        eventoInstalacion.prompt();
        const { outcome } = await eventoInstalacion.userChoice;
        
        if (outcome === 'accepted') {
            console.log('El usuario instaló la aplicación');
            btnInstalar.classList.add('oculto');
            btnInstalar.style.display = 'none';
        }
        
        eventoInstalacion = null;
    }); 
        }

// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE Y TEMA
// ==========================================
// La configuración ya se cargó externamente desde firebase-config.js
const auth = firebase.auth();
const db = firebase.firestore();

let registrandoCuenta = false;
let cargaInicial = true;

// Lógica inteligente de Tema Corporativo
function aplicarTema(tema) {
    const metaTheme = document.getElementById('themeColorMeta');
    
    if (tema === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (metaTheme) metaTheme.setAttribute('content', '#F0F2F5');
    } else if (tema === 'system') {
        const prefiereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefiereClaro) {
            document.documentElement.setAttribute('data-theme', 'light');
            if (metaTheme) metaTheme.setAttribute('content', '#F0F2F5');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (metaTheme) metaTheme.setAttribute('content', '#18191A');
        }
    } else { // dark
        document.documentElement.removeAttribute('data-theme');
        if (metaTheme) metaTheme.setAttribute('content', '#18191A');
    }
}

function cambiarTemaManual(nuevoTema) {
    localStorage.setItem('temaVillaser', nuevoTema);
    aplicarTema(nuevoTema);
}

document.addEventListener("DOMContentLoaded", () => {
    // Escuchar si el teléfono cambia de modo automáticamente
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
        if (temaGuardado === 'system') aplicarTema('system');
    });

    // --- LÓGICA DE SESIÓN Y SPLASH SCREEN ---
    auth.onAuthStateChanged(async (user) => {
        if (registrandoCuenta) return;

        if (user) {
            if (user.emailVerified) {
                // Descargamos de Firebase silenciosamente y actualizamos local
                try {
                    const doc = await db.collection('perfiles').doc(user.uid).get();
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.nombre) localStorage.setItem('villaser_conf_nombre', data.nombre);
                        if (data.slogan) localStorage.setItem('villaser_conf_slogan', data.slogan);
                        if (data.telefono) localStorage.setItem('villaser_conf_telefono', data.telefono);
                        if (data.logo) localStorage.setItem('villaser_conf_logo', data.logo);
                    }
                } catch (error) {
                    console.error("Error leyendo Firebase. Verifica las Reglas.", error);
                }

                document.getElementById('errorMessage').classList.add('oculto');
                mostrarAppPrincipal(user.email);
            } else {
                await auth.signOut();
                mostrarMensaje("Debes verificar tu correo para ingresar.", "error");
                mostrarPantallaLogin();
            }
        } else {
            mostrarPantallaLogin();
        }

        // Ocultar splash screen SOLO DESPUÉS de comprobar todo el estado
        if (cargaInicial) {
            const splash = document.getElementById('customSplashScreen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.classList.add('oculto'), 500);
            }
            cargaInicial = false;
        }

        // Restaurar estado visual del botón Login
        const btnLogin = document.getElementById('loginBtn');
        if (btnLogin) {
            btnLogin.innerHTML = '<i class="fa-solid fa-lock-open"></i> Ingresar';
            btnLogin.disabled = false;
        }
    });

    document.getElementById('passwordInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') iniciarSesion();
    });

    // --- PREVISUALIZACIÓN DE LOGO ---
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
    'btnInformeTecnico': './informes/index.html',
    'btnCostos': './costos/index.html',
    'btnPotencia': './potencia/index.html',
    'btnAgenda': './agenda/index.html',
    'btnPresupuesto2': './presupuesto2/index.html',
    'btnNuevoCliente': './nuevo_cliente/index.html',
    'btnCatalogos': './catalogos/index.html',
    'btnFotos': './fotos/index.html',
    'btnPresupuestoPC': './presupuestoPC/index.html',
    'btnMaterialesPC': './materialesPC/index.html',
    'btnPreguntas': './preguntas/index.html',
    'btnProveedores': './proveedores/index.html'
};

Object.keys(rutas).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => window.location.href = rutas[id]);
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
        toggleIcon.style.color = 'var(--corp-accent)';
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
        toggleIcon.style.color = 'var(--corp-text-faded)';
    }
}

function mostrarMensaje(texto, tipo) {
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorTextContent');
    const errorIcon = document.getElementById('errorIcon');
    
    errorText.innerText = texto;
    errorMsg.classList.remove('oculto');
    
    if (tipo === "exito") {
        errorMsg.style.color = "var(--corp-success)";
        errorIcon.className = "fa-solid fa-circle-check";
    } else {
        errorMsg.style.color = "var(--corp-danger)";
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

// Cierra menús al tocar fuera
document.addEventListener('click', (e) => { 
    const wrapper = document.getElementById('userMenuWrapper'); 
    const dropdown = document.getElementById('userDropdown'); 
    const modal = document.getElementById('modalConfig'); 
    if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('oculto') && (modal ? modal.classList.contains('oculto') : true)) { 
        dropdown.classList.add('oculto'); 
    } 
});

async function abrirConfiguracion() {
    document.getElementById('modalConfig').classList.remove('oculto');
    document.getElementById('userDropdown').classList.add('oculto');

    // 1. Cargar rápido de memoria local
    document.getElementById('confNombre').value = localStorage.getItem('villaser_conf_nombre') || '';
    document.getElementById('confSlogan').value = localStorage.getItem('villaser_conf_slogan') || '';
    document.getElementById('confTelefono').value = localStorage.getItem('villaser_conf_telefono') || '';
    
    const logoGuardado = localStorage.getItem('villaser_conf_logo');
    if (logoGuardado) {
        document.getElementById('logoPreview').src = logoGuardado;
        document.getElementById('logoPreview').style.display = 'block';
    } else {
        document.getElementById('logoPreview').style.display = 'none';
    }

    const temaGuardado = localStorage.getItem('temaVillaser') || 'system';
    const radioTema = document.getElementById(`tema_${temaGuardado}`);
    if(radioTema) radioTema.checked = true;

    // 2. Si no hay datos locales, forzamos lectura a la nube
    const user = auth.currentUser;
    if (user && !document.getElementById('confNombre').value) {
        try {
            const doc = await db.collection('perfiles').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.nombre) { document.getElementById('confNombre').value = data.nombre; localStorage.setItem('villaser_conf_nombre', data.nombre); }
                if (data.slogan) { document.getElementById('confSlogan').value = data.slogan; localStorage.setItem('villaser_conf_slogan', data.slogan); }
                if (data.telefono) { document.getElementById('confTelefono').value = data.telefono; localStorage.setItem('villaser_conf_telefono', data.telefono); }
                if (data.logo) {
                    document.getElementById('logoPreview').src = data.logo;
                    document.getElementById('logoPreview').style.display = 'block';
                    localStorage.setItem('villaser_conf_logo', data.logo);
                }
            }
        } catch (e) {
            console.log("No se pudo leer de la nube al abrir config", e);
        }
    }
}

function cerrarConfiguracion() { document.getElementById('modalConfig').classList.add('oculto'); }

function abrirTerminos(desdeRegistro) {
    document.getElementById('modalTerminos').classList.remove('oculto');
    const contenedorDescarga = document.getElementById('btnDescargaPdfContainer');
    
    if (desdeRegistro) {
        contenedorDescarga.style.display = 'block';
    } else {
        contenedorDescarga.style.display = 'none';
        document.getElementById('userDropdown').classList.add('oculto');
    }
}

function cerrarTerminos() { document.getElementById('modalTerminos').classList.add('oculto'); }
document.getElementById('modalTerminos').addEventListener('click', function(e) { if(e.target === this) cerrarTerminos(); });

function guardarConfiguracion() {
    const nombre = document.getElementById('confNombre').value.trim();
    const slogan = document.getElementById('confSlogan').value.trim();
    const telefono = document.getElementById('confTelefono').value.trim();
    const logoPreview = document.getElementById('logoPreview').src;

    const user = auth.currentUser;
    if (!user) {
        alert("Sesión caducada. Inicia sesión nuevamente para guardar.");
        return;
    }

    localStorage.setItem('villaser_conf_nombre', nombre);
    localStorage.setItem('villaser_conf_slogan', slogan);
    localStorage.setItem('villaser_conf_telefono', telefono);

    const perfilData = {
        nombre: nombre,
        slogan: slogan,
        telefono: telefono
    };

    if (logoPreview && logoPreview.startsWith('data:image')) {
        localStorage.setItem('villaser_conf_logo', logoPreview);
        perfilData.logo = logoPreview;
    }

    // Cerrar modal de config y abrir el Modal de Éxito Corporativo
    cerrarConfiguracion();
    document.getElementById('modalExitoCorp').classList.remove('oculto');

    // Sincronizar con Firebase EN SEGUNDO PLANO
    db.collection('perfiles').doc(user.uid).set(perfilData, { merge: true })
        .then(() => console.log("Datos sincronizados exitosamente."))
        .catch((error) => {
            console.error("Error nube:", error);
        });
}

// Función para cerrar el Modal de Éxito
function cerrarModalExitoCorp() {
    document.getElementById('modalExitoCorp').classList.add('oculto');
}

// ==========================================
// 4. FUNCIONES DE FIREBASE (AUTH)
// ==========================================
function crearCuenta() { 
    const email = document.getElementById('emailInput').value.trim(); 
    const password = document.getElementById('passwordInput').value.trim();
    const aceptaTerminos = document.getElementById('aceptaTerminos').checked;
    
    if (!email || !password) {
        mostrarMensaje("Completa correo y contraseña.", "error"); return;
    }
    if (!aceptaTerminos) {
        mostrarMensaje("Debes aceptar los Términos y Condiciones.", "error"); return;
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
                document.getElementById('togglePasswordIcon').style.color = 'var(--corp-text-faded)';
                document.getElementById('aceptaTerminos').checked = false; 
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
        mostrarMensaje("Completa correo y contraseña.", "error"); return;
    }
    
    document.getElementById('errorMessage').classList.add('oculto');

    const btnLogin = document.getElementById('loginBtn');
    btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    btnLogin.disabled = true;

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => auth.signInWithEmailAndPassword(email, password))
        .catch((error) => {
            btnLogin.innerHTML = '<i class="fa-solid fa-lock-open"></i> Ingresar';
            btnLogin.disabled = false;

            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').type = 'password';
            document.getElementById('togglePasswordIcon').classList.replace('fa-eye-slash', 'fa-eye');
            
            let msg = "Error al ingresar. Revisa los datos.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Datos incorrectos.";
            mostrarMensaje(msg, "error");
        });
}

function cerrarSesion() {
    localStorage.removeItem('villaser_conf_nombre');
    localStorage.removeItem('villaser_conf_slogan');
    localStorage.removeItem('villaser_conf_telefono');
    localStorage.removeItem('villaser_conf_logo');
    
    auth.signOut().then(() => window.location.reload());
}

function recuperarPassword() {
    const email = document.getElementById('emailInput').value.trim();
    if (!email) {
        mostrarMensaje("Ingresa tu correo arriba y presiona recuperar.", "error"); return;
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
        btnInstalar.style.display = 'flex'; 
    }
});

if (btnInstalar) { 
    btnInstalar.addEventListener('click', async (e) => { 
        e.preventDefault(); 
        if (!eventoInstalacion) return;
        eventoInstalacion.prompt();
        const { outcome } = await eventoInstalacion.userChoice;
        if (outcome === 'accepted') {
            btnInstalar.classList.add('oculto');
            btnInstalar.style.display = 'none';
        }
        eventoInstalacion = null;
    }); 
        }
        

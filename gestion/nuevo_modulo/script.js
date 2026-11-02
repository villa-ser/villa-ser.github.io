// ==========================================
// MOTOR DE ARRANQUE Y DOBLE CANDADO FIREBASE
// ==========================================
let db = null;
let uidSeguro = null;
const CORREO_MAESTRO = "contacto@villaser.com.ar"; // REEMPLAZA CON TU CORREO EXACTO

function arrancarModuloPrueba() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.firestore();
            
            firebase.auth().onAuthStateChanged(user => {
                // DOBLE CANDADO: Sin sesión, sin verificar, o correo distinto al Maestro -> Expulsión
                if (!user || !user.emailVerified || user.email !== CORREO_MAESTRO) {
                    console.warn("Acceso denegado. Redirigiendo...");
                    window.location.replace('../index.html');
                } else {
                    // Acceso concedido: Guardar UID e iniciar lógica
                    uidSeguro = user.uid;
                    inicializarInterfaz();
                }
            });
        }
    } catch (e) {
        console.error("Error al iniciar Firebase en módulo de prueba:", e);
        window.location.replace('../index.html');
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarModuloPrueba);
} else {
    arrancarModuloPrueba();
}

// ==========================================
// LÓGICA DEL NUEVO MÓDULO
// ==========================================
function inicializarInterfaz() {
    console.log("Entorno de pruebas cargado correctamente como Usuario Maestro.");
    // Aquí puedes comenzar a escribir la lógica de tu nuevo módulo con total seguridad
}

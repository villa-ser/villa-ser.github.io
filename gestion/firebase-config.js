// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyB993KWlnMrN5hwRKjL-OmTZ95F7v_FFk0",
    authDomain: "villaser-gestion.firebaseapp.com",
    projectId: "villaser-gestion",
    storageBucket: "villaser-gestion.firebasestorage.app",
    messagingSenderId: "1032102638132",
    appId: "1:1032102638132:web:dd3a89e1c6a67de7d35061",
    measurementId: "G-CS6MWCYNFD"
};

// Inicializar Firebase solo si no ha sido inicializado antes (evita errores de duplicación)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

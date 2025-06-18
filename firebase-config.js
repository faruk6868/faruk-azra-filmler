// Firebase yapılandırması
// Bu dosyayı kendi Firebase projenizin bilgileriyle güncelleyin

const firebaseConfig = {
    apiKey: "AIzaSyAWrbd7y627r4lFkXd2PCzA2tYQGL20rM4",
    authDomain: "faruk-azra-filmler.firebaseapp.com",
    databaseURL: "https://faruk-azra-filmler-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "faruk-azra-filmler",
    storageBucket: "faruk-azra-filmler.firebasestorage.app",
    messagingSenderId: "786002782657",
    appId: "1:786002782657:web:fcc3ea205c328dbefc2740"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Database referansı
const database = firebase.database();
const moviesRef = database.ref('movies');

// Bağlantı durumu kontrolü
const connectedRef = database.ref('.info/connected');

// Global değişkenler
window.firebaseDatabase = database;
window.moviesRef = moviesRef;
window.connectedRef = connectedRef; 

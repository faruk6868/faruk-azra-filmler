// Film verileri için Firebase key
const MOVIES_KEY = 'movies';

// DOM elemanları
const movieForm = document.getElementById('movieForm');
const moviesList = document.getElementById('moviesList');
const ratingInput = document.getElementById('rating');
const ratingValue = document.getElementById('ratingValue');
const filterBy = document.getElementById('filterBy');
const sortBy = document.getElementById('sortBy');
const totalMoviesEl = document.getElementById('totalMovies');
const avgRatingEl = document.getElementById('avgRating');
const bestMovieEl = document.getElementById('bestMovie');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const onlineStatus = document.querySelector('.online-status');

// Film verileri
let movies = [];
let isConnected = false;

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Uygulamayı başlat
function initializeApp() {
    // Event listeners
    movieForm.addEventListener('submit', addMovie);
    ratingInput.addEventListener('input', updateRatingDisplay);
    filterBy.addEventListener('change', displayMovies);
    sortBy.addEventListener('change', displayMovies);
    
    // Firebase bağlantısını kontrol et
    checkFirebaseConnection();
    
    // Firebase yoksa localStorage kullan
    if (typeof firebase === 'undefined') {
        loadMoviesFromLocal();
        displayMovies();
        updateStats();
        updateConnectionStatus(false, 'Çevrimdışı - Yerel kullanım');
    } else {
        setupFirebaseListeners();
    }
}

// Firebase bağlantısını kontrol et
function checkFirebaseConnection() {
    if (typeof firebase === 'undefined') {
        console.log('Firebase yüklenemedi, yerel mod aktif');
        return;
    }
    
    // Bağlantı durumunu izle
    window.connectedRef.on('value', (snapshot) => {
        isConnected = snapshot.val();
        if (isConnected) {
            updateConnectionStatus(true, 'Çevrimiçi - Canlı senkronizasyon');
        } else {
            updateConnectionStatus(false, 'Bağlantı kesildi');
        }
    });
}

// Firebase event listener'larını kur
function setupFirebaseListeners() {
    // Tüm filmleri dinle
    window.moviesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            movies = Object.keys(data).map(key => ({
                firebaseKey: key,
                ...data[key]
            }));
        } else {
            movies = [];
        }
        displayMovies();
        updateStats();
    });
    
    // Hata durumunu dinle
    window.moviesRef.on('error', (error) => {
        console.error('Firebase hatası:', error);
        updateConnectionStatus(false, 'Bağlantı hatası');
        // Hata durumunda localStorage'a geç
        loadMoviesFromLocal();
        displayMovies();
        updateStats();
    });
}

// Bağlantı durumunu güncelle
function updateConnectionStatus(connected, message) {
    statusText.textContent = message;
    
    if (connected) {
        statusIcon.className = 'fas fa-wifi';
        onlineStatus.className = 'online-status connected';
    } else {
        statusIcon.className = 'fas fa-wifi-slash';
        onlineStatus.className = 'online-status disconnected';
    }
}

// Rating slider'ının değerini güncelle
function updateRatingDisplay() {
    ratingValue.textContent = ratingInput.value;
}

// LocalStorage'dan filmleri yükle (backup)
function loadMoviesFromLocal() {
    const savedMovies = localStorage.getItem('couplesMovies');
    if (savedMovies) {
        movies = JSON.parse(savedMovies);
    }
}

// LocalStorage'a filmleri kaydet (backup)
function saveMoviesToLocal() {
    localStorage.setItem('couplesMovies', JSON.stringify(movies));
}

// Yeni film ekle
function addMovie(e) {
    e.preventDefault();
    
    const movieName = document.getElementById('movieName').value.trim();
    const whoAdded = document.getElementById('whoAdded').value;
    const rating = parseInt(document.getElementById('rating').value);
    const notes = document.getElementById('notes').value.trim();
    
    if (!movieName || !whoAdded) {
        alert('Lütfen film adını ve kim eklediğini belirtiniz!');
        return;
    }
    
    // Yeni film objesi oluştur
    const newMovie = {
        id: Date.now(),
        name: movieName,
        whoAdded: whoAdded,
        rating: rating,
        notes: notes,
        dateAdded: new Date().toISOString(),
        dateAddedFormatted: formatDate(new Date())
    };
    
    // Firebase'e ekle
    if (typeof firebase !== 'undefined' && isConnected) {
        window.moviesRef.push(newMovie)
            .then(() => {
                showNotification('Film başarıyla eklendi! 🎬', 'success');
                resetForm();
            })
            .catch((error) => {
                console.error('Film eklenirken hata:', error);
                showNotification('Film eklenirken hata oluştu!', 'error');
            });
    } else {
        // Çevrimdışıysa localStorage'a ekle
        movies.unshift(newMovie);
        saveMoviesToLocal();
        displayMovies();
        updateStats();
        showNotification('Film çevrimdışı eklendi! 📱', 'success');
        resetForm();
    }
}

// Formu sıfırla
function resetForm() {
    movieForm.reset();
    ratingInput.value = 5;
    ratingValue.textContent = '5';
}

// Tarihi formatla
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('tr-TR', options);
}

// Filmleri görüntüle
function displayMovies() {
    const filteredMovies = filterMovies();
    const sortedMovies = sortMovies(filteredMovies);
    
    if (sortedMovies.length === 0) {
        moviesList.innerHTML = `
            <div class="no-movies">
                <i class="fas fa-film"></i>
                <p>Henüz film eklenmemiş</p>
                <p>İlk filminizi ekleyerek başlayın!</p>
            </div>
        `;
        return;
    }
    
    moviesList.innerHTML = sortedMovies.map(movie => `
        <div class="movie-card">
            <button class="delete-btn" onclick="deleteMovie('${movie.firebaseKey || movie.id}')" title="Filmi Sil">
                <i class="fas fa-trash"></i>
            </button>
            
            <div class="movie-title">${movie.name}</div>
            
            <div class="movie-info">
                <span>
                    <i class="fas fa-user"></i>
                    ${movie.whoAdded} tarafından eklendi
                </span>
                <span>
                    <i class="fas fa-calendar"></i>
                    ${movie.dateAddedFormatted}
                </span>
            </div>
            
            <div class="movie-rating">
                <div class="rating-stars">
                    ${generateStars(movie.rating)}
                </div>
                <span class="rating-number">${movie.rating}/10</span>
            </div>
            
            ${movie.notes ? `<div class="movie-notes">"${movie.notes}"</div>` : ''}
        </div>
    `).join('');
}

// Yıldız ikonları oluştur
function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 === 1;
    
    // Tam yıldızlar
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Yarım yıldız
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Boş yıldızlar
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Filmleri filtrele
function filterMovies() {
    const filterValue = filterBy.value;
    
    if (filterValue === 'all') {
        return movies;
    }
    
    return movies.filter(movie => movie.whoAdded === filterValue);
}

// Filmleri sırala
function sortMovies(movieList) {
    const sortValue = sortBy.value;
    
    return [...movieList].sort((a, b) => {
        switch (sortValue) {
            case 'date-desc':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            case 'date-asc':
                return new Date(a.dateAdded) - new Date(b.dateAdded);
            case 'rating-desc':
                return b.rating - a.rating;
            case 'rating-asc':
                return a.rating - b.rating;
            case 'name-asc':
                return a.name.localeCompare(b.name, 'tr');
            case 'name-desc':
                return b.name.localeCompare(a.name, 'tr');
            default:
                return 0;
        }
    });
}

// Film sil
function deleteMovie(movieKey) {
    if (confirm('Bu filmi silmek istediğinizden emin misiniz?')) {
        if (typeof firebase !== 'undefined' && isConnected && movieKey.startsWith('-')) {
            // Firebase'den sil
            window.moviesRef.child(movieKey).remove()
                .then(() => {
                    showNotification('Film silindi! 🗑️', 'info');
                })
                .catch((error) => {
                    console.error('Film silinirken hata:', error);
                    showNotification('Film silinirken hata oluştu!', 'error');
                });
        } else {
            // localStorage'dan sil
            movies = movies.filter(movie => (movie.firebaseKey || movie.id.toString()) !== movieKey.toString());
            saveMoviesToLocal();
            displayMovies();
            updateStats();
            showNotification('Film silindi! 🗑️', 'info');
        }
    }
}

// İstatistikleri güncelle
function updateStats() {
    const totalMovies = movies.length;
    totalMoviesEl.textContent = totalMovies;
    
    if (totalMovies === 0) {
        avgRatingEl.textContent = '0.0';
        bestMovieEl.textContent = '-';
        return;
    }
    
    // Ortalama puan hesapla
    const totalRating = movies.reduce((sum, movie) => sum + movie.rating, 0);
    const avgRating = (totalRating / totalMovies).toFixed(1);
    avgRatingEl.textContent = avgRating;
    
    // En yüksek puanlı filmi bul
    const bestMovie = movies.reduce((best, movie) => 
        movie.rating > best.rating ? movie : best
    );
    
    // En iyi film için kısa isim (çok uzunsa)
    let bestMovieName = bestMovie.name;
    if (bestMovieName.length > 15) {
        bestMovieName = bestMovieName.substring(0, 15) + '...';
    }
    
    bestMovieEl.textContent = `${bestMovieName} (${bestMovie.rating}/10)`;
}

// Bildirim göster
function showNotification(message, type = 'success') {
    // Önceki bildirimleri temizle
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Yeni bildirim oluştur
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let bgColor = '#48bb78'; // success
    if (type === 'info') bgColor = '#3182ce';
    if (type === 'error') bgColor = '#e53e3e';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS animasyonları ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Klavye kısayolları
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter: Formu gönder
    if (e.ctrlKey && e.key === 'Enter') {
        const movieNameInput = document.getElementById('movieName');
        if (document.activeElement === movieNameInput || 
            document.activeElement === document.getElementById('notes')) {
            movieForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape: Formu temizle
    if (e.key === 'Escape') {
        resetForm();
        document.getElementById('movieName').focus();
    }
});

// Film adı inputuna odaklan
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.getElementById('movieName').focus();
    }, 100);
}); 
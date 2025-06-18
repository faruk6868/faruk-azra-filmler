// Firebase keys
const MOVIES_KEY = 'movies';
const WATCHLIST_KEY = 'watchlist';

// DOM elemanları
const movieForm = document.getElementById('movieForm');
const watchlistForm = document.getElementById('watchlistMovieForm');
const moviesList = document.getElementById('moviesList');
const watchlistList = document.getElementById('watchlistList');
const ratingInput = document.getElementById('rating');
const ratingValue = document.getElementById('ratingValue');
const filterBy = document.getElementById('filterBy');
const sortBy = document.getElementById('sortBy');
const watchlistFilterBy = document.getElementById('watchlistFilterBy');
const watchlistSortBy = document.getElementById('watchlistSortBy');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const onlineStatus = document.querySelector('.online-status');

// Modal elemanları
const watchedModal = document.getElementById('watchedModal');
const markWatchedForm = document.getElementById('markWatchedForm');
const modalRating = document.getElementById('modalRating');
const modalRatingValue = document.getElementById('modalRatingValue');
const modalStarsPreview = document.getElementById('modalStarsPreview');
const modalMovieInfo = document.getElementById('modalMovieInfo');
const modalNotes = document.getElementById('modalNotes');
const modalWhoAdded = document.getElementById('modalWhoAdded');

// İstatistik elemanları
const totalMoviesEl = document.getElementById('totalMovies');
const avgRatingEl = document.getElementById('avgRating');
const bestMovieEl = document.getElementById('bestMovie');
const totalWatchlistEl = document.getElementById('totalWatchlist');
const highPriorityEl = document.getElementById('highPriority');
const mostWantedGenreEl = document.getElementById('mostWantedGenre');

// Veri dizileri
let movies = [];
let watchlist = [];
let isConnected = false;
let currentTab = 'watched';
let currentWatchlistMovie = null; // Modal için seçilen film

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Uygulamayı başlat
function initializeApp() {
    // Event listeners
    movieForm.addEventListener('submit', addWatchedMovie);
    watchlistForm.addEventListener('submit', addWatchlistMovie);
    markWatchedForm.addEventListener('submit', submitWatchedMovie);
    ratingInput.addEventListener('input', updateRatingDisplay);
    modalRating.addEventListener('input', updateModalRatingDisplay);
    filterBy.addEventListener('change', displayMovies);
    sortBy.addEventListener('change', displayMovies);
    watchlistFilterBy.addEventListener('change', displayWatchlist);
    watchlistSortBy.addEventListener('change', displayWatchlist);
    
    // İlk sekmesini aktif hale getir
    initializeTabs();
    
    // Firebase bağlantısını kontrol et
    checkFirebaseConnection();
    
    // Firebase yoksa localStorage kullan
    if (typeof firebase === 'undefined') {
        loadMoviesFromLocal();
        loadWatchlistFromLocal();
        displayMovies();
        displayWatchlist();
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
    // İzlenen filmleri dinle
    window.firebaseDatabase.ref(MOVIES_KEY).on('value', (snapshot) => {
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
    
    // İzlenecek filmleri dinle
    window.firebaseDatabase.ref(WATCHLIST_KEY).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            watchlist = Object.keys(data).map(key => ({
                firebaseKey: key,
                ...data[key]
            }));
        } else {
            watchlist = [];
        }
        displayWatchlist();
        updateStats();
    });
    
    // Hata durumunu dinle
    window.firebaseDatabase.ref(MOVIES_KEY).on('error', (error) => {
        console.error('Firebase hatası:', error);
        updateConnectionStatus(false, 'Bağlantı hatası');
        loadMoviesFromLocal();
        loadWatchlistFromLocal();
        displayMovies();
        displayWatchlist();
        updateStats();
    });
}

// Sekmesi başlat (sayfa yüklenirken)
function initializeTabs() {
    // İlk tab aktif olsun
    currentTab = 'watched';
    
    // Tüm tab'ları sıfırla
    document.getElementById('watchedForm').classList.remove('hidden');
    document.getElementById('watchedStats').classList.remove('hidden');
    document.getElementById('watchedFilter').classList.remove('hidden');
    document.getElementById('watchedMovies').classList.remove('hidden');
    
    document.getElementById('watchlistForm').classList.add('hidden');
    document.getElementById('watchlistStats').classList.add('hidden');
    document.getElementById('watchlistFilter').classList.add('hidden');
    document.getElementById('watchlistMovies').classList.add('hidden');
    
    // İlk tab butonunu aktif yap
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn[onclick="switchTab(\'watched\')"]').classList.add('active');
}

// Sekme değiştir
function switchTab(tab) {
    currentTab = tab;
    
    // Tab butonlarını güncelle
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (tab === 'watched') {
        // İzlenen filmler sekmesi
        document.getElementById('watchedForm').classList.remove('hidden');
        document.getElementById('watchedStats').classList.remove('hidden');
        document.getElementById('watchedFilter').classList.remove('hidden');
        document.getElementById('watchedMovies').classList.remove('hidden');
        
        document.getElementById('watchlistForm').classList.add('hidden');
        document.getElementById('watchlistStats').classList.add('hidden');
        document.getElementById('watchlistFilter').classList.add('hidden');
        document.getElementById('watchlistMovies').classList.add('hidden');
    } else {
        // İzlenecek filmler sekmesi
        document.getElementById('watchlistForm').classList.remove('hidden');
        document.getElementById('watchlistStats').classList.remove('hidden');
        document.getElementById('watchlistFilter').classList.remove('hidden');
        document.getElementById('watchlistMovies').classList.remove('hidden');
        
        document.getElementById('watchedForm').classList.add('hidden');
        document.getElementById('watchedStats').classList.add('hidden');
        document.getElementById('watchedFilter').classList.add('hidden');
        document.getElementById('watchedMovies').classList.add('hidden');
    }
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

// Modal rating slider'ının değerini güncelle
function updateModalRatingDisplay() {
    modalRatingValue.textContent = modalRating.value;
    modalStarsPreview.innerHTML = generateStars(parseInt(modalRating.value));
}

// LocalStorage'dan filmleri yükle (backup)
function loadMoviesFromLocal() {
    const savedMovies = localStorage.getItem('couplesMovies');
    if (savedMovies) {
        movies = JSON.parse(savedMovies);
    }
}

function loadWatchlistFromLocal() {
    const savedWatchlist = localStorage.getItem('couplesWatchlist');
    if (savedWatchlist) {
        watchlist = JSON.parse(savedWatchlist);
    }
}

// LocalStorage'a filmleri kaydet (backup)
function saveMoviesToLocal() {
    localStorage.setItem('couplesMovies', JSON.stringify(movies));
}

function saveWatchlistToLocal() {
    localStorage.setItem('couplesWatchlist', JSON.stringify(watchlist));
}

// İzlenen film ekle
function addWatchedMovie(e) {
    e.preventDefault();
    
    const movieName = document.getElementById('movieName').value.trim();
    const whoAdded = document.getElementById('whoAdded').value;
    const rating = parseInt(document.getElementById('rating').value);
    const notes = document.getElementById('notes').value.trim();
    
    if (!movieName || !whoAdded) {
        alert('Lütfen film adını ve kim eklediğini belirtiniz!');
        return;
    }
    
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
        window.firebaseDatabase.ref(MOVIES_KEY).push(newMovie)
            .then(() => {
                showNotification('Film başarıyla eklendi! 🎬', 'success');
                resetWatchedForm();
            })
            .catch((error) => {
                console.error('Film eklenirken hata:', error);
                showNotification('Film eklenirken hata oluştu!', 'error');
            });
    } else {
        movies.unshift(newMovie);
        saveMoviesToLocal();
        displayMovies();
        updateStats();
        showNotification('Film çevrimdışı eklendi! 📱', 'success');
        resetWatchedForm();
    }
}

// İzlenecek film ekle
function addWatchlistMovie(e) {
    e.preventDefault();
    
    const movieName = document.getElementById('watchlistMovieName').value.trim();
    const whoSuggested = document.getElementById('whoSuggested').value;
    const priority = document.getElementById('priority').value;
    const genre = document.getElementById('genre').value;
    const platform = document.getElementById('platform').value;
    const notes = document.getElementById('watchlistNotes').value.trim();
    
    if (!movieName || !whoSuggested || !priority) {
        alert('Lütfen film adını, kim önerdiğini ve öncelik seviyesini belirtiniz!');
        return;
    }
    
    const newWatchlistMovie = {
        id: Date.now(),
        name: movieName,
        whoSuggested: whoSuggested,
        priority: priority,
        genre: genre,
        platform: platform,
        notes: notes,
        dateAdded: new Date().toISOString(),
        dateAddedFormatted: formatDate(new Date())
    };
    
    // Firebase'e ekle
    if (typeof firebase !== 'undefined' && isConnected) {
        window.firebaseDatabase.ref(WATCHLIST_KEY).push(newWatchlistMovie)
            .then(() => {
                showNotification('Film izlenecek listeye eklendi! 📖', 'success');
                resetWatchlistForm();
            })
            .catch((error) => {
                console.error('Film eklenirken hata:', error);
                showNotification('Film eklenirken hata oluştu!', 'error');
            });
    } else {
        watchlist.unshift(newWatchlistMovie);
        saveWatchlistToLocal();
        displayWatchlist();
        updateStats();
        showNotification('Film çevrimdışı eklendi! 📱', 'success');
        resetWatchlistForm();
    }
}

// Formları sıfırla
function resetWatchedForm() {
    movieForm.reset();
    ratingInput.value = 5;
    ratingValue.textContent = '5';
}

function resetWatchlistForm() {
    watchlistForm.reset();
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

// İzlenen filmleri görüntüle
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
        <div class="movie-card ${movie.originallyFrom === 'watchlist' ? 'from-watchlist' : ''}">
            <button class="delete-btn" onclick="deleteMovie('${movie.firebaseKey || movie.id}', 'watched')" title="Filmi Sil">
                <i class="fas fa-trash"></i>
            </button>
            
            ${movie.originallyFrom === 'watchlist' ? `<div class="watchlist-badge"><i class="fas fa-bookmark"></i> İzlenecek listesinden</div>` : ''}
            
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
                ${movie.originallyFrom === 'watchlist' ? `
                    <span>
                        <i class="fas fa-lightbulb"></i>
                        ${movie.originalSuggester} tarafından önerilmişti
                    </span>
                    <span>
                        <i class="fas fa-fire"></i>
                        Öncelik: ${getPriorityIcon(movie.originalPriority)} ${movie.originalPriority}
                    </span>
                ` : ''}
            </div>
            
            <div class="movie-rating">
                <div class="rating-stars">
                    ${generateStars(movie.rating)}
                </div>
                <span class="rating-number">${movie.rating}/10</span>
            </div>
            
            ${movie.genre ? `<span class="genre-badge" style="margin-top: 10px;">${movie.genre}</span>` : ''}
            ${movie.platform ? `<span class="platform-badge">${movie.platform}</span>` : ''}
            
            ${movie.notes ? `<div class="movie-notes">"${movie.notes}"</div>` : ''}
        </div>
    `).join('');
}

// İzlenecek filmleri görüntüle
function displayWatchlist() {
    const filteredWatchlist = filterWatchlist();
    const sortedWatchlist = sortWatchlist(filteredWatchlist);
    
    if (sortedWatchlist.length === 0) {
        watchlistList.innerHTML = `
            <div class="no-movies">
                <i class="fas fa-bookmark"></i>
                <p>Henüz izlenecek film eklenmemiş</p>
                <p>İlk izlemek istediğiniz filmi ekleyerek başlayın!</p>
            </div>
        `;
        return;
    }
    
    watchlistList.innerHTML = sortedWatchlist.map(movie => `
        <div class="watchlist-card priority-${movie.priority.toLowerCase()}">
            <button class="delete-btn" onclick="deleteMovie('${movie.firebaseKey || movie.id}', 'watchlist')" title="Filmi Sil">
                <i class="fas fa-trash"></i>
            </button>
            
            <div class="priority-badge ${movie.priority.toLowerCase()}">${getPriorityIcon(movie.priority)}</div>
            
            <div class="movie-title">${movie.name}</div>
            
            <div class="watchlist-info">
                <span>
                    <i class="fas fa-user-plus"></i>
                    ${movie.whoSuggested} tarafından önerildi
                </span>
                <span>
                    <i class="fas fa-calendar"></i>
                    ${movie.dateAddedFormatted}
                </span>
            </div>
            
            ${movie.genre ? `<span class="genre-badge">${movie.genre}</span>` : ''}
            ${movie.platform ? `<span class="platform-badge">${movie.platform}</span>` : ''}
            
            <div style="margin-top: 10px;">
                <button class="watch-btn" onclick="markAsWatched('${movie.firebaseKey || movie.id}')">
                    <i class="fas fa-play"></i> İzledik!
                </button>
            </div>
            
            ${movie.notes ? `<div class="movie-notes">"${movie.notes}"</div>` : ''}
        </div>
    `).join('');
}

// Öncelik ikonunu al
function getPriorityIcon(priority) {
    switch(priority) {
        case 'Yüksek': return '🔥';
        case 'Orta': return '⭐';
        case 'Düşük': return '📌';
        default: return '📌';
    }
}

// İzlendi olarak işaretle - Modal aç
function markAsWatched(movieKey) {
    const movie = watchlist.find(m => (m.firebaseKey || m.id.toString()) === movieKey.toString());
    if (!movie) return;
    
    currentWatchlistMovie = movie;
    openWatchedModal(movie);
}

// Modal aç
function openWatchedModal(movie) {
    // Modal film bilgilerini doldur
    modalMovieInfo.innerHTML = `
        <div class="modal-movie-title">${movie.name}</div>
        <div class="modal-movie-details">
            <span><i class="fas fa-user-plus"></i> ${movie.whoSuggested} tarafından önerildi</span>
            <span><i class="fas fa-calendar-plus"></i> ${movie.dateAddedFormatted} tarihinde eklendi</span>
            <span><i class="fas fa-fire"></i> Öncelik: ${getPriorityIcon(movie.priority)} ${movie.priority}</span>
            ${movie.genre ? `<span><i class="fas fa-theater-masks"></i> Tür: ${movie.genre}</span>` : ''}
            ${movie.platform ? `<span><i class="fas fa-tv"></i> Platform: ${movie.platform}</span>` : ''}
        </div>
        ${movie.notes ? `<div style="margin-top: 10px; font-style: italic; color: #718096;">"${movie.notes}"</div>` : ''}
    `;
    
    // Form alanlarını temizle ve varsayılan değerler ver
    modalRating.value = 7;
    modalRatingValue.textContent = '7';
    modalStarsPreview.innerHTML = generateStars(7);
    
    // Önceki notları ekle (eski notlar + yeni alan)
    if (movie.notes) {
        modalNotes.value = `İzlendi! Önceki notlar: "${movie.notes}"\n\nFilm hakkında düşüncelerim: `;
    } else {
        modalNotes.value = '';
    }
    modalNotes.placeholder = 'Bu filmi nasıl buldunuz? Beğendiniz mi? Özel anılarınız var mı?';
    
    // Kim ekledi seçimini önerilen kişi yap
    modalWhoAdded.value = movie.whoSuggested;
    
    // Modal'ı göster
    watchedModal.classList.remove('hidden');
    
    // Body scroll'ü engelle
    document.body.style.overflow = 'hidden';
}

// Modal kapat
function closeWatchedModal() {
    watchedModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentWatchlistMovie = null;
    markWatchedForm.reset();
}

// Modal form submit
function submitWatchedMovie(e) {
    e.preventDefault();
    
    if (!currentWatchlistMovie) return;
    
    const rating = parseInt(modalRating.value);
    const notes = modalNotes.value.trim();
    const whoAdded = modalWhoAdded.value;
    
    if (!whoAdded) {
        alert('Lütfen kim ekledi seçimini yapınız!');
        return;
    }
    
    // İzlenen film objesi oluştur - TÜM detayları koru
    const watchedMovie = {
        id: Date.now(),
        name: currentWatchlistMovie.name,
        whoAdded: whoAdded,
        rating: rating,
        notes: notes,
        dateAdded: new Date().toISOString(),
        dateAddedFormatted: formatDate(new Date()),
        // İzlenecek listeden gelen ekstra bilgiler
        originallyFrom: 'watchlist',
        originalSuggester: currentWatchlistMovie.whoSuggested,
        originalPriority: currentWatchlistMovie.priority,
        genre: currentWatchlistMovie.genre || null,
        platform: currentWatchlistMovie.platform || null,
        originalAddDate: currentWatchlistMovie.dateAdded,
        originalNotes: currentWatchlistMovie.notes || null
    };
    
    const movieKey = currentWatchlistMovie.firebaseKey || currentWatchlistMovie.id;
    
    // Firebase'e ekle ve izlenecek listeden sil
    if (typeof firebase !== 'undefined' && isConnected) {
        // İzlenen filmlere ekle
        window.firebaseDatabase.ref(MOVIES_KEY).push(watchedMovie)
            .then(() => {
                // İzlenecek listeden sil
                if (movieKey.toString().startsWith('-')) {
                    return window.firebaseDatabase.ref(WATCHLIST_KEY).child(movieKey).remove();
                }
            })
            .then(() => {
                showNotification(`"${currentWatchlistMovie.name}" izlendi olarak kaydedildi! 🎬`, 'success');
                closeWatchedModal();
            })
            .catch(error => {
                console.error('Hata:', error);
                showNotification('İşlem sırasında hata oluştu!', 'error');
            });
    } else {
        // Yerel olarak ekle ve sil
        movies.unshift(watchedMovie);
        watchlist = watchlist.filter(w => (w.firebaseKey || w.id.toString()) !== movieKey.toString());
        saveMoviesToLocal();
        saveWatchlistToLocal();
        displayMovies();
        displayWatchlist();
        updateStats();
        showNotification(`"${currentWatchlistMovie.name}" izlendi olarak kaydedildi! 🎬`, 'success');
        closeWatchedModal();
    }
}

// Yıldız ikonları oluştur
function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 === 1;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// İzlenen filmleri filtrele
function filterMovies() {
    const filterValue = filterBy.value;
    if (filterValue === 'all') return movies;
    return movies.filter(movie => movie.whoAdded === filterValue);
}

// İzlenecek filmleri filtrele
function filterWatchlist() {
    const filterValue = watchlistFilterBy.value;
    if (filterValue === 'all') return watchlist;
    return watchlist.filter(movie => movie.whoSuggested === filterValue);
}

// İzlenen filmleri sırala
function sortMovies(movieList) {
    const sortValue = sortBy.value;
    
    return [...movieList].sort((a, b) => {
        switch (sortValue) {
            case 'date-desc': return new Date(b.dateAdded) - new Date(a.dateAdded);
            case 'date-asc': return new Date(a.dateAdded) - new Date(b.dateAdded);
            case 'rating-desc': return b.rating - a.rating;
            case 'rating-asc': return a.rating - b.rating;
            case 'name-asc': return a.name.localeCompare(b.name, 'tr');
            case 'name-desc': return b.name.localeCompare(a.name, 'tr');
            default: return 0;
        }
    });
}

// İzlenecek filmleri sırala
function sortWatchlist(watchlistArray) {
    const sortValue = watchlistSortBy.value;
    
    return [...watchlistArray].sort((a, b) => {
        switch (sortValue) {
            case 'priority-desc':
                const priorityOrder = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'priority-asc':
                const priorityOrderAsc = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 };
                return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
            case 'date-desc': return new Date(b.dateAdded) - new Date(a.dateAdded);
            case 'date-asc': return new Date(a.dateAdded) - new Date(b.dateAdded);
            case 'name-asc': return a.name.localeCompare(b.name, 'tr');
            case 'name-desc': return b.name.localeCompare(a.name, 'tr');
            case 'genre': return (a.genre || '').localeCompare(b.genre || '', 'tr');
            default: return 0;
        }
    });
}

// Film sil
function deleteMovie(movieKey, type) {
    if (confirm('Bu filmi silmek istediğinizden emin misiniz?')) {
        if (typeof firebase !== 'undefined' && isConnected && movieKey.startsWith('-')) {
            // Firebase'den sil
            const ref = type === 'watched' ? MOVIES_KEY : WATCHLIST_KEY;
            window.firebaseDatabase.ref(ref).child(movieKey).remove()
                .then(() => {
                    showNotification('Film silindi! 🗑️', 'info');
                })
                .catch((error) => {
                    console.error('Film silinirken hata:', error);
                    showNotification('Film silinirken hata oluştu!', 'error');
                });
        } else {
            // localStorage'dan sil
            if (type === 'watched') {
                movies = movies.filter(movie => (movie.firebaseKey || movie.id.toString()) !== movieKey.toString());
                saveMoviesToLocal();
                displayMovies();
            } else {
                watchlist = watchlist.filter(movie => (movie.firebaseKey || movie.id.toString()) !== movieKey.toString());
                saveWatchlistToLocal();
                displayWatchlist();
            }
            updateStats();
            showNotification('Film silindi! 🗑️', 'info');
        }
    }
}

// İstatistikleri güncelle
function updateStats() {
    // İzlenen filmler istatistikleri
    const totalMovies = movies.length;
    totalMoviesEl.textContent = totalMovies;
    
    if (totalMovies === 0) {
        avgRatingEl.textContent = '0.0';
        bestMovieEl.textContent = '-';
    } else {
        const totalRating = movies.reduce((sum, movie) => sum + movie.rating, 0);
        const avgRating = (totalRating / totalMovies).toFixed(1);
        avgRatingEl.textContent = avgRating;
        
        const bestMovie = movies.reduce((best, movie) => 
            movie.rating > best.rating ? movie : best
        );
        
        let bestMovieName = bestMovie.name;
        if (bestMovieName.length > 15) {
            bestMovieName = bestMovieName.substring(0, 15) + '...';
        }
        bestMovieEl.textContent = `${bestMovieName} (${bestMovie.rating}/10)`;
    }
    
    // İzlenecek filmler istatistikleri
    const totalWatchlist = watchlist.length;
    totalWatchlistEl.textContent = totalWatchlist;
    
    const highPriorityCount = watchlist.filter(movie => movie.priority === 'Yüksek').length;
    highPriorityEl.textContent = highPriorityCount;
    
    // En çok istenen tür
    if (totalWatchlist === 0) {
        mostWantedGenreEl.textContent = '-';
    } else {
        const genreCounts = {};
        watchlist.forEach(movie => {
            if (movie.genre) {
                genreCounts[movie.genre] = (genreCounts[movie.genre] || 0) + 1;
            }
        });
        
        const mostWantedGenre = Object.keys(genreCounts).reduce((a, b) => 
            genreCounts[a] > genreCounts[b] ? a : b, Object.keys(genreCounts)[0]
        );
        
        mostWantedGenreEl.textContent = mostWantedGenre || '-';
    }
}

// Bildirim göster
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let bgColor = '#48bb78';
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
    if (e.ctrlKey && e.key === 'Enter') {
        if (currentTab === 'watched') {
            const movieNameInput = document.getElementById('movieName');
            if (document.activeElement === movieNameInput || 
                document.activeElement === document.getElementById('notes')) {
                movieForm.dispatchEvent(new Event('submit'));
            }
        } else {
            const watchlistNameInput = document.getElementById('watchlistMovieName');
            if (document.activeElement === watchlistNameInput || 
                document.activeElement === document.getElementById('watchlistNotes')) {
                watchlistForm.dispatchEvent(new Event('submit'));
            }
        }
    }
    
    if (e.key === 'Escape') {
        if (currentTab === 'watched') {
            resetWatchedForm();
            document.getElementById('movieName').focus();
        } else {
            resetWatchlistForm();
            document.getElementById('watchlistMovieName').focus();
        }
    }
    
    // Tab değiştirme kısayolları
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        document.querySelector('.tab-btn').click();
    }
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        document.querySelectorAll('.tab-btn')[1].click();
    }
});

// Film adı inputuna odaklan
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.getElementById('movieName').focus();
    }, 100);
}); 

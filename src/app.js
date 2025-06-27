// CNG Queue Tracker App
class CNGTrackerApp {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.pumps = [];
        this.markers = {};
        this.selectedPump = null;
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.userPoints = parseInt(localStorage.getItem('userPoints') || '0');
        
        this.init();
    }

    async init() {
        this.loadSampleData();
        this.initMap();
        this.bindEvents();
        this.requestUserLocation();
        this.updateUI();
    }

    loadSampleData() {
        // Sample pump data for Delhi NCR
        this.pumps = [
            {
                id: 'pump_001',
                name: 'Indian Oil - Sector 18',
                location: { lat: 28.5672, lng: 77.3256 },
                address: 'Sector 18, Noida, UP',
                brand: 'Indian Oil',
                queueStatus: 'green',
                queueLength: 3,
                lastUpdated: new Date(Date.now() - 15 * 60000), // 15 mins ago
                operatingHours: '5:00 AM - 11:00 PM',
                phone: '+91 98765 43210',
                paymentModes: ['Cash', 'Card', 'UPI'],
                distance: 2.5
            },
            {
                id: 'pump_002',
                name: 'Bharat Petroleum - DLF Phase 2',
                location: { lat: 28.4912, lng: 77.0895 },
                address: 'DLF Phase 2, Gurgaon, Haryana',
                brand: 'Bharat Petroleum',
                queueStatus: 'yellow',
                queueLength: 12,
                lastUpdated: new Date(Date.now() - 30 * 60000), // 30 mins ago
                operatingHours: '24 Hours',
                phone: '+91 98765 43211',
                paymentModes: ['Cash', 'Card'],
                distance: 5.1
            },
            {
                id: 'pump_003',
                name: 'IGL Station - Connaught Place',
                location: { lat: 28.6315, lng: 77.2167 },
                address: 'Connaught Place, New Delhi',
                brand: 'IGL',
                queueStatus: 'red',
                queueLength: 25,
                lastUpdated: new Date(Date.now() - 5 * 60000), // 5 mins ago
                operatingHours: '6:00 AM - 10:00 PM',
                phone: '+91 98765 43212',
                paymentModes: ['Cash', 'Card', 'UPI', 'Paytm'],
                distance: 8.3
            },
            {
                id: 'pump_004',
                name: 'Indian Oil - Dwarka',
                location: { lat: 28.5921, lng: 77.0460 },
                address: 'Sector 6, Dwarka, New Delhi',
                brand: 'Indian Oil',
                queueStatus: 'green',
                queueLength: 0,
                lastUpdated: new Date(Date.now() - 45 * 60000), // 45 mins ago
                operatingHours: '5:00 AM - 11:00 PM',
                phone: '+91 98765 43213',
                paymentModes: ['Cash', 'UPI'],
                distance: 12.7
            },
            {
                id: 'pump_005',
                name: 'Shell - Greater Noida',
                location: { lat: 28.4744, lng: 77.5040 },
                address: 'Knowledge Park, Greater Noida',
                brand: 'Shell',
                queueStatus: 'gray',
                queueLength: null,
                lastUpdated: new Date(Date.now() - 120 * 60000), // 2 hours ago
                operatingHours: '24 Hours',
                phone: '+91 98765 43214',
                paymentModes: ['Cash', 'Card', 'UPI'],
                distance: 15.2
            }
        ];
    }

    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([28.6139, 77.2090], 12); // Delhi center

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add pump markers
        this.addPumpMarkers();
    }

    addPumpMarkers() {
        this.pumps.forEach(pump => {
            const icon = this.getMarkerIcon(pump.queueStatus);
            
            const marker = L.marker([pump.location.lat, pump.location.lng], { icon })
                .addTo(this.map)
                .bindPopup(this.createPopupContent(pump));
            
            marker.on('click', () => this.showPumpDetails(pump));
            
            this.markers[pump.id] = marker;
        });
    }

    getMarkerIcon(status) {
        const colors = {
            green: '#00C853',
            yellow: '#FFC107',
            red: '#F44336',
            gray: '#9E9E9E'
        };

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${colors[status]}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    createPopupContent(pump) {
        const queueText = this.getQueueText(pump.queueLength);
        const timeAgo = this.getTimeAgo(pump.lastUpdated);
        
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0;">${pump.name}</h3>
                <p style="margin: 5px 0;"><strong>${queueText}</strong></p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #666;">Updated ${timeAgo}</p>
                <button onclick="app.showPumpDetails('${pump.id}')" style="background: #00A652; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px;">View Details</button>
            </div>
        `;
    }

    getQueueText(queueLength) {
        if (queueLength === null) return 'No recent update';
        if (queueLength === 0) return '✅ No queue!';
        if (queueLength <= 5) return `🟢 ${queueLength} vehicles`;
        if (queueLength <= 15) return `🟡 ${queueLength} vehicles`;
        return `🔴 ${queueLength}+ vehicles`;
    }

    getTimeAgo(date) {
        const minutes = Math.floor((new Date() - date) / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${Math.floor(hours / 24)} day${hours > 24 ? 's' : ''} ago`;
    }

    bindEvents() {
        // Location button
        document.getElementById('locate-me').addEventListener('click', () => {
            this.centerOnUserLocation();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleNavigation(e.currentTarget.dataset.page);
            });
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Sort and filter
        document.getElementById('sort-by').addEventListener('change', () => this.updatePumpsList());
        document.getElementById('filter-status').addEventListener('change', () => this.updatePumpsList());

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Queue update buttons
        document.querySelectorAll('.queue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.queue-btn').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });

        // Submit update
        document.getElementById('submit-update').addEventListener('click', () => {
            this.submitQueueUpdate();
        });

        // Update queue button in details modal
        document.getElementById('update-queue-btn').addEventListener('click', () => {
            document.getElementById('details-modal').classList.remove('active');
            this.showUpdateModal(this.selectedPump);
        });

        // Navigate button
        document.getElementById('navigate-btn').addEventListener('click', () => {
            this.navigateToPump(this.selectedPump);
        });

        // Favorite button
        document.getElementById('favorite-btn').addEventListener('click', () => {
            this.toggleFavorite(this.selectedPump);
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    switchView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
        });

        if (view === 'list') {
            document.getElementById('list-view').classList.add('active');
            this.updatePumpsList();
        } else {
            document.getElementById('map-view').classList.add('active');
            setTimeout(() => this.map.invalidateSize(), 100);
        }
    }

    updatePumpsList() {
        const sortBy = document.getElementById('sort-by').value;
        const filterStatus = document.getElementById('filter-status').value;

        let filteredPumps = [...this.pumps];

        // Filter
        if (filterStatus !== 'all') {
            filteredPumps = filteredPumps.filter(pump => pump.queueStatus === filterStatus);
        }

        // Sort
        filteredPumps.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return a.distance - b.distance;
                case 'queue':
                    return (a.queueLength || 999) - (b.queueLength || 999);
                case 'updated':
                    return b.lastUpdated - a.lastUpdated;
                default:
                    return 0;
            }
        });

        // Render
        const container = document.getElementById('pumps-list');
        container.innerHTML = filteredPumps.map(pump => this.createPumpCard(pump)).join('');

        // Add click handlers
        container.querySelectorAll('.pump-card').forEach(card => {
            card.addEventListener('click', () => {
                const pump = this.pumps.find(p => p.id === card.dataset.pumpId);
                this.showPumpDetails(pump);
            });
        });
    }

    createPumpCard(pump) {
        const queueText = this.getQueueText(pump.queueLength);
        const timeAgo = this.getTimeAgo(pump.lastUpdated);
        const statusClass = pump.queueStatus;

        return `
            <div class="pump-card" data-pump-id="${pump.id}">
                <div class="pump-header">
                    <div>
                        <div class="pump-name">${pump.name}</div>
                        <div class="pump-distance">📍 ${pump.distance} km away</div>
                    </div>
                    <div class="queue-status">
                        <span class="status-badge ${statusClass}">${queueText}</span>
                    </div>
                </div>
                <div class="pump-info">
                    <span class="info-item">🕐 ${pump.operatingHours}</span>
                    <span class="info-item">⏱️ ${timeAgo}</span>
                </div>
            </div>
        `;
    }

    showPumpDetails(pump) {
        if (typeof pump === 'string') {
            pump = this.pumps.find(p => p.id === pump);
        }
        
        this.selectedPump = pump;
        
        // Update modal content
        document.getElementById('detail-pump-name').textContent = pump.name;
        document.getElementById('detail-queue').textContent = this.getQueueText(pump.queueLength);
        document.getElementById('detail-update-time').textContent = `Updated ${this.getTimeAgo(pump.lastUpdated)}`;
        document.getElementById('detail-address').textContent = pump.address;
        document.getElementById('detail-hours').textContent = pump.operatingHours;
        document.getElementById('detail-phone').textContent = pump.phone;
        document.getElementById('detail-payment').textContent = pump.paymentModes.join(', ');
        
        // Update status circle
        const statusCircle = document.getElementById('detail-status');
        statusCircle.className = `status-circle ${pump.queueStatus}`;
        
        // Update favorite button
        const favBtn = document.getElementById('favorite-btn');
        const isFavorite = this.favorites.includes(pump.id);
        favBtn.innerHTML = `
            <span class="icon">${isFavorite ? '⭐' : '☆'}</span>
            ${isFavorite ? 'Remove from' : 'Add to'} Favorites
        `;
        
        // Show recent updates
        this.showRecentUpdates(pump);
        
        // Show modal
        document.getElementById('details-modal').classList.add('active');
    }

    showRecentUpdates(pump) {
        // Simulate recent updates
        const updates = [
            { user: 'Rajesh K.', time: '15 min ago', queue: 3, note: 'Moving fast' },
            { user: 'Priya S.', time: '45 min ago', queue: 8, note: 'Moderate wait' },
            { user: 'Amit P.', time: '1 hour ago', queue: 15, note: 'Long queue, avoid if possible' }
        ];

        const container = document.getElementById('updates-list');
        container.innerHTML = updates.map(update => `
            <div class="update-item">
                <div class="update-avatar">👤</div>
                <div class="update-content">
                    <div class="update-user">${update.user}</div>
                    <div class="update-text">${update.queue} vehicles in queue</div>
                    ${update.note ? `<div class="update-text">"${update.note}"</div>` : ''}
                    <div class="update-timestamp">${update.time}</div>
                </div>
            </div>
        `).join('');
    }

    showUpdateModal(pump) {
        this.selectedPump = pump;
        document.getElementById('pump-name').textContent = pump.name;
        document.getElementById('update-modal').classList.add('active');
        
        // Reset form
        document.querySelectorAll('.queue-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('pump-closed').checked = false;
        document.getElementById('low-pressure').checked = false;
        document.getElementById('update-notes').value = '';
    }

    submitQueueUpdate() {
        const selectedBtn = document.querySelector('.queue-btn.selected');
        if (!selectedBtn) {
            this.showNotification('Please select queue length', 'warning');
            return;
        }

        const queueLength = parseInt(selectedBtn.dataset.queue);
        const notes = document.getElementById('update-notes').value;
        const isClosed = document.getElementById('pump-closed').checked;
        const hasLowPressure = document.getElementById('low-pressure').checked;

        // Update pump data
        const pump = this.pumps.find(p => p.id === this.selectedPump.id);
        pump.queueLength = queueLength;
        pump.lastUpdated = new Date();
        pump.queueStatus = queueLength <= 5 ? 'green' : queueLength <= 15 ? 'yellow' : 'red';

        // Update marker
        const marker = this.markers[pump.id];
        marker.setIcon(this.getMarkerIcon(pump.queueStatus));

        // Award points
        this.userPoints += 10;
        localStorage.setItem('userPoints', this.userPoints);

        // Close modal and show success
        document.getElementById('update-modal').classList.remove('active');
        this.showNotification('Queue updated successfully! +10 points', 'success');

        // Refresh views
        if (document.getElementById('list-view').classList.contains('active')) {
            this.updatePumpsList();
        }
    }

    navigateToPump(pump) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${pump.location.lat},${pump.location.lng}`;
        window.open(url, '_blank');
    }

    toggleFavorite(pump) {
        const index = this.favorites.indexOf(pump.id);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Removed from favorites', 'success');
        } else {
            if (this.favorites.length >= 3 && !this.isPremium()) {
                this.showNotification('Upgrade to Premium for unlimited favorites', 'warning');
                return;
            }
            this.favorites.push(pump.id);
            this.showNotification('Added to favorites', 'success');
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.showPumpDetails(pump); // Refresh the modal
    }

    isPremium() {
        return localStorage.getItem('isPremium') === 'true';
    }

    requestUserLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.addUserMarker();
                    this.updateDistances();
                },
                error => {
                    console.log('Location access denied');
                }
            );
        }
    }

    addUserMarker() {
        if (this.userLocation) {
            L.marker([this.userLocation.lat, this.userLocation.lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.map).bindPopup('You are here');
        }
    }

    centerOnUserLocation() {
        if (this.userLocation) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], 14);
        } else {
            this.showNotification('Location access required', 'warning');
            this.requestUserLocation();
        }
    }

    updateDistances() {
        if (!this.userLocation) return;

        this.pumps.forEach(pump => {
            pump.distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                pump.location.lat,
                pump.location.lng
            );
        });

        if (document.getElementById('list-view').classList.contains('active')) {
            this.updatePumpsList();
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c * 10) / 10;
    }

    handleSearch(query) {
        query = query.toLowerCase();
        
        if (query.length < 2) {
            this.updatePumpsList();
            return;
        }

        const filtered = this.pumps.filter(pump => 
            pump.name.toLowerCase().includes(query) ||
            pump.address.toLowerCase().includes(query) ||
            pump.brand.toLowerCase().includes(query)
        );

        // Update list view
        const container = document.getElementById('pumps-list');
        container.innerHTML = filtered.map(pump => this.createPumpCard(pump)).join('');

        // Add click handlers
        container.querySelectorAll('.pump-card').forEach(card => {
            card.addEventListener('click', () => {
                const pump = this.pumps.find(p => p.id === card.dataset.pumpId);
                this.showPumpDetails(pump);
            });
        });
    }

    handleNavigation(page) {
        // Update active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        switch(page) {
            case 'home':
                // Already on home
                break;
            case 'favorites':
                this.showFavorites();
                break;
            case 'update':
                this.showNearestPumpForUpdate();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'profile':
                this.showProfile();
                break;
        }
    }

    showFavorites() {
        const favoritePumps = this.pumps.filter(pump => this.favorites.includes(pump.id));
        
        if (favoritePumps.length === 0) {
            this.showNotification('No favorites yet. Add some pumps!', 'info');
            return;
        }

        // Switch to list view and show only favorites
        this.switchView('list');
        
        const container = document.getElementById('pumps-list');
        container.innerHTML = `
            <h3 style="padding: 1rem; margin: 0;">Your Favorite Pumps</h3>
            ${favoritePumps.map(pump => this.createPumpCard(pump)).join('')}
        `;

        // Add click handlers
        container.querySelectorAll('.pump-card').forEach(card => {
            card.addEventListener('click', () => {
                const pump = this.pumps.find(p => p.id === card.dataset.pumpId);
                this.showPumpDetails(pump);
            });
        });
    }

    showNearestPumpForUpdate() {
        const nearestPump = this.pumps.sort((a, b) => a.distance - b.distance)[0];
        this.showUpdateModal(nearestPump);
    }

    showHistory() {
        this.showNotification('History feature coming soon!', 'info');
    }

    showProfile() {
        this.showNotification(`You have ${this.userPoints} points!`, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateUI() {
        // Update any UI elements that need initialization
        this.updatePumpsList();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CNGTrackerApp();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
    });
}
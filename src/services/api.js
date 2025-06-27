// API Service for CNG Tracker Frontend

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.socket = null;
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Set auth token
    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear auth token
    clearAuthToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Auth endpoints
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.data.token) {
            this.setAuthToken(response.data.token);
        }
        
        return response;
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.data.token) {
            this.setAuthToken(response.data.token);
        }
        
        return response;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.clearAuthToken();
    }

    // Pump endpoints
    async getPumps(lat, lng, radius = 20) {
        const params = new URLSearchParams();
        if (lat && lng) {
            params.append('lat', lat);
            params.append('lng', lng);
            params.append('radius', radius);
        }
        
        return await this.request(`/pumps?${params}`);
    }

    async getPumpDetails(pumpId) {
        return await this.request(`/pumps/${pumpId}`);
    }

    // Queue endpoints
    async updateQueue(updateData) {
        return await this.request('/queues/update', {
            method: 'POST',
            body: JSON.stringify(updateData)
        });
    }

    async getQueueHistory(pumpId, limit = 20, offset = 0) {
        return await this.request(`/queues/history/${pumpId}?limit=${limit}&offset=${offset}`);
    }

    async getQueueAnalytics(pumpId) {
        return await this.request(`/queues/analytics/${pumpId}`);
    }

    // User endpoints
    async getCurrentUser() {
        return await this.request('/users/me');
    }

    async getUserFavorites() {
        return await this.request('/users/favorites');
    }

    async addFavorite(pumpId) {
        return await this.request(`/users/favorites/${pumpId}`, {
            method: 'POST'
        });
    }

    async removeFavorite(pumpId) {
        return await this.request(`/users/favorites/${pumpId}`, {
            method: 'DELETE'
        });
    }

    async getUserHistory(limit = 20, offset = 0) {
        return await this.request(`/users/history?limit=${limit}&offset=${offset}`);
    }

    // Stats endpoints
    async getOverviewStats() {
        return await this.request('/stats/overview');
    }

    async getLeaderboard(limit = 10) {
        return await this.request(`/stats/leaderboard?limit=${limit}`);
    }

    async getBusiestPumps() {
        return await this.request('/stats/busiest-pumps');
    }

    // WebSocket connection
    connectWebSocket() {
        if (this.socket) return;

        // Import Socket.IO client
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
        document.head.appendChild(script);

        script.onload = () => {
            this.socket = io(API_BASE_URL.replace('/api', ''), {
                auth: {
                    token: this.token
                }
            });

            this.socket.on('connect', () => {
                console.log('WebSocket connected');
            });

            this.socket.on('queue-updated', (data) => {
                // Dispatch custom event for the app to handle
                window.dispatchEvent(new CustomEvent('queue-updated', { detail: data }));
            });

            this.socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
            });
        };
    }

    disconnectWebSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Join location-based room
    joinLocationRoom(lat, lng) {
        if (this.socket) {
            this.socket.emit('join-location', { lat, lng });
        }
    }

    // Emit queue update via WebSocket
    emitQueueUpdate(data) {
        if (this.socket) {
            this.socket.emit('queue-update', data);
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
} else {
    window.apiService = apiService;
}
// CNGFlow - Smart CNG Station Finder
class CNGFlowApp {
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
        this.initTheme();
        this.initMap();
        this.bindEvents();
        this.updateUI();
        
        // First get user location, then load stations
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.addUserMarker();
                    
                    // Try to load real stations after getting location
                    await this.loadRealCNGStations();
                    
                    this.centerOnUserLocation();
                    this.showNotification('Location found!', 'success');
                },
                async (error) => {
                    console.log('Location error:', error);
                    this.showNotification('Using default location', 'info');
                    
                    // Load sample data if location fails
                    this.loadSampleData();
                    this.addPumpMarkers();
                }
            );
        } else {
            this.loadSampleData();
            this.addPumpMarkers();
        }
    }

    initTheme() {
        // Check for saved theme preference or default to 'light' mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // Check system preference
        if (!localStorage.getItem('theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            this.updateThemeIcon(prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateThemeIcon(savedTheme);
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                this.updateThemeIcon(theme);
            }
        });
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    async loadRealCNGStations() {
        // Method 1: Try OpenStreetMap Overpass API (FREE - No API key needed)
        if (this.userLocation) {
            try {
                this.showNotification('Searching for real CNG stations...', 'info');
                
                // Calculate bounding box around user location (approximately 20km radius)
                const latOffset = 0.18; // ~20km
                const lngOffset = 0.18;
                const bbox = [
                    this.userLocation.lat - latOffset,
                    this.userLocation.lng - lngOffset,
                    this.userLocation.lat + latOffset,
                    this.userLocation.lng + lngOffset
                ].join(',');
                
                // Overpass API query for CNG stations
                const overpassQuery = `
                    [out:json][timeout:25];
                    (
                        node["amenity"="fuel"]["fuel:cng"="yes"](${bbox});
                        way["amenity"="fuel"]["fuel:cng"="yes"](${bbox});
                        relation["amenity"="fuel"]["fuel:cng"="yes"](${bbox});
                    );
                    out body;
                    >;
                    out skel qt;
                `;
                
                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: `data=${encodeURIComponent(overpassQuery)}`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                
                const data = await response.json();
                
                if (data.elements && data.elements.length > 0) {
                    this.pumps = data.elements
                        .filter(el => el.lat && el.lon) // Only elements with coordinates
                        .map((el, index) => ({
                            id: `osm_${el.id}`,
                            name: el.tags?.name || el.tags?.operator || `CNG Station ${index + 1}`,
                            location: {
                                lat: el.lat,
                                lng: el.lon
                            },
                            address: this.formatAddress(el.tags),
                            brand: el.tags?.brand || el.tags?.operator || 'Independent',
                            queueStatus: 'gray', // Unknown initially
                            queueLength: null,
                            lastUpdated: null,
                            operatingHours: el.tags?.opening_hours || '24/7',
                            phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                            website: el.tags?.website || null,
                            distance: null, // Will be calculated
                            isReal: true,
                            osmTags: el.tags // Store original tags for reference
                        }));
                    
                    this.updateDistances();
                    this.addPumpMarkers();
                    this.showNotification(`Found ${this.pumps.length} real CNG stations!`, 'success');
                    return;
                } else {
                    this.showNotification('No CNG stations found in your area', 'warning');
                }
            } catch (error) {
                console.error('Error loading from OpenStreetMap:', error);
                
                // Method 2: Try loading from a static dataset of known CNG stations
                await this.loadKnownCNGStations();
            }
        } else {
            // No location available, load known stations for Delhi NCR
            await this.loadKnownCNGStations();
        }
    }
    
    formatAddress(tags) {
        const parts = [];
        if (tags?.['addr:housenumber']) parts.push(tags['addr:housenumber']);
        if (tags?.['addr:street']) parts.push(tags['addr:street']);
        if (tags?.['addr:city']) parts.push(tags['addr:city']);
        if (tags?.['addr:postcode']) parts.push(tags['addr:postcode']);
        
        return parts.length > 0 ? parts.join(', ') : (tags?.['addr:full'] || 'Address not available');
    }
    
    async loadKnownCNGStations() {
        // Load from a curated list of known CNG stations in major cities
        try {
            // This could be loaded from a JSON file or API
            const knownStations = [
                // Delhi NCR real CNG stations (approximate coordinates)
                {
                    id: 'real_001',
                    name: 'Indian Oil CNG Station - Noida Sector 18',
                    location: { lat: 28.5703, lng: 77.3219 },
                    address: 'Sector 18, Noida, Uttar Pradesh',
                    brand: 'Indian Oil',
                    operatingHours: '5:00 AM - 11:00 PM'
                },
                {
                    id: 'real_002',
                    name: 'IGL CNG Station - Connaught Place',
                    location: { lat: 28.6328, lng: 77.2197 },
                    address: 'Connaught Place, New Delhi',
                    brand: 'IGL',
                    operatingHours: '24 Hours'
                },
                {
                    id: 'real_003',
                    name: 'Bharat Gas CNG - Gurgaon Sector 29',
                    location: { lat: 28.4601, lng: 77.0725 },
                    address: 'Sector 29, Gurgaon, Haryana',
                    brand: 'Bharat Gas',
                    operatingHours: '6:00 AM - 10:00 PM'
                }
                // Add more real stations as needed
            ];
            
            this.pumps = knownStations.map(station => ({
                ...station,
                queueStatus: 'gray',
                queueLength: null,
                lastUpdated: null,
                distance: null,
                isReal: true
            }));
            
            // If we have very few real stations, add some sample data
            if (this.pumps.length < 5) {
                this.showNotification('Limited real data, adding sample stations', 'info');
                this.loadSampleData(); // This will append to existing pumps
            } else {
                this.updateDistances();
                this.addPumpMarkers();
                this.showNotification(`Loaded ${this.pumps.length} known CNG stations`, 'success');
            }
        } catch (error) {
            console.error('Error loading known stations:', error);
            this.loadSampleData();
        }
    }
    
    extractBrand(name) {
        const brands = ['Indian Oil', 'Bharat Petroleum', 'HP', 'Shell', 'IGL', 'Mahanagar Gas'];
        const nameLower = name.toLowerCase();
        
        for (const brand of brands) {
            if (nameLower.includes(brand.toLowerCase())) {
                return brand;
            }
        }
        return 'Independent';
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
                distance: 2.5,
                trafficDensity: 'low', // Based on time patterns
                activeUsers: 2, // Number of users at location
                historicalData: {
                    avgQueueByHour: [0,0,0,0,2,5,8,12,15,10,8,12,18,15,12,10,8,15,20,18,12,8,5,2]
                }
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
                distance: 5.1,
                trafficDensity: 'medium',
                activeUsers: 4,
                historicalData: {
                    avgQueueByHour: [2,1,1,1,3,8,15,20,25,18,15,18,22,20,18,15,12,18,25,22,15,10,5,3]
                }
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
                distance: 15.2,
                trafficDensity: 'low',
                activeUsers: 1,
                historicalData: {
                    avgQueueByHour: [1,0,0,0,2,5,10,15,18,12,10,14,20,18,15,12,10,15,18,15,10,6,3,2]
                }
            },
            // More stations across Delhi NCR
            {
                id: 'pump_006',
                name: 'Indian Oil - Rohini Sector 3',
                location: { lat: 28.7495, lng: 77.1045 },
                address: 'Sector 3, Rohini, Delhi',
                brand: 'Indian Oil',
                queueStatus: 'yellow',
                queueLength: 10,
                lastUpdated: new Date(Date.now() - 25 * 60000),
                operatingHours: '5:00 AM - 11:00 PM',
                phone: '+91 98765 43215',
                paymentModes: ['Cash', 'Card', 'UPI'],
                distance: 8.5,
                trafficDensity: 'medium',
                activeUsers: 3,
                historicalData: {
                    avgQueueByHour: [1,1,0,1,3,7,12,18,20,15,12,15,22,18,15,12,10,18,22,20,15,8,4,2]
                }
            },
            {
                id: 'pump_007',
                name: 'Bharat Petroleum - Janakpuri',
                location: { lat: 28.6219, lng: 77.0878 },
                address: 'District Centre, Janakpuri, Delhi',
                brand: 'Bharat Petroleum',
                queueStatus: 'green',
                queueLength: 2,
                lastUpdated: new Date(Date.now() - 10 * 60000),
                operatingHours: '24 Hours',
                phone: '+91 98765 43216',
                paymentModes: ['Cash', 'Card'],
                distance: 7.2,
                trafficDensity: 'low',
                activeUsers: 2,
                historicalData: {
                    avgQueueByHour: [2,1,1,1,4,8,14,20,22,16,12,14,20,18,14,11,9,16,20,18,14,10,6,3]
                }
            },
            {
                id: 'pump_008',
                name: 'IGL Station - Vasant Kunj',
                location: { lat: 28.5245, lng: 77.1492 },
                address: 'Vasant Kunj, New Delhi',
                brand: 'IGL',
                queueStatus: 'red',
                queueLength: 22,
                lastUpdated: new Date(Date.now() - 8 * 60000),
                operatingHours: '6:00 AM - 10:00 PM',
                phone: '+91 98765 43217',
                paymentModes: ['Cash', 'Card', 'UPI'],
                distance: 10.3,
                trafficDensity: 'high',
                activeUsers: 7,
                historicalData: {
                    avgQueueByHour: [2,1,1,2,5,10,16,22,25,18,14,16,24,20,16,13,11,20,25,22,16,12,8,4]
                }
            },
            {
                id: 'pump_009',
                name: 'Indian Oil - Mayur Vihar',
                location: { lat: 28.6083, lng: 77.2908 },
                address: 'Mayur Vihar Phase 1, Delhi',
                brand: 'Indian Oil',
                queueStatus: 'yellow',
                queueLength: 13,
                lastUpdated: new Date(Date.now() - 40 * 60000),
                operatingHours: '5:00 AM - 11:00 PM',
                phone: '+91 98765 43218',
                paymentModes: ['Cash', 'Card', 'UPI'],
                distance: 4.8,
                trafficDensity: 'medium',
                activeUsers: 4,
                historicalData: {
                    avgQueueByHour: [1,1,0,1,3,8,15,20,22,16,12,14,20,17,14,11,9,17,22,20,15,10,5,2]
                }
            },
            {
                id: 'pump_010',
                name: 'Shell - Saket',
                location: { lat: 28.5244, lng: 77.2066 },
                address: 'Saket District Centre, Delhi',
                brand: 'Shell',
                queueStatus: 'green',
                queueLength: 4,
                lastUpdated: new Date(Date.now() - 12 * 60000),
                operatingHours: '24 Hours',
                phone: '+91 98765 43219',
                paymentModes: ['Cash', 'Card', 'UPI', 'Paytm'],
                distance: 9.1,
                trafficDensity: 'low',
                activeUsers: 2,
                historicalData: {
                    avgQueueByHour: [2,1,1,1,4,9,15,20,23,17,13,15,21,18,15,12,10,18,23,20,15,11,6,3]
                }
            },
            {
                id: 'pump_011',
                name: 'Bharat Petroleum - Faridabad',
                location: { lat: 28.4089, lng: 77.3178 },
                address: 'Sector 15, Faridabad, Haryana',
                brand: 'Bharat Petroleum',
                queueStatus: 'yellow',
                queueLength: 14,
                lastUpdated: new Date(Date.now() - 35 * 60000),
                operatingHours: '5:00 AM - 11:00 PM',
                phone: '+91 98765 43220',
                paymentModes: ['Cash', 'Card'],
                distance: 18.5,
                trafficDensity: 'medium',
                activeUsers: 5,
                historicalData: {
                    avgQueueByHour: [1,0,0,1,3,7,14,19,21,15,11,13,19,16,13,10,8,16,21,19,14,9,5,2]
                }
            },
            {
                id: 'pump_012',
                name: 'IGL Station - Karol Bagh',
                location: { lat: 28.6514, lng: 77.1907 },
                address: 'Karol Bagh, Central Delhi',
                brand: 'IGL',
                queueStatus: 'red',
                queueLength: 28,
                lastUpdated: new Date(Date.now() - 20 * 60000),
                operatingHours: '6:00 AM - 10:00 PM',
                phone: '+91 98765 43221',
                paymentModes: ['Cash', 'UPI'],
                distance: 6.4,
                trafficDensity: 'high',
                activeUsers: 8,
                historicalData: {
                    avgQueueByHour: [3,2,1,2,6,12,18,25,28,20,16,18,26,22,18,15,13,22,28,25,18,14,10,5]
                }
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
            const icon = this.getMarkerIcon(pump.queueStatus, pump);
            
            const marker = L.marker([pump.location.lat, pump.location.lng], { icon })
                .addTo(this.map)
                .bindPopup(this.createPopupContent(pump));
            
            marker.on('popupopen', () => {
                // Add click handlers after popup opens
                const detailsBtn = document.querySelector(`[data-pump-details="${pump.id}"]`);
                if (detailsBtn) {
                    detailsBtn.addEventListener('click', () => {
                        this.showPumpDetails(pump);
                    });
                }
                
                const navigateBtn = document.querySelector(`[data-pump-navigate="${pump.id}"]`);
                if (navigateBtn) {
                    navigateBtn.addEventListener('click', () => {
                        this.navigateToPump(pump);
                    });
                }
            });
            
            this.markers[pump.id] = marker;
        });
    }

    getMarkerIcon(status, pump) {
        // Calculate smart status
        const smartData = this.calculateSmartQueueStatus(pump);
        const useSmartStatus = smartData.confidence > 70 || smartData.isPrediction;
        const finalStatus = useSmartStatus ? smartData.status : status;
        
        const colors = {
            green: '#10B981',
            yellow: '#F59E0B',
            red: '#EF4444',
            gray: '#9CA3AF'
        };

        // Use predicted queue if confidence is high or no recent data
        const queueText = smartData.isPrediction ? 
            `~${smartData.predictedQueue}` : 
            (pump.queueLength !== null ? pump.queueLength : '?');
        
        const distanceText = pump.distance ? `${pump.distance}km` : '';
        
        // Traffic density indicator
        const trafficColors = {
            low: '#4CAF50',
            medium: '#FFC107',
            high: '#F44336'
        };

        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="map-pin-marker ${finalStatus}">
                    ${smartData.isPrediction ? '<div class="prediction-indicator" title="Predicted based on patterns">🤖</div>' : ''}
                    <div class="pin-body" style="background-color: ${colors[finalStatus]};">
                        <div class="pin-content">
                            <span class="queue-number">${queueText}</span>
                            <span class="pin-icon">⛽</span>
                        </div>
                    </div>
                    <div class="pin-tip" style="border-top-color: ${colors[finalStatus]};"></div>
                    <div class="marker-info">
                        ${distanceText ? `<div class="distance-label">${distanceText}</div>` : ''}
                        <div class="traffic-indicator" style="background-color: ${trafficColors[smartData.trafficDensity]};" title="Traffic: ${smartData.trafficDensity}"></div>
                    </div>
                </div>
            `,
            iconSize: [50, 65],
            iconAnchor: [25, 65]
        });
    }

    createPopupContent(pump) {
        console.log('Creating popup for pump:', pump.name, 'Queue:', pump.queueLength, 'Traffic:', pump.trafficDensity);
        const smartData = this.calculateSmartQueueStatus(pump);
        const queueText = this.getQueueText(pump.queueLength);
        const timeAgo = this.getTimeAgo(pump.lastUpdated);
        
        return `
            <div style="min-width: 250px; font-family: Inter, -apple-system, sans-serif;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${pump.name}</h3>
                ${smartData.isPrediction ? 
                    `<div style="margin: 8px 0; padding: 8px; background: #F3F4F6; border-radius: 6px; border-left: 3px solid #10B981;">
                        <p style="margin: 0; font-size: 14px; color: #111827;"><strong>AI Prediction: ~${smartData.predictedQueue} vehicles</strong></p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">Based on typical patterns</p>
                     </div>` :
                    `<p style="margin: 6px 0; font-size: 14px; color: #111827;"><strong>${queueText}</strong></p>`
                }
                <p style="margin: 6px 0; font-size: 13px; color: #6B7280;">Updated ${timeAgo}</p>
                <div style="display: flex; gap: 8px; margin: 10px 0;">
                    <span style="font-size: 12px; padding: 4px 8px; background: ${smartData.trafficDensity === 'high' ? '#FEE2E2' : smartData.trafficDensity === 'medium' ? '#FEF3C7' : '#D1FAE5'}; color: ${smartData.trafficDensity === 'high' ? '#EF4444' : smartData.trafficDensity === 'medium' ? '#F59E0B' : '#10B981'}; border-radius: 4px; font-weight: 600; text-transform: uppercase;">Traffic: ${smartData.trafficDensity}</span>
                    <span style="font-size: 12px; padding: 4px 8px; background: #E5E7EB; color: #4B5563; border-radius: 4px;">${smartData.confidence}% confidence</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button data-pump-details="${pump.id}" style="background: #10B981; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; flex: 1; font-size: 14px; font-weight: 500; font-family: inherit;">View Details</button>
                    <button data-pump-navigate="${pump.id}" style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; flex: 1; font-size: 14px; font-weight: 500; font-family: inherit;">Navigate</button>
                </div>
            </div>
        `;
    }

    getQueueText(queueLength) {
        if (queueLength === null) return 'No data';
        if (queueLength === 0) return 'Empty';
        if (queueLength <= 5) return `${queueLength} in queue`;
        if (queueLength <= 15) return `${queueLength} in queue`;
        return `${queueLength}+ in queue`;
    }

    // Calculate smart queue status using multiple factors
    calculateSmartQueueStatus(pump) {
        const now = new Date();
        const currentHour = now.getHours();
        const dayOfWeek = now.getDay();
        const timeSinceUpdate = (now - pump.lastUpdated) / 60000; // minutes

        // Initialize confidence score
        let confidence = 100;
        let predictedQueue = pump.queueLength || 0;

        // 1. Time-based prediction using historical data
        if (pump.historicalData && pump.historicalData.avgQueueByHour) {
            const historicalAvg = pump.historicalData.avgQueueByHour[currentHour];
            
            // If no recent update, use historical average
            if (timeSinceUpdate > 30) {
                predictedQueue = historicalAvg;
                confidence = 60; // Lower confidence for predictions
            } else {
                // Blend recent data with historical pattern
                const weight = Math.min(timeSinceUpdate / 60, 0.5); // Max 50% weight to historical
                predictedQueue = Math.round(pump.queueLength * (1 - weight) + historicalAvg * weight);
                confidence = Math.max(50, 100 - timeSinceUpdate);
            }
        }

        // 2. Peak hour adjustments
        const isPeakHour = (currentHour >= 8 && currentHour <= 10) || 
                          (currentHour >= 17 && currentHour <= 20);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        if (isPeakHour && !isWeekend && timeSinceUpdate > 20) {
            predictedQueue = Math.round(predictedQueue * 1.3); // 30% increase during peak
        }

        // 3. Determine status based on queue length
        let smartStatus;
        if (predictedQueue <= 5) {
            smartStatus = 'green';
        } else if (predictedQueue <= 15) {
            smartStatus = 'yellow';
        } else {
            smartStatus = 'red';
        }

        // 4. Calculate traffic density based on actual queue length
        const currentQueue = pump.queueLength !== null ? pump.queueLength : predictedQueue;
        const trafficIndicator = this.calculateTrafficDensity(currentQueue);
        console.log(`Pump ${pump.name}: Queue=${currentQueue}, Traffic=${trafficIndicator}`);

        // 5. Update pump's traffic density and return all data
        pump.trafficDensity = trafficIndicator;
        pump.predictedQueue = predictedQueue;
        pump.predictionConfidence = confidence;

        return {
            status: smartStatus,
            predictedQueue: predictedQueue,
            confidence: confidence,
            trafficDensity: trafficIndicator,  // Use calculated traffic based on current queue
            isPrediction: timeSinceUpdate > 30
        };
    }

    getTimeAgo(date) {
        const minutes = Math.floor((new Date() - date) / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${Math.floor(hours / 24)} day${hours > 24 ? 's' : ''} ago`;
    }
    
    // Helper function to calculate traffic density based on queue length
    calculateTrafficDensity(queueLength) {
        console.log('Calculating traffic density for queue length:', queueLength);
        if (queueLength >= 20) {
            return 'high';
        } else if (queueLength >= 10) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
            
            // Add animation
            document.body.style.transition = 'background-color 0.3s ease';
        });

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

        // Search on Enter key
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
                this.switchView('list');
            }
        });

        // Search button
        document.getElementById('search-btn').addEventListener('click', () => {
            const searchValue = document.getElementById('search-input').value;
            this.handleSearch(searchValue);
            // Switch to list view to show results
            this.switchView('list');
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

        // Professional interactions only

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
                        <div class="pump-distance">${pump.distance} km away</div>
                    </div>
                    <div class="queue-status">
                        <span class="status-badge ${statusClass}">${queueText}</span>
                    </div>
                </div>
                <div class="pump-info">
                    <span class="info-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${pump.operatingHours}
                    </span>
                    <span class="info-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v10l4 2"></path>
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        ${timeAgo}
                    </span>
                </div>
            </div>
        `;
    }

    showPumpDetails(pump) {
        if (typeof pump === 'string') {
            pump = this.pumps.find(p => p.id === pump);
            if (!pump) {
                console.error('Pump not found with ID:', pump);
                return;
            }
        }
        
        if (!pump) {
            console.error('No pump provided to showPumpDetails');
            return;
        }
        
        this.selectedPump = pump;
        const smartData = this.calculateSmartQueueStatus(pump);
        
        // Update modal content
        document.getElementById('detail-pump-name').textContent = pump.name;
        
        // Show smart prediction or actual data
        const queueElement = document.getElementById('detail-queue');
        if (smartData.isPrediction) {
            queueElement.innerHTML = `AI Predicted: ~${smartData.predictedQueue} vehicles<br>
                <small style="color: var(--text-secondary);">Based on ${new Date().toLocaleTimeString('en-US', {hour: 'numeric', hour12: true})} patterns</small>`;
        } else {
            queueElement.textContent = this.getQueueText(pump.queueLength);
        }
        
        document.getElementById('detail-update-time').innerHTML = `Updated ${this.getTimeAgo(pump.lastUpdated)}<br>
            <small>Traffic: <strong>${smartData.trafficDensity}</strong> | Confidence: ${smartData.confidence}%</small>`;
        
        document.getElementById('detail-address').textContent = pump.address || 'Address not available';
        document.getElementById('detail-hours').textContent = pump.operatingHours || '24/7';
        document.getElementById('detail-phone').textContent = pump.phone || 'Not available';
        document.getElementById('detail-payment').textContent = pump.paymentModes ? pump.paymentModes.join(', ') : 'Cash';
        
        // Update status circle based on smart data
        const statusCircle = document.getElementById('detail-status');
        statusCircle.className = `status-circle ${smartData.status}`;
        
        // Update favorite button
        const favBtn = document.getElementById('favorite-btn');
        const isFavorite = this.favorites.includes(pump.id);
        favBtn.innerHTML = `
            <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${isFavorite ? 'Saved' : 'Save'}
        `;
        
        // Show recent updates
        this.showRecentUpdates(pump);
        
        // Show modal
        document.getElementById('details-modal').classList.add('active');
    }

    showRecentUpdates() {
        // Simplified recent updates
        const container = document.getElementById('updates-list');
        container.innerHTML = `
            <div class="update-item">
                <div class="update-content">
                    <p style="text-align: center; color: #666;">Updates from users at this location will appear here</p>
                </div>
            </div>
        `;
    }

    showUpdateModal(pumpToUpdate) {
        this.selectedPump = pumpToUpdate;
        document.getElementById('pump-name').textContent = pumpToUpdate.name;
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
        // Additional fields can be used for future features
        // const notes = document.getElementById('update-notes').value;
        // const isClosed = document.getElementById('pump-closed').checked;
        // const hasLowPressure = document.getElementById('low-pressure').checked;

        // Update pump data
        const pump = this.pumps.find(p => p.id === this.selectedPump.id);
        pump.queueLength = queueLength;
        pump.lastUpdated = new Date();
        pump.queueStatus = queueLength <= 5 ? 'green' : queueLength <= 15 ? 'yellow' : 'red';
        
        // Update traffic density based on new queue length
        pump.trafficDensity = this.calculateTrafficDensity(queueLength);

        // Update marker
        const marker = this.markers[pump.id];
        marker.setIcon(this.getMarkerIcon(pump.queueStatus, pump));
        
        // Update popup content if it's open
        if (marker.isPopupOpen()) {
            marker.setPopupContent(this.createPopupContent(pump));
        }

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

    toggleFavorite(pumpToToggle) {
        const index = this.favorites.indexOf(pumpToToggle.id);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Removed from favorites', 'success');
        } else {
            if (this.favorites.length >= 3 && !this.isPremium()) {
                this.showNotification('Upgrade to Premium for unlimited favorites', 'warning');
                return;
            }
            this.favorites.push(pumpToToggle.id);
            this.showNotification('Added to favorites', 'success');
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.showPumpDetails(pumpToToggle); // Refresh the modal
    }

    isPremium() {
        return localStorage.getItem('isPremium') === 'true';
    }

    requestUserLocation() {
        if ('geolocation' in navigator) {
            // Show loading notification
            this.showNotification('Getting your location...', 'info');
            
            // Get initial position
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.addUserMarker();
                    this.updateDistances();
                    this.centerOnUserLocation();
                    this.showNotification('Location found!', 'success');
                },
                error => {
                    console.log('Location access denied:', error);
                    this.showNotification('Location access denied. Using default location.', 'warning');
                    // Use a default location (Connaught Place, Delhi)
                    this.userLocation = {
                        lat: 28.6315,
                        lng: 77.2167
                    };
                    this.addUserMarker();
                    this.updateDistances();
                }
            );

            // Watch position for real-time updates
            this.watchId = navigator.geolocation.watchPosition(
                position => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.updateUserMarker();
                    this.updateDistances();
                },
                error => {
                    console.log('Location update error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            this.showNotification('Geolocation not supported', 'error');
        }
    }

    addUserMarker() {
        if (this.userLocation) {
            this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: `<div class="user-location-marker">
                        <div class="pulse"></div>
                        <div class="user-dot"></div>
                        <div class="user-label">You</div>
                    </div>`,
                    iconSize: [40, 50],
                    iconAnchor: [20, 25]
                })
            }).addTo(this.map).bindPopup('You are here');
        }
    }

    updateUserMarker() {
        if (this.userMarker && this.userLocation) {
            this.userMarker.setLatLng([this.userLocation.lat, this.userLocation.lng]);
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
            
            // Update marker with new distance
            if (this.markers[pump.id]) {
                const newIcon = this.getMarkerIcon(pump.queueStatus, pump);
                this.markers[pump.id].setIcon(newIcon);
            }
        });

        // Sort pumps by distance for better display
        this.pumps.sort((a, b) => a.distance - b.distance);

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

    initPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        const threshold = 80;
        const pullElement = document.getElementById('pull-to-refresh');
        const mapView = document.getElementById('map-view');

        const touchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        };

        const touchMove = (e) => {
            if (!pulling) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && diff < 150) {
                e.preventDefault();
                pullElement.style.transform = `translateX(-50%) translateY(${Math.min(diff - 80, 20)}px)`;
                
                if (diff > threshold) {
                    pullElement.classList.add('ready');
                    pullElement.querySelector('.pull-text').textContent = 'Release to refresh';
                } else {
                    pullElement.classList.remove('ready');
                    pullElement.querySelector('.pull-text').textContent = 'Pull to refresh';
                }
                
                pullElement.classList.add('visible');
            }
        };

        const touchEnd = () => {
            if (!pulling) return;
            
            const diff = currentY - startY;
            
            if (diff > threshold) {
                pullElement.classList.add('refreshing');
                pullElement.querySelector('.pull-text').textContent = 'Refreshing...';
                
                // Simulate refresh
                setTimeout(() => {
                    this.refreshData();
                    pullElement.classList.remove('visible', 'ready', 'refreshing');
                    pullElement.style.transform = '';
                    pullElement.querySelector('.pull-text').textContent = 'Pull to refresh';
                }, 1500);
            } else {
                pullElement.classList.remove('visible', 'ready');
                pullElement.style.transform = '';
            }
            
            pulling = false;
            startY = 0;
            currentY = 0;
        };

        mapView.addEventListener('touchstart', touchStart, { passive: true });
        mapView.addEventListener('touchmove', touchMove, { passive: false });
        mapView.addEventListener('touchend', touchEnd);
    }

    refreshData() {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.add('active');

        // Simulate data refresh
        setTimeout(() => {
            // Update pump data with new random queue lengths
            this.pumps.forEach(pump => {
                // Randomly update some pumps
                if (Math.random() > 0.7) {
                    pump.queueLength = Math.floor(Math.random() * 25);
                    pump.queueStatus = pump.queueLength <= 5 ? 'green' : pump.queueLength <= 15 ? 'yellow' : 'red';
                    pump.lastUpdated = new Date();
                    
                    // Update traffic density based on new queue length
                    pump.trafficDensity = this.calculateTrafficDensity(pump.queueLength);
                    
                    // Update marker
                    const marker = this.markers[pump.id];
                    if (marker) {
                        marker.setIcon(this.getMarkerIcon(pump.queueStatus, pump));
                    }
                }
            });

            // Update views
            this.updateUI();
            loadingOverlay.classList.remove('active');
            this.showNotification('Data refreshed successfully!', 'success');
        }, 1000);
    }

    // Removed ripple effect for professional look
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CNGFlowApp();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
    });
}
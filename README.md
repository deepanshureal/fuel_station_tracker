# CNGFlow 🚗💨

Smart CNG Station Finder with Real-time Queue Tracking. Save time by finding CNG stations with the shortest queues in Indian cities.

## 🌟 Features

- **Real-time Queue Status**: See live queue lengths at CNG pumps
- **Map & List Views**: Visual map with color-coded markers or sortable list
- **Crowd-sourced Updates**: Users update queue status and earn points
- **Smart Notifications**: Get alerts when nearby pumps have no queue
- **Offline Support**: PWA with offline capabilities
- **Location-based**: Find nearest pumps automatically

## 🚀 Quick Start

### Development
```bash
# Navigate to project directory
cd cng-tracker/public

# Start local server
python3 -m http.server 8000
# OR
npx serve .

# Open http://localhost:8000
```

### Features Demo

1. **View Queue Status**
   - Green = No queue (0-5 vehicles)
   - Yellow = Moderate (6-15 vehicles)
   - Red = Long queue (15+ vehicles)
   - Gray = No recent update

2. **Update Queue**
   - Click the "+" button in bottom nav
   - Select queue length
   - Earn 10 points per update

3. **Find Pumps**
   - Use search to find by name/area
   - Sort by distance, queue, or recent updates
   - Save up to 3 favorites (Premium: unlimited)

## 📱 Progressive Web App

The app works offline and can be installed:
- Chrome/Edge: Click install icon in address bar
- Safari iOS: Share → Add to Home Screen
- Android: Menu → Install app

## 🏗️ Project Structure

```
cngflow/
├── public/
│   ├── index.html      # Main app HTML
│   ├── app.js         # Core application logic
│   ├── styles.css     # Professional UI styling
│   ├── manifest.json   # PWA manifest
│   └── sw.js          # Service worker
├── backend/           # Optional full-stack setup
│   ├── server.js      # Express server
│   ├── db/           # Database schema
│   └── routes/       # API endpoints
├── REAL-DATA-GUIDE.md # Guide for real station data
├── FULLSTACK-README.md # Full-stack setup guide
└── README.md         # This file
```

## 🔧 Tech Stack

- **Frontend**: Vanilla JavaScript (ready for React migration)
- **Maps**: Leaflet.js with OpenStreetMap
- **Styling**: Custom CSS with CSS variables
- **Storage**: LocalStorage for favorites & points
- **PWA**: Service Worker for offline support

## 🎯 Roadmap

### Phase 1 (MVP) ✅
- [x] Map view with pump locations
- [x] Queue status display
- [x] User updates with points
- [x] Search and filtering
- [x] PWA support

### Phase 2 (Coming Soon)
- [ ] User accounts & authentication
- [ ] Real backend with database
- [ ] Push notifications
- [ ] Photo verification
- [ ] Historical analytics

### Phase 3 (Future)
- [ ] ML-based queue predictions
- [ ] Route optimization
- [ ] Integration with fuel companies
- [ ] Premium features
- [ ] Multi-city support

## 🤝 Contributing

This is a hackathon project solving a real problem faced by millions of CNG vehicle owners in India.

### How to Contribute
1. Test the app and report bugs
2. Suggest new features
3. Help with UI/UX improvements
4. Add more city data

## 💡 Business Model

### Freemium
- **Free**: 3 favorite pumps, basic features
- **Premium (₹49/month)**: Unlimited favorites, predictions, no ads

### B2B
- Fleet management dashboards
- API for corporate apps
- Analytics for fuel companies

## 📊 Impact

- **Time Saved**: 20-30 minutes per refuel
- **Reduced Emissions**: Less idling in queues
- **Better Planning**: Predictable refueling
- **Community**: Users helping each other

## 🚦 Demo Credentials

The app works without login. Sample data is pre-loaded for Delhi NCR region.

## 📝 License

MIT License - feel free to use for your own projects!

---

**Problem**: Long CNG queues waste millions of hours daily  
**Solution**: CNGFlow - Smart real-time queue tracking  
**Impact**: Save time, reduce emissions, build community

**CNGFlow** - Making CNG refueling smarter, one queue at a time! 🚀
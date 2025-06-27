# Product Requirements Document: CNG Queue Tracker

## 1. Executive Summary

### Product Overview
CNG Queue Tracker is a crowd-sourced mobile web application that provides real-time information about queue lengths and waiting times at CNG pump stations across Indian cities. The app helps CNG vehicle owners save time by finding stations with shorter queues.

### Problem Statement
- **Long Queues**: CNG vehicle owners often waste 30-60 minutes waiting in queues
- **No Visibility**: No way to know queue status before reaching the pump
- **Peak Hours**: Everyone rushes to the same pumps during peak times
- **Fuel Anxiety**: Drivers with low fuel can't afford to check multiple pumps
- **Time Waste**: Millions of productive hours lost daily in CNG queues

### Solution
A real-time, crowd-sourced platform where users can:
- Check queue lengths before leaving home/office
- Find nearest pumps with shortest queues
- Get notifications when nearby pumps are empty
- Plan refueling during off-peak hours

## 2. Target Users

### Primary Users
1. **Daily Commuters** (Auto/Taxi/Cab Drivers)
   - Need quick refueling during work hours
   - Income depends on time efficiency
   - Tech-savvy with smartphones

2. **Private CNG Car Owners**
   - Office goers who refuel during commute
   - Value time savings
   - Want predictable refueling experience

3. **Fleet Operators**
   - Manage multiple CNG vehicles
   - Need to optimize refueling schedules
   - Track driver time efficiency

### User Personas

**Rajesh - Auto Driver**
- Age: 35
- Uses CNG auto for livelihood
- Loses 2-3 trips daily due to CNG queues
- Needs: Quick queue info, nearest empty pump

**Priya - IT Professional**
- Age: 28
- Drives CNG car to office
- Hates waiting in queues after work
- Needs: Off-peak timing suggestions, reliable updates

## 3. Core Features (MVP)

### 3.1 Pump Discovery
- **Map View**: Show all CNG pumps with color coding
  - 🟢 Green: No/Short queue (0-5 vehicles)
  - 🟡 Yellow: Moderate queue (6-15 vehicles)
  - 🔴 Red: Long queue (15+ vehicles)
  - ⚫ Gray: No recent updates
- **List View**: Sorted by distance and queue length
- **Search**: By area, landmark, or pump name

### 3.2 Queue Status Updates
- **One-Tap Update**: Users at pump update queue length
- **Photo Proof**: Optional queue photo for verification
- **Incentive System**: Points for updates, redeem for rewards
- **Update Freshness**: Show "Updated X mins ago"

### 3.3 Smart Notifications
- **Empty Pump Alerts**: When favorite pumps have no queue
- **Queue Reducing**: Alert when long queue becomes short
- **Off-Peak Suggestions**: Best times to visit based on history

### 3.4 Additional Info
- **Operating Hours**: Pump timings
- **Facilities**: Toilet, air, water availability
- **Payment Modes**: Cash, card, UPI
- **Pressure Status**: High/low pressure reports
- **Price Updates**: Current CNG price

## 4. Technical Architecture

### Frontend
- **Progressive Web App** (works on all devices)
- **Tech Stack**: Vanilla JavaScript + Leaflet Maps
- **Offline Support**: View last known status
- **Push Notifications**: Web push API

### Backend
- **API**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL with PostGIS for location
- **Cache**: Redis for real-time data
- **Queue**: RabbitMQ for notifications

### Key APIs
- Leaflet/OpenStreetMap for mapping
- Firebase for push notifications
- SMS API for critical alerts (premium)

## 5. User Flow

### First Time User
1. Opens app → Sees nearby pumps on map
2. Clicks pump → Sees current queue status
3. Prompted to contribute update
4. Creates account for rewards

### Regular User Flow
1. Opens app → Sees saved favorite pumps
2. Checks queue status
3. Selects pump with short queue
4. Updates queue status on arrival
5. Earns points

### Update Flow
1. User at pump → Tap "Update Queue"
2. Select queue length (visual selector)
3. Optional: Add photo/comment
4. Submit → Earn 10 points

## 6. Data Model

### Pump Station
```javascript
{
  id: "pump_001",
  name: "Indian Oil - Sector 18",
  location: {
    lat: 28.5672,
    lng: 77.3256,
    address: "Sector 18, Noida, UP"
  },
  brand: "Indian Oil",
  facilities: ["toilet", "air", "water"],
  paymentModes: ["cash", "card", "upi"],
  operatingHours: {
    open: "05:00",
    close: "23:00",
    is24x7: false
  },
  currentStatus: {
    queueLength: 5,
    waitTime: 15,
    lastUpdated: "2024-01-20T10:30:00Z",
    updatedBy: "user_123",
    isOpen: true,
    hasLowPressure: false
  }
}
```

### Queue Update
```javascript
{
  id: "update_001",
  pumpId: "pump_001",
  userId: "user_123",
  timestamp: "2024-01-20T10:30:00Z",
  queueLength: 5,
  estimatedWaitTime: 15,
  additionalInfo: {
    isClosed: false,
    hasLowPressure: false,
    notes: "Moving fast"
  },
  verificationPhoto: "photo_url",
  pointsEarned: 10
}
```

## 7. Monetization Strategy

### Freemium Model
**Free Tier**:
- View queue status
- 3 favorite pumps
- Basic notifications

**Premium (₹49/month)**:
- Unlimited favorites
- Advanced notifications
- Ad-free experience
- Route planning
- Queue predictions

### B2B Opportunities
- Fleet management dashboard
- API access for corporates
- Pump analytics for oil companies
- Advertising for nearby businesses

## 8. Success Metrics

### User Metrics
- Daily Active Users (Target: 10K in 3 months)
- Updates per pump per day (Target: 10+)
- User retention (Target: 60% monthly)
- Average time saved (Target: 20 mins/user/refuel)

### Quality Metrics
- Update accuracy (>90%)
- Update freshness (<30 mins old)
- User satisfaction (>4 stars)

## 9. MVP Development Phases

### Phase 1: Core Features (Week 1-2)
- Map integration with pump locations
- Basic queue status display
- Manual update submission
- Simple points system

### Phase 2: User Experience (Week 3)
- User registration/login
- Favorites management
- Search functionality
- Push notifications

### Phase 3: Polish & Launch (Week 4)
- UI/UX improvements
- Performance optimization
- Beta testing with drivers
- Launch preparation

## 10. Competitive Advantage

### Why Users Will Love It
1. **Saves Real Time**: 20-30 mins per refuel
2. **Reduces Anxiety**: Know before you go
3. **Community Driven**: Help each other
4. **Simple Interface**: One-tap updates
5. **Reliable Data**: Crowd-verified

### Barriers to Competition
- Network effects (more users = better data)
- Curated pump database
- User loyalty through points
- Local knowledge integration

## 11. Launch Strategy

### Phase 1: Delhi NCR
- Start with 50 high-traffic pumps
- Partner with auto/taxi unions
- WhatsApp group marketing
- Local RWA partnerships

### Phase 2: Major Metros
- Mumbai, Pune, Ahmedabad
- Bangalore, Hyderabad
- Corporate partnerships

### Phase 3: Tier 2 Cities
- Expand based on CNG adoption

## 12. Challenges & Solutions

### Challenge: Initial Data
**Solution**: 
- Seed data through field visits
- Partner with fuel companies
- Incentivize early adopters

### Challenge: Data Accuracy
**Solution**:
- Photo verification
- Reputation system
- Cross-verification algorithm
- Report fake updates

### Challenge: User Adoption
**Solution**:
- WhatsApp integration
- Referral rewards
- Fuel company partnerships
- Auto/taxi union endorsements

## 13. Future Features

- **Queue Prediction**: ML-based wait time estimates
- **Booking System**: Reserve slot (premium)
- **Multi-Fuel**: Add petrol/diesel pumps
- **Navigation**: In-app navigation to pump
- **Social Features**: Share status, carpool to pump
- **Voice Updates**: For drivers
- **CNG Price Tracker**: Historical prices
- **Pump Reviews**: Rate pump services

## 14. Impact

### Social Impact
- Save millions of productive hours
- Reduce traffic congestion at pumps
- Lower emissions from idle waiting
- Support CNG adoption

### Economic Impact
- More trips for commercial drivers
- Reduced fuel anxiety
- Better pump utilization
- Data insights for planning new pumps

## 15. Technical Requirements

### Performance
- Page load time < 3 seconds
- Update submission < 1 second
- Map rendering < 2 seconds
- Works on 3G networks

### Browser Support
- Chrome 80+ (primary)
- Safari 13+
- Firefox 75+
- Samsung Internet

### Device Support
- Mobile-first design
- Responsive for tablets
- Basic desktop support
- PWA for app-like experience

This app addresses a genuine pain point for millions of Indians and can become an essential utility for CNG vehicle owners.
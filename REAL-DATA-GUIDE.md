# Getting Real CNG Station Data

This guide explains how to show real CNG station locations in the app.

## Current Implementation

The app now supports THREE methods to get real CNG station data:

### 1. **OpenStreetMap (Overpass API)** - FREE & Working Now!
- No API key required
- Searches for fuel stations with CNG (`fuel:cng=yes` tag)
- Real-time data from OpenStreetMap contributors
- Works automatically when you allow location access

### 2. **Google Places API** - Most Accurate (Requires API Key)
To enable Google Places:
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Places API" in your project
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` in app.js with your actual key
4. Note: This requires billing to be enabled (but has free tier)

### 3. **Known Stations Database** - Fallback
- Curated list of major CNG stations
- Used when other methods fail
- Can be expanded with more stations

## How It Works

1. When the app loads, it first tries to get your location
2. Then it queries OpenStreetMap for CNG stations near you
3. If no stations are found, it falls back to known stations
4. Sample data is only used if all methods fail

## Data Sources for Real CNG Stations

### India-Specific Sources:
1. **IGL (Indraprastha Gas Limited)**
   - Website: https://www.iglonline.net/
   - Has CNG station locator for Delhi NCR

2. **Mahanagar Gas Limited (MGL)**
   - Website: https://www.mahanagargas.com/
   - CNG stations in Mumbai

3. **Indian Oil Corporation**
   - Website: https://www.iocl.com/
   - Has fuel station locator

4. **Government Data**
   - data.gov.in might have CNG station datasets
   - State transport department websites

### Adding More Real Stations

To add more real stations manually, update the `knownStations` array in `loadKnownCNGStations()`:

```javascript
{
    id: 'real_004',
    name: 'Station Name',
    location: { lat: 28.1234, lng: 77.5678 },
    address: 'Full Address',
    brand: 'Brand Name',
    operatingHours: 'Timing'
}
```

## Testing Real Data

1. Open the app in your browser
2. Allow location permissions when prompted
3. Check the browser console for logs
4. You should see "Found X real CNG stations!" notification

## Limitations

- **OpenStreetMap**: Data quality depends on community contributions
- **Coverage**: Not all CNG stations may be mapped
- **Queue Data**: Real-time queue information still needs to be crowd-sourced
- **CORS**: Some APIs may require a backend proxy to avoid CORS issues

## Future Improvements

1. **Backend API**: Create a backend that aggregates data from multiple sources
2. **Web Scraping**: Scrape official CNG provider websites
3. **Crowd Sourcing**: Let users add/verify station locations
4. **Government APIs**: Integrate with official transport APIs when available
5. **IoT Integration**: Connect with queue sensors at stations

## Troubleshooting

If you see only sample data:
1. Check browser console for errors
2. Ensure location permissions are granted
3. Try zooming out on the map to see if stations are outside your immediate area
4. Check network tab to see if API calls are being made
5. OpenStreetMap API might be temporarily down - try again later
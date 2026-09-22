# ITS Water Dashboard frontend

This Next.js application monitors water resources in the Welang river basin and Surabaya. Welang station readings, history, forecasts, rainfall, and water quality currently use deterministic simulation data. The `/api/surabaya` endpoint forwards readings from the configured source and preserves its source status when live data is unavailable.

## Run locally

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The map starts with an East Java overview and can focus on the Welang river basin or Surabaya. Search selects and centers a station. Selecting a marker opens its reading, status, and detail link.

If the primary basemap fails or takes more than 10 seconds to load, the map switches to OpenTopoMap. After the connection recovers, use "Coba muat peta lagi" to retry. Reloading the basemap does not reset the selected station or camera position.

Welang status colors and deterministic values come from `src/lib/demo-data.ts`. Station data is stored in `public/data`, while administrative boundaries and river networks are stored in `public/geo`. Welang sensor readings remain simulated and do not require a backend service.

## Production build

```powershell
npm run build
```

The `Dockerfile` builds the standalone Next.js output and runs it with `node server.js` on port 3000.

## Presentation structure

Shared tokens, typography, controls, and station-detail styles are defined in `src/app/globals.css`. Dashboard layout and map interface styles are defined in `src/app/map-dashboard.css`. The application uses local SVG icons without an additional icon dependency.

Station labels use collision detection and give priority to the selected station. Markers remain keyboard-focusable and searchable when labels are hidden. The application disables unnecessary animation when the user prefers reduced motion.

## Verification

Run `npm run build`, then check the application at widths of 375, 768, and 1440 pixels. Verify keyboard navigation, station search and selection, closing panels with Escape, layer controls, detail-page navigation, reduced motion, and browser console errors.

# Sky data

Stars through magnitude 6, constellation figures, and simplified Milky Way contours, reduced from [d3-celestial](https://github.com/ofrohn/d3-celestial/tree/7e720a3de062059d4c5400a379146a601d9010e0/data), commit `7e720a3de062059d4c5400a379146a601d9010e0`. Milky Way rings are simplified with a 0.13° Douglas–Peucker tolerance. Coordinates are J2000 degrees, magnitude and B−V color index from the source catalog. The bundled BSD-3-Clause notice applies.

Ephemerides use Astronomy Engine (MIT); satellite propagation uses satellite.js (MIT). Their licenses ship in node_modules. Optional Starlink OMM elements come from [CelesTrak](https://celestrak.org/), cached at least two hours.

The viewer takes visual inspiration from the original Google Sky Map: constellation lines, object finding, and selectable layers. No Sky Map code, branding, or artwork is copied.

## Meteor outlook

`meteor-showers.json` contains selected annual shower activity dates, 2026 peak dates and peak J2000 radiant coordinates from Table 5 of the [IMO 2026 Meteor Shower Calendar](https://www.imo.net/files/meteor-shower/cal2026.pdf). This is a curated subset, not a complete shower catalog. Dates recur as **seasonal estimates** outside 2026; consult the latest IMO calendar for annual changes and outbursts. Peak radiants are approximate throughout the activity interval; daily radiant drift is not modeled.

The offline outlook uses the real current date and saved coarse location, independently of the sky tour. Astronomy Engine samples every 30 minutes, requiring the Sun below −18° and radiant above 20° across a suggested hour. Ranking favors high radiants, less moonlight and proximity to the estimated peak day. Moon illumination and horizon status describe that hour. Times display in the **device timezone**, which need not match manually chosen coordinates. This is viewing geometry, not a cloud, weather, visibility or meteor-count forecast. Nothing is transmitted for this calculation.

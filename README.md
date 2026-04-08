# OrionTracker

OrionTracker is a Next.js dashboard for visualizing the Artemis II mission using official Orion trajectory data and lunar ephemeris data. It combines backend data ingestion, trajectory processing, engineering calculations, and a frontend mission interface to show Orion’s path, current position, Moon geometry, mission progress, and timeline in one place.

## Overview

The goal of OrionTracker is to present an engineering-style mission tracker built from real trajectory vectors rather than a hand-drawn approximation. The dashboard focuses on showing:

- Orion’s flown path
- Orion’s current position
- Forward path within the available ephemeris window
- Moon geometry and motion
- Mission metrics
- Timeline and milestone context

## Data Sources

OrionTracker uses three main data sources:

### 1. NASA Artemis mission data
Official Artemis trajectory data is used for Orion state vectors and mission geometry.

### 2. JPL Horizons API
JPL Horizons is used to retrieve Moon ephemeris and vector data so the Moon can be plotted in a consistent Earth-centered frame alongside Orion.

### 3. Local app metadata
A local configuration file provides labels, milestone names, and UI descriptions. This metadata is used for presentation only and is not treated as telemetry.

## Architecture

OrionTracker is built with a full stack Next.js structure:

- **Frontend:** React components for the map, metrics, and timeline
- **Backend API:** `src/app/api/dashboard/route.ts`
- **Mission data layer:** `src/lib/data/mission.ts`
- **Math layer:** `src/lib/math/trajectory.ts`
- **Formatting layer:** `src/lib/formatting/format.ts`
- **Static metadata:** `mission-config.json`

The frontend requests `/api/dashboard`, the backend fetches and processes the mission data, computes derived values, and returns a normalized JSON payload to the browser.

## Data Processing

The processing flow is:

1. Fetch the latest Orion ephemeris data
2. Parse Orion state vectors into timestamped position and velocity records
3. Query Moon vectors over the same time range
4. Interpolate Orion and Moon positions to the current time
5. Split the mission into historic and future path segments
6. Compute derived mission metrics
7. Return a normalized payload for the dashboard UI

### Parsed Orion state
Each valid ephemeris row is converted into:

- `timestamp`
- `position = (x, y, z)` in km
- `velocity = (vx, vy, vz)` in km/s

### Path outputs
The app builds separate path datasets for time-consistent visualization:

- `actualPath`
- `futurePath`
- `moonActualPath`
- `moonFuturePath`

This avoids misleading geometry where Orion is shown across time but the Moon is shown only at a single instant.

## Engineering Calculations

OrionTracker computes several derived metrics from the trajectory data.

### 1. Speed magnitude

Given Orion’s velocity vector:

$$
\vec{v} = (v_x, v_y, v_z)
$$

the scalar speed is:

$$
|\vec{v}| = \sqrt{v_x^2 + v_y^2 + v_z^2}
$$

### 2. Distance from Earth

Using Earth-centered coordinates:

$$
\vec{r} = (x, y, z)
$$

distance from Earth is:

$$
d_{Earth} = \sqrt{x^2 + y^2 + z^2}
$$

### 3. Distance from Moon

If Orion is at $(x, y, z)$ and the Moon is at $(x_m, y_m, z_m)$, then:

$$
d_{Moon} = \sqrt{(x - x_m)^2 + (y - y_m)^2 + (z - z_m)^2}
$$

### 4. Cumulative distance traveled

For a sequence of trajectory points $P_0, P_1, ..., P_n$:

$$
D_{cum} = \sum_{i=1}^{n} \|P_i - P_{i-1}\|
$$

where each segment length is:

$$
\|P_i - P_{i-1}\| = \sqrt{(x_i - x_{i-1})^2 + (y_i - y_{i-1})^2 + (z_i - z_{i-1})^2}
$$

### 5. Elapsed mission time

If $t_{launch}$ is launch time and $t_{now}$ is the current timestamp:

$$
t_{elapsed} = t_{now} - t_{launch}
$$

### 6. Remaining mission window

If $t_{end}$ is the end of the available ephemeris window:

$$
t_{remaining} = t_{end} - t_{now}
$$

### 7. Mission progress

$$
Progress\% = \frac{t_{now} - t_{launch}}{t_{end} - t_{launch}} \times 100
$$

This value is clamped between 0 and 100.

### 8. Closest approach to the Moon

For each Orion position $O_i$ and Moon position $M_i$ at the same timestamp:

$$
d_i = \|O_i - M_i\|
$$

Closest approach is:

$$
d_{min} = \min(d_i)
$$

The corresponding timestamp is recorded as the time of closest approach.

## Dashboard Outputs

The frontend is designed to present:

- Mission map
- Orion current position
- Orion flown path
- Orion future path
- Moon current position
- Moon historic and future path
- Moon position at closest approach
- Mission metrics
- Ordered mission timeline

## Hosting

OrionTracker is designed for deployment on **Vercel**.

Vercel is a strong fit because the project uses:

- Next.js App Router
- React frontend rendering
- Server side API execution
- Backend data fetching and processing

If deployed, the production application runs from the Vercel project URL. Otherwise, it runs in local development.

## Design Notes

A major design consideration in OrionTracker is **time consistency**.

If Orion is shown as a path over time while the Moon is displayed only at its current position, the geometry can appear visually incorrect even when the source vectors are correct. To avoid this, OrionTracker represents the Moon across matching historic and forward windows, and also highlights the Moon’s position at Orion’s closest approach.

## Limitations

- The dashboard is only as accurate as the official ephemeris and Moon vectors it can successfully fetch
- The visible future mission arc is limited to the currently available official ephemeris window
- Some milestone names and interface labels come from local metadata
- A nominal reference trajectory may be omitted in strict accuracy-first views
- Frontend metadata fallbacks may appear if the backend payload shape changes during development

## Tech Stack

- Next.js App Router
- React
- Server-side API routes
- NASA Artemis mission ephemeris ingestion
- JPL Horizons Moon vectors
- Vercel deployment target

## Summary

OrionTracker is a data-driven space mission dashboard that ingests official trajectory data, aligns Orion and Moon geometry in a consistent frame, applies engineering calculations to derive mission metrics, and serves the processed results through a modern web interface.

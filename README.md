# OrionTracker

OrionTracker is a mission dashboard project that visualizes the Artemis II journey between Earth and the Moon. It compares a nominal reference trajectory with the actual flown trajectory and computes engineering focused mission metrics such as speed, progress, distance, elapsed time, and deviation from plan.

## MVP goals

- visualize Earth and Moon
- draw nominal and actual trajectories
- show current spacecraft position
- compute mission metrics from trajectory data
- document architecture, math, data flow, and project roadmap
- deploy publicly and track visitors

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- static JSON data for MVP
- Vercel for deployment
- Vercel Analytics for usage insights

## Project structure

```txt
src/
  app/
  components/
  lib/
  types/
public/
  data/
docs/
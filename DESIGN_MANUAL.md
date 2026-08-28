# Funweb Design & Privacy Manual

This manual dictates the strict design constraints, visual standards, and privacy requirements for all agentic AI coding assistants working on this project. Agents MUST read and adhere to these rules before building or modifying pages.

## 1. Strict Privacy & Security
- **EVERYTHING IS FULLY PRIVATE BY DEFAULT.**
- **No Public Assets**: Do not place images, media, or sensitive user-generated content in the `public/` directory unless the user explicitly commands you to make something public.
- **Authenticated APIs**: All private media must be served through authenticated backend routes (e.g., `/api/media/[filename]`).
- **Data Fetching**: Ensure all API routes fetching sensitive information strictly validate authentication (e.g., verifying JWTs/sessions). Do not expose any data to unauthenticated users.

## 2. Page Design & UI/UX Standards
- **Premium Aesthetics**: Pages should look cinematic, modern, and highly polished.
- **No Generic UI**: Avoid generic dashboard-style layouts or plain text placeholders when a visual centerpiece is required.
- **Micro-interactions**: Incorporate subtle, organic animations for hovers and idle states.
- **Performance First**: 
  - Use `requestAnimationFrame` with HTML5 `<canvas>` for complex particle effects (fire, sparks, stars) instead of heavy GIFs, videos, or excessive DOM nodes.
  - **CRITICAL**: All background animations, `<canvas>` loops, and physics calculations MUST automatically pause when the tab is hidden (`document.hidden`) using the Page Visibility API to save battery and CPU.
  - Lazy load heavy cosmetic components using `next/dynamic` to prioritize Time to Interactive (TTI).

## 3. Specific Component Guidelines
### "What I expected vs What I got" Page
- **Purpose**: A premium visual inspection gallery. Not a 1-to-1 matching engine.
- **Layout**: Two independent carousels. Two-column on desktop, vertically stacked on mobile.
- **Centerpiece**: A fiery, fighting-game inspired "VS" element separating the two carousels. Built with a highly performant `<canvas>` particle system for flames/sparks.
- **Media**: Images MUST be loaded via the authenticated `/api/media/` endpoint.
- **Interactions**: Click on an image to open a full-screen Lightbox. Use horizontal thumbnail rails.

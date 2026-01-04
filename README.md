# Speed vs. Sense: The Hidden Logic of Cyclist Routes

A responsive prototype website (designed with AI) showcasing photographic documentation of cyclist route choices in London through visual galleries.

## About the Project

This static website presents research on cyclist route preferences in East London, comparing two contrasting routes:

- **Whitechapel Road Superhighway** (Aldgate East → Mile End): The speed-optimized route
- **Regent's Canal Route** (Mile End → Victoria Park): The sense-optimized route

The site features immersive photo galleries with 10 high-resolution images per route, allowing viewers to experience the qualitative differences between infrastructure-focused and environment-focused cycling paths.

## Features

- **Responsive Design**: Mobile-first CSS with breakpoints for tablet and desktop
- **Interactive Gallery**: Masonry grid layout with hover effects and lightbox viewing
- **Smooth Navigation**: Fixed navigation with smooth scrolling between sections
- **Touch Support**: Swipe gestures for mobile lightbox navigation
- **Performance Optimized**: Image lazy loading and progressive enhancement
- **Accessibility**: Keyboard navigation and semantic HTML structure

## Technical Stack

- Pure HTML5, CSS3, and vanilla JavaScript
- No frameworks or build tools required
- Static files ready for any web server deployment

## Getting Started

### Quick Start

1. Clone or download the project files
2. Open `index.html` in a web browser
3. That's it! The site runs entirely in the browser.

### File Structure

```
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and responsive design
├── scripts.js          # JavaScript functionality and interactions
├── README.md           # This documentation
└── images/             # Photo directory (to be added)
    ├── superhighway-1.jpg through superhighway-10.jpg
    └── canal-1.jpg through canal-10.jpg
```

### Adding Photos

Place your route photographs in the `images/` directory with the following naming convention:

**Superhighway Route Photos:**
- `superhighway-1.jpg`
- `superhighway-2.jpg`
- ...
- `superhighway-10.jpg`

**Canal Route Photos:**
- `canal-1.jpg`
- `canal-2.jpg`
- ...
- `canal-10.jpg`

### Deployment Options

**Local Development:**
- Double-click `index.html` or open with any web browser

**Web Server:**
- Upload all files to any web hosting service
- Works with GitHub Pages, Netlify, Vercel, or traditional hosting

**GitHub Pages:**
1. Push files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source branch (usually `main` or `gh-pages`)

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Images are lazy-loaded for faster initial page load
- Smooth scrolling with fallback for older browsers
- Optimized for both desktop and mobile viewing
- Progressive enhancement ensures functionality without JavaScript

## Customization

### Colors
The site uses a minimal color palette defined in CSS custom properties:
- Primary: `#0074D9` (blue accent)
- Text: `#333` (dark gray)
- Background: `#fff` (white)
- Secondary background: `#f8f9fa` (light gray)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1200px
- Desktop: > 1200px
- Large screens: > 1400px

### Gallery Layout
The masonry grid automatically adjusts based on screen size:
- Mobile: 1-2 columns
- Tablet: 2-3 columns
- Desktop: 3-4 columns
- Large: 5 columns

## Research Context

This website accompanies the research paper "Speed vs. Sense: The Hidden Logic of Cyclist Routes" by Andrii Kolisnyk, exploring how urban infrastructure and environmental factors influence cyclist route selection in London.

The project is inspired by the Copenhagenize project’s work on making cycling infrastructure legible and comparable through clear, visual storytelling.

The photographic documentation allows viewers to qualitatively assess the differences between:
- Infrastructure-optimized routes (dedicated cycle superhighways)
- Experience-optimized routes (scenic canal paths and park routes)

## Credits

- **Photography & Research**: Andrii Kolisnyk
- **Web Development**: Static prototype for academic presentation
- **Inspiration**: Copenhagenize project (https://copenhagenize.eu/) — not affiliated
- **Year**: 2025

## License

This project (including photographs, text, and code unless otherwise noted) is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

- You are free to **share** and **adapt** the material for any purpose, including commercially.
- You must give **appropriate credit**, provide a link to the license, and indicate if changes were made.

See the full license in [LICENSE](LICENSE).

Suggested attribution:
"Speed vs. Sense: The Hidden Logic of Cyclist Routes" by Andrii Kolisnyk, licensed under CC BY 4.0.

---

*For questions about the research or website, please contact the researcher through academic channels or email.*

# CareerNxt — Startup & VC Portfolio Explorer

A modern, eye-catching web application for exploring startup accelerators, venture capital firms, and their portfolios. Inspired by design principles from 21st.dev and Framer, built with no locked dependencies.

![CareerNxt Preview](https://img.shields.io/badge/Design-Modern-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Responsive](https://img.shields.io/badge/Responsive-Yes-success)

## ✨ Features

### 🎨 Modern Design System
- **Glassmorphism effects** with backdrop filters
- **Dynamic color schemes** (light/dark mode)
- **Gradient backgrounds** and smooth animations
- **Responsive layout** that works on all devices
- **Eye-catching components** inspired by 21st.dev & Framer

### 📊 Data Exploration
- **Company cards** with hover effects and animations
- **Portfolio explorer** for accelerators and VC firms
- **Advanced filtering** by batch, industry, stage, and tags
- **Real-time search** across companies and founders
- **Interactive statistics** with live updates

### 🚀 Interactive Features
- **Dark/Light mode toggle** with persistent preferences
- **Smooth animations** and micro-interactions
- **Scroll-triggered animations** using Intersection Observer
- **Hover effects** on cards and interactive elements
- **Mobile-optimized** responsive design

## 🏗️ Project Structure

```
CareerNext/
├── index.html          # Main HTML file with modern design
├── style.css           # Complete CSS design system
├── app.js              # JavaScript functionality
├── README.md           # This documentation
├── Portfolio.csv       # Accelerator/VC portfolio data
├── Portfolio.txt       # Extended portfolio listings
└── data/              # Additional data files
    ├── companies.json  # Company database
    ├── techstars.json  # Techstars-specific data
    ├── meta.json       # Metadata
    └── startups_h1b_database.csv  # H1B visa data
```

## 🎯 Design Principles

1. **No Locked Dependencies** - Pure HTML, CSS, and JavaScript
2. **Modern Aesthetics** - Glassmorphism, gradients, and smooth transitions
3. **Performance First** - Optimized animations and efficient rendering
4. **Accessibility** - Semantic HTML, ARIA labels, and keyboard navigation
5. **Responsive Design** - Mobile-first approach with breakpoints

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser.

### Option 2: Local Development Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Then visit `http://localhost:8000` in your browser.

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `style.css`:
```css
:root {
  --primary: #6366f1;
  --secondary: #10b981;
  --accent: #f59e0b;
  /* ... */
}
```

### Adding New Data
1. Update `Portfolio.csv` with new accelerator/VC entries
2. Format: `Name,Type,Portfolio URL,JobBoard URL`
3. The portfolio explorer will automatically display new entries

### Modifying Animations
Adjust animation timings in `style.css`:
```css
--transition-fast: 150ms;
--transition: 250ms;
--transition-slow: 350ms;
```

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above (full grid layout)
- **Tablet**: 768px to 1023px (2-column grid)
- **Mobile**: Below 768px (single column, optimized touch)

## 🔧 Technical Implementation

### CSS Features Used
- CSS Grid and Flexbox for layouts
- CSS Custom Properties (variables) for theming
- CSS Transitions and Animations
- Backdrop Filter for glassmorphism effects
- CSS Clip-path and Gradients

### JavaScript Features
- Intersection Observer for scroll animations
- Local Storage for theme persistence
- Event delegation for efficient handling
- Dynamic DOM manipulation

### Performance Optimizations
- Efficient CSS selectors
- Debounced search input
- Lazy loading for images
- Minimal JavaScript bundle

## 📊 Data Integration

The application can be extended to load real data from:

1. **JSON APIs** - Fetch live data from external sources
2. **CSV Parsing** - Load and parse `Portfolio.csv` dynamically
3. **Local Storage** - Cache data for offline use
4. **IndexedDB** - For larger datasets

## 👤 Attribution

**Created by**: Pavan Yellathakota ([pye.pages.dev](https://pye.pages.dev))

**Contact**: [pavan.yellathakota.ds@gmail.com](mailto:pavan.yellathakota.ds@gmail.com)

**GitHub**: [yellatp](https://github.com/yellatp)

**LinkedIn**: [yellatp](https://linkedin.com/in/yellatp)

## 🤝 Contributing

Feel free to contribute to this open-source project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Acknowledgments

- Design inspiration from [21st.dev](https://21st.dev) and [Framer](https://framer.com)
- Icons from [Font Awesome](https://fontawesome.com)
- Data from Y Combinator, Techstars, and other public sources
- Built with modern web standards and best practices

---

**CareerNxt** - Exploring the future of startups, one portfolio at a time. 🚀
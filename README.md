# Pocketa 🪙

A clean, simple money-tracking web app built with vanilla HTML5, CSS3, and JavaScript.

## Features

- **No Server or Database Required**: Completely client-side; data is stored securely in your browser using `localStorage`.
- **Currency in Nigerian Naira (₦)**: Formatted with clean decimal precision and thousands separators.
- **Record Expenses**:
  - Description of what was purchased
  - Amount spent in Naira (₦)
  - Date of spending (defaults to today)
- **Spending Overview**: Live calculation of total spent and transaction counts at the top.
- **Search & Filter**: Search through expenses by name or formatted date in real time.
- **Edit & Update**: Edit any past expense easily.
- **Safe Deletion**: Deleting an expense prompts for confirmation to prevent accidental loss.
- **Empty States**: Friendly message when no expenses are recorded or when search yields no matches.
- **Mobile-First Responsive Design**: Optimized for mobile screens and desktop browsers alike.

## Structure

```
pocketa/
├── index.html   # Semantic layout, form, expense list & dialog modal
├── style.css    # Clean, responsive CSS with mobile-first layout
├── script.js    # LocalStorage handling, state management, search, and calculations
└── README.md    # Documentation
```

## Getting Started

Simply open `index.html` in any modern web browser or host it on any static web hosting service (GitHub Pages, Vercel, Netlify, etc.).

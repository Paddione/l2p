# 🎨 Learn2Play Color Scheme Documentation

This document contains the complete color system used in the Learn2Play multiplayer quiz game, with specific usage examples for each color.

## Color Architecture

The project uses a three-level color architecture:
1. **Base Colors**: Core color palette
2. **Semantic Colors**: Functionally named colors (primary, success, error, etc.)
3. **Component Colors**: Specific UI element colors

## Base Color Palette

### Blue Scale
```css
--blue-50: #EFF6FF;    /* Used in: info-light backgrounds */
--blue-500: #3B82F6;   /* Used in: primary color, buttons, links */
--blue-600: #2563EB;   /* Used in: button hover states */
--blue-700: #1D4ED8;   /* Used in: button active states */
--blue-900: #1E3A8A;   /* Used in: dark info backgrounds */
```

### Gray Scale
```css
--gray-50: #F9FAFB;    /* Used in: light mode text-primary */
--gray-100: #F3F4F6;   /* Used in: secondary button backgrounds */
--gray-200: #E5E7EB;   /* Used in: borders, dividers */
--gray-300: #D1D5DB;   /* Used in: dark mode text-secondary */
--gray-400: #9CA3AF;   /* Used in: disabled text */
--gray-500: #6B7280;   /* Used in: secondary text */
--gray-600: #4B5563;   /* Used in: dark mode dividers */
--gray-700: #374151;   /* Used in: dark mode borders */
--gray-800: #1F2937;   /* Used in: dark button text */
--gray-900: #111827;   /* Used in: primary text */
```

### Accent Colors (Pantone 2025 Inspired)
```css
--mocha-mousse: #A47864;      /* Used in: secondary color, gradients */
--canary-yellow: #FFD23F;     /* Used in: development mode highlights */
--ethereal-blue: #7FB3F0;     /* Used in: background gradients */
--verdant-green: #4ADE80;     /* Used in: success states (unused in current implementation) */
--clay-terracotta: #C99383;   /* Used in: dark mode secondary */
```

## Implementation Notes

1. **WCAG Compliance**: All color combinations meet WCAG AA standards (4.5:1 contrast ratio)
2. **Theme Switching**: Colors automatically adjust between light and dark modes using `[data-theme="dark"]` selector
3. **Responsive Design**: Colors work consistently across all screen sizes
4. **Modern CSS**: Uses CSS custom properties for maintainability and theme switching
5. **Performance**: Optimized for smooth transitions and minimal repaints 
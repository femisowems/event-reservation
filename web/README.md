# Event Reservation Frontend

This is the React frontend for the Event Reservation System. It provides a web-based interface for customers to reserve tickets for events, with a focus on accessibility, responsive design, and smooth user experience.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Event Reservation Frontend is a modern React application that enables customers to:

- Browse available events
- Select date and time for reservation
- Complete booking with personal information
- View confirmation with reservation ID
- Access previously made reservations
- Receive clear error messages and validation feedback

### Key Design Principles

- **Accessibility First**: ARIA labels, keyboard navigation, high contrast
- **Responsive**: Works seamlessly on desktop, tablet, and mobile browsers
- **Type-Safe**: Built with TypeScript for reliability
- **Zero Heavy Dependencies**: Custom components instead of large UI libraries
- **Performant**: Vite for fast builds and dev server

## ✨ Features

- **Event Selection**: Choose from available events (Comedy, Jazz, Film Festival)
- **Smart Date & Time Picking**:
  - Prevents reservations in the past
  - Automatically handles timezone conversions (validates locally, sends UTC)
  - Visual layout optimized for clarity
- **State-Driven Reservation Flow**:
  - **Idle**: Clean form for input
  - **Loading**: Spinner and disabled inputs during network requests
  - **Success**: Confirmation card with a reservation ID
  - **Error**: Dismissible alerts for validation or API errors
- **Accessibility (A11y)**: ARIA live regions for status updates, keyboard-navigable inputs, high-contrast styling
- **Responsive Design**: Mobile-friendly card layout that adapts to screen size
- **Form Validation**: Real-time validation feedback

## 🛠 Tech Stack

- **React 19**: Latest React for component-based UI
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool and dev server
- **CSS Variables** (Theming): Dynamic theming without SCSS/LESS
- **Custom Components**: Lightweight components instead of heavy UI libraries (no Material UI, Bootstrap)
- **Fetch API**: Native HTTP client (no Axios/jQuery)

## 📂 Project Structure

```
web/
├── src/
│   ├── api/
│   │   └── client.ts                # API client for backend communication
│   ├── components/
│   │   ├── BookingCard.tsx          # Main layout container
│   │   ├── BookingForm.tsx          # Core logic and state management
│   │   ├── BookingForm.css          # Form styling
│   │   ├── BookingStatus.tsx        # Feedback (Success/Error/Loading)
│   │   ├── BookingSummary.tsx       # Request summary view
│   │   ├── DatePicker.tsx           # Custom date input wrapper
│   │   ├── DatePicker.css
│   │   ├── TimePicker.tsx           # Custom time input wrapper
│   │   ├── TimePicker.css
│   │   ├── MyTickets.tsx            # User's ticket view
│   │   ├── TicketBookingFlow.tsx    # Orchestrator for the reservation flow
│   │   └── TicketBookingFlow.css
│   ├── hooks/
│   │   └── useClock.ts              # Custom hook for time management
│   ├── App.tsx                      # Root component
│   ├── App.css
│   ├── index.css                    # Global styles and CSS variables
│   ├── main.tsx                     # React entry point
│   └── types/                       # TypeScript types/interfaces
├── public/                          # Static assets
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # TypeScript app configuration
├── tsconfig.node.json               # TypeScript node configuration
├── package.json                     # Dependencies & scripts
├── nginx.conf                       # Nginx configuration (for production)
├── Dockerfile                       # Container image definition
└── README.md                        # This file
```

## Prerequisites

- **Node.js**: v18+ (v20+ recommended)
  ```bash
  node --version  # Should be v18+
  npm --version   # Should be v9+
  ```
- **Git**: For version control
- **Backend API**: Running on `http://localhost:8080` (for local development)

## Installation & Setup

### 1. Navigate to Web Directory

```bash
cd /Users/femisowemimo/Documents/GitHub/booking-appointment/web
```

### 2. Install Dependencies

```bash
npm install
```

This installs:

- React and React DOM
- TypeScript
- Vite and build tools
- Development dependencies

### 3. Verify Installation

```bash
npm --version
node --version
npm run build --version
```

## Local Development

### Starting the Development Server

```bash
npm run dev
```

Output:

```
  VITE v5.x.x  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

The app is now available at `http://localhost:5173/`

**Features:**

- Hot Module Replacement (HMR): Changes reflect instantly (no full page reload)
- Error Overlay: Compilation errors appear directly in the browser
- Fast Refresh: React component state is preserved during edits

### Development Workflow

1. **Ensure backend is running:**

   ```bash
   # In a separate terminal
   cd ../backend
   go run cmd/api/main.go
   ```

2. **Start dev server:**

   ```bash
   npm run dev
   ```

3. **Open in browser:**

   ```
   http://localhost:5173/
   ```

4. **Make code changes** → Automatically reloaded in browser

5. **Use browser DevTools:**
   - Inspect React components (React DevTools extension recommended)
   - Network tab to verify API calls to `http://localhost:8080/api`
   - Console for debugging

## Configuration

### Environment Variables

Create a `.env` file in the `web/` directory:

```bash
# .env
VITE_API_URL=http://localhost:8080/api
```

Available environment variables:

| Variable       | Default                     | Usage                |
| -------------- | --------------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:8080/api` | Backend API endpoint |
| `VITE_DEBUG`   | `false`                     | Enable debug logging |

### Environment-Specific Configuration

#### Development (`.env.development` or `.env`)

```bash
VITE_API_URL=http://localhost:8080/api
VITE_DEBUG=true
```

#### Production (`.env.production`)

```bash
VITE_API_URL=https://booking-appointment-backend-production.up.railway.app
VITE_DEBUG=false
```

### Accessing Environment Variables in Code

```typescript
// In any component
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

## 🎨 Styling

### CSS Variables (Theme)

Global styles and theme variables are defined in `src/index.css`:

```css
:root {
  /* Colors */
  --primary-color: #007bff;
  --success-color: #28a745;
  --error-color: #dc3545;
  --background-color: #f8f9fa;
  --text-color: #333;
  --border-color: #dee2e6;

  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
}
```

### Component Styles

Component-specific styles are co-located:

```
BookingForm.tsx  ← Logic
BookingForm.css  ← Styling
```

This keeps related code together and makes components easier to maintain.

### Adding Custom Styles

1. **Global styles**: Add to `src/index.css`
2. **Component styles**: Create `.css` file next to component
3. **Inline styles**: Use `className` prop with CSS variables:

```typescript
<button style={{ backgroundColor: 'var(--primary-color)' }}>
  Book Now
</button>
```

## Building for Production

### 1. Build Optimized Bundle

```bash
npm run build
```

This:

- Compiles TypeScript to JavaScript
- Minifies code and assets
- Generates production-ready files in `dist/` directory
- Reports build size

Output:

```
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/main-xxxxx.js       145.28 kB │ gzip: 47.23 kB
```

### 2. Preview Production Build Locally

```bash
npm run preview
```

This runs the production build locally on `http://localhost:4173/` for testing.

### 3. Verify Build Quality

```bash
# Build and check for errors
npm run build

# Check bundle size
npm run build -- --emptyOutDir --minify
```

## Deployment

### Vercel (Recommended)

The project includes `vercel.json` for automatic Vercel deployment:

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

Vercel automatically:

- Detects `package.json`
- Installs dependencies
- Runs `npm run build`
- Serves `dist/` folder

Configuration in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Docker Deployment

```bash
# Build Docker image
docker build -f Dockerfile -t booking-appointment-web:latest .

# Run container
docker run -p 8080:80 booking-appointment-web:latest
```

The Dockerfile uses Nginx to serve the production build.

### Railway Deployment

```bash
# Connect to Railway
railway link

# Deploy
railway up
```

Railway automatically detects and deploys based on Dockerfile.

## Testing

### Run Unit Tests

```bash
npm run test
```

### Run Tests with Coverage

```bash
npm run test -- --coverage
```

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

### Manual Testing Checklist

- [ ] Form validation works (try empty fields, invalid email)
- [ ] Date picker prevents past dates
- [ ] Time picker restricts to valid times
- [ ] API call succeeds (check Network tab in DevTools)
- [ ] Success message displays with reservation ID
- [ ] Error message displays on API failure
- [ ] Responsive design works (test on mobile width)
- [ ] Keyboard navigation works (Tab through form)
- [ ] Screen reader works (ARIA labels are present)

## Troubleshooting

### Issue: "Cannot find module" error

**Error:** `Module not found: Can't resolve '@/components'`

**Solutions:**

1. Check imports use correct paths (relative or from tsconfig baseUrl)
2. Verify file extensions (TypeScript files need `.ts` or `.tsx`)
3. Ensure file is not in `.gitignore`

### Issue: Dev Server Won't Start

**Error:** `npm run dev` fails or hangs

**Solutions:**

1. Kill process on port 5173:
   ```bash
   lsof -i :5173
   kill -9 <PID>
   ```
2. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Clear Vite cache:
   ```bash
   rm -rf .vite
   ```

### Issue: API Calls Return 404 or CORS Error

**Error:** `404 Not Found` or `CORS error` from `/api/reservations`

**Solutions:**

1. **Verify backend is running:**

   ```bash
   curl http://localhost:8080/api/reservations
   ```

2. **Check VITE_API_URL:**
   - Ensure `.env` file has correct endpoint
   - Verify in browser: `console.log(import.meta.env.VITE_API_URL)`

3. **Check browser Console:**
   - Look for CORS errors (usually means backend not handling cross-origin)
   - Check Network tab for actual request URL and response

4. **Test API directly:**
   ```bash
   curl -X GET http://localhost:8080/api/reservations \
     -H "Content-Type: application/json"
   ```

### Issue: HMR (Hot Module Reload) Not Working

**Error:** Changes don't reflect in browser automatically

**Solutions:**

1. Check browser console for errors
2. Hard refresh browser: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+F5` (Windows)
3. Restart dev server:
   ```bash
   npm run dev
   ```
4. Check file was saved (no dot indicator in VS Code)

### Issue: Build Fails with TypeScript Errors

**Error:** `tsc` or `build` command fails

**Solutions:**

1. Check TypeScript errors in VS Code (red squiggles)
2. Run type check:
   ```bash
   npx tsc --noEmit
   ```
3. Fix any missing types or imports
4. Ensure `tsconfig.json` is valid

### Issue: "Cannot GET /" on Vercel/Production

**Error:** 404 when visiting app URL

**Solutions:**

1. Check build output directory is `dist/`
2. Verify Vercel deployment logs
3. Ensure backend API URL is updated in production env
4. Check `vercel.json` for correct build command

## NPM Scripts Reference

| Script               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start development server on localhost:5173 |
| `npm run build`      | Build production-optimized bundle          |
| `npm run preview`    | Preview production build locally           |
| `npm run test`       | Run unit tests                             |
| `npm run lint`       | Run code linter (if configured)            |
| `npm run type-check` | Run TypeScript type checking               |

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/)

# Event Reservation - Mobile Application (Android)

This is the mobile client for the Event Reservation System, built with **Ionic Angular** and **Capacitor**. It provides a mobile interface for customers to browse events and manage reservations, with native Android capabilities.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Building for Production](#building-for-production)
- [Android Development](#android-development)
- [Troubleshooting](#troubleshooting)

## Overview

This Ionic Angular application features:

- Event browsing and reservation management
- Real-time check-in functionality
- Environment-specific API configuration
- Native Android capabilities via Capacitor
- Development server proxy for local API testing
- Responsive design optimized for mobile

### Technology Stack

- **Ionic Framework**: 8.x
- **Angular**: 20.x
- **Capacitor**: For native Android integration
- **TypeScript**: For type-safe development
- **SCSS**: For styling

## Prerequisites

Before generating the Android app, ensure you have the following installed:

1.  **Node.js**: v18+ (v20+ recommended)

    ```bash
    node --version  # Should be v18+
    npm --version   # Should be v9+
    ```

2.  **Ionic CLI**:

    ```bash
    npm install -g @ionic/cli
    ionic --version
    ```

3.  **Android Studio**: [Download here](https://developer.android.com/studio)
    - After installation, open Android Studio and go to **Tools > SDK Manager**
    - Install: "Android SDK", "Android SDK Platform-Tools", and "Android SDK Build-Tools"
    - Set `ANDROID_SDK_ROOT` environment variable (see [Android Setup](#android-development))

4.  **Java (JDK)**: v17+ (usually installed with Android Studio)

    ```bash
    java -version  # Should be 17+
    ```

5.  **Git**: For version control

## Project Structure

```
mobile/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── schedule.service.ts      # API service (reads environment config)
│   │   │   └── reservation.service.ts
│   │   ├── pages/
│   │   │   ├── check-in/
│   │   │   ├── reservations/
│   │   │   └── schedule/
│   │   └── app.module.ts                # Root app module
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts               # Dev config (localhost:4200/api proxy)
│   │   └── environment.prod.ts          # Prod config (Railway backend)
│   ├── theme/
│   │   └── variables.scss               # Theme variables
│   ├── global.scss
│   ├── main.ts                          # App entry point
│   └── index.html
├── www/                                 # Compiled web assets
├── android/                             # Native Android project (Capacitor)
├── proxy.conf.json                      # Dev server proxy config (NEW)
├── angular.json                         # Angular build configuration
├── ionic.config.json                    # Ionic configuration
├── package.json                         # Dependencies & npm scripts
└── README.md                            # This file
```

## Installation & Setup

### 1. Navigate to Mobile Directory

```bash
cd /Users/femisowemimo/Documents/GitHub/booking-appointment/mobile
```

### 2. Install Node Dependencies

```bash
npm install
```

This installs:

- Ionic Framework
- Angular and its dependencies
- Capacitor for native integration
- TypeScript compiler
- Build tools

### 3. Verify Installation

```bash
ionic --version
ng version
npx cap --version
```

### 4. Build Web Assets

```bash
npm run build
```

This compiles TypeScript and SCSS into production-ready JavaScript in the `www/` directory.

## Local Development

### Running the Development Server

The dev server runs on **`localhost:4200`** with a proxy to the backend API on **`localhost:8080`**.

```bash
npm start
```

Or explicitly:

```bash
ng serve --open
```

This:

1. Starts the Angular dev server on `http://localhost:4200`
2. Opens the app in your default browser
3. Enables live reload (changes save automatically)
4. Proxies `/api/*` requests to `http://localhost:8080` (see [Proxy Configuration](#proxy-configuration))

### Backend Proxy Configuration

The Angular dev server is configured to proxy API requests from the mobile app (port 4200) to the Go backend (port 8080). This solves the browser's same-origin policy during local development.

#### Proxy Configuration File: `proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "pathRewrite": {}
  }
}
```

#### How It Works

1. **Dev Server** (localhost:4200):
   - Serves the Ionic Angular app
   - Intercepts requests to `/api/*`

2. **Proxy Rule**:
   - Matches `/api/*` requests
   - Forwards to `http://localhost:8080/api/*`
   - Transparent to the client

3. **Example Request Flow**:
   ```
   Client Code: fetch('http://localhost:4200/api/reservations')
   ↓ (dev server intercepts /api/*)
   Proxy Rule: Forward to http://localhost:8080/api/reservations
   ↓
   Backend Response: [{ id: "...", email: "..." }]
   ↓
   Client receives response
   ```

#### Enabling the Proxy

The proxy is configured in `angular.json`:

```json
{
  "projects": {
    "app": {
      "architect": {
        "serve": {
          "options": {
            "proxyConfig": "proxy.conf.json"
          }
        }
      }
    }
  }
}
```

### Development Workflow

1. **Start backend** (in a separate terminal):

   ```bash
   cd ../backend
   go run cmd/api/main.go
   ```

2. **Start mobile dev server** (in another terminal):

   ```bash
   cd mobile
   npm start
   ```

3. **Open app** in browser: `http://localhost:4200`

4. **Make changes** to TypeScript/SCSS files → app reloads automatically

5. **Test API calls** (they proxy to localhost:8080):
   ```typescript
   // From ScheduleService
   const reservations = await fetch("http://localhost:4200/api/reservations").then((r) => r.json());
   // Behind the scenes: routed to http://localhost:8080/api/reservations
   ```

## Configuration

### Environment Variables

The app supports environment-specific configuration through `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

#### Development Environment (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:4200/api", // Proxied to http://localhost:8080 by dev server
};
```

- `apiUrl`: API endpoint for dev (proxied through Angular dev server)
- When dev server runs on port 4200, this URL gets proxied to the backend on port 8080

#### Production Environment (`environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  apiUrl: "https://booking-appointment-backend-production.up.railway.app",
};
```

- `apiUrl`: Production backend URL on Railway
- Used when building for production with `--configuration=production`

### Using Environment Config in Services

The `ScheduleService` reads the environment config:

```typescript
import { environment } from "../../environments/environment";

@Injectable()
export class ScheduleService {
  private apiUrl = environment.apiUrl;

  async getReservations() {
    const response = await fetch(`${this.apiUrl}/reservations`);
    return response.json();
  }

  async checkIn(reservationId: string) {
    const response = await fetch(`${this.apiUrl}/reservations/${reservationId}/checkin`, {
      method: "POST",
    });
    return response.json();
  }
}
```

### Switching Environments

| Command                                       | Environment | Notes                        |
| --------------------------------------------- | ----------- | ---------------------------- |
| `npm start`                                   | Development | Localhost, dev proxy enabled |
| `npm run build`                               | Development | Debug build with dev config  |
| `npm run build -- --configuration=production` | Production  | Railway backend URL          |

## Building for Production

### 1. Update Production Environment

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-production-backend-url.com",
};
```

### 2. Build Production Web Assets

```bash
npm run build -- --configuration=production
```

### 3. Sync to Android

```bash
npx cap sync android
```

### 4. Build APK in Android Studio

```bash
npx cap open android
```

Then in Android Studio:

1. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Choose **Release** build type
3. Sign with your keystore (or create a new one)
4. APK location: `android/app/build/outputs/apk/release/`

## Troubleshooting

### Issue: Dev Server Won't Start

**Error:** `npm start` fails or hangs

**Solutions:**

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Kill any process on port 4200:
   ```bash
   lsof -i :4200
   kill -9 <PID>
   ```
3. Clear Angular cache:
   ```bash
   rm -rf .angular/cache
   ```

### Issue: API Calls Return 404

**Error:** `404 Not Found` from `/api/reservations`

**Solutions:**

1. **Verify backend is running:**

   ```bash
   curl http://localhost:8080/api/reservations
   ```

   Should return a list (even if empty)

2. **Check proxy configuration:**
   - Verify `proxy.conf.json` exists in project root
   - Verify `angular.json` has `"proxyConfig": "proxy.conf.json"`
   - Restart dev server: `npm start`

3. **Verify dev server is intercepting requests:**
   - Open browser DevTools → Network tab
   - Look at request URL (should show `localhost:4200/api/reservations`)
   - Response should come from backend

4. **Check API URL in service:**
   ```typescript
   console.log(environment.apiUrl); // Should be 'http://localhost:4200/api'
   ```

### Issue: "Capacitor not found"

**Error:** `command not found: capacitor`

**Solution:** Install Capacitor locally and use npx:

```bash
npm install @capacitor/core @capacitor/cli
npx cap --version
```

### Issue: Gradle Errors During Build

**Error:** `Gradle build failed`

**Solutions:**

1. Check JDK version:
   ```bash
   java -version  # Should be 17+
   ```
2. Clear Gradle cache:
   ```bash
   rm -rf android/.gradle
   ```
3. Use Android Studio → Build > Clean Project

### Issue: "Cannot find adb"

**Error:** `adb: command not found`

**Solution:**

1. Set `ANDROID_SDK_ROOT`:
   ```bash
   export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
   ```
2. Add to PATH permanently (edit `~/.zshrc`):
   ```bash
   export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
   ```
3. Verify: `adb --version`

### Issue: Device Not Showing in `adb devices`

**Solutions:**

1. **Enable USB Debugging** on device:
   - Settings → Developer Options → USB Debugging
2. **Reconnect USB** cable
3. **Authorize computer** (prompt should appear on device)
4. **Restart adb:**
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Issue: "localhost" doesn't work on Android device

**Context:** When running on a physical device or emulator, `localhost` refers to the device itself, not your computer.

**Solutions:**

1. **For emulator:** Use `10.0.2.2` (special IP that points to host machine):

   ```typescript
   // In environment.prod.ts for emulator testing
   apiUrl: "http://10.0.2.2:8080";
   ```

2. **For physical device:** Use your computer's local IP:

   ```bash
   # Find your IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # E.g., 192.168.1.100

   // In your service
   apiUrl: 'http://192.168.1.100:8080'
   ```

3. **Best Practice:** Let production environment override:
   ```typescript
   // environment.prod.ts
   export const environment = {
     production: true,
     apiUrl: "https://your-production-backend.railway.app",
   };
   ```

### Issue: Live Reload Not Working

**Error:** Changes to code don't reflect on device

**Solutions:**

1. Ensure you're running with live reload:
   ```bash
   ionic cap run android -l --external
   ```
2. Check that file is being saved (VS Code shows no dot indicator)
3. Check terminal for compilation errors
4. Rebuild if needed:
   ```bash
   npm run build
   npx cap sync android
   ionic cap run android -l --external
   ```

### Issue: "This project contains a Vercel configuration"

This is informational (not an error). The project uses Vercel for deployment. No action needed for local development.

## NPM Scripts Reference

| Script                                | Purpose                                             |
| ------------------------------------- | --------------------------------------------------- |
| `npm start`                           | Start dev server on localhost:4200 with proxy       |
| `npm run build`                       | Build production web assets                         |
| `npm run test`                        | Run unit tests                                      |
| `npm run lint`                        | Run code linter                                     |
| `npx cap sync`                        | Sync web assets to native platforms                 |
| `npx cap open android`                | Open Android Studio with native project             |
| `ionic cap run android`               | Build and run on device/emulator                    |
| `ionic cap run android -l --external` | Run with live reload (auto-refresh on code changes) |

## Additional Resources

- [Ionic Documentation](https://ionicframework.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Android Debugging Guide](https://developer.android.com/studio/debug)
- [React App Connection Guide](#how-the-proxy-works)

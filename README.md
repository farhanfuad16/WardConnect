# WardConnect

WardConnect is a community reporting and emergency-response platform for connecting residents with their local ward. Residents can report civic issues, send SOS alerts, follow incidents, find community resources, receive notices, and volunteer. Administrators manage incidents, notices, resources, volunteers, and operational analytics from a separate dashboard.

## What it includes

- **Resident app** — Expo / React Native app for Android, iOS, and web.
- **Issue reporting** — Create and track local reports with category, severity, location details, and optional image uploads.
- **SOS alerts** — Send urgent alerts with location and supporting information.
- **Local information** — Browse incidents, notices, resources, notifications, and ward data.
- **Volunteer coordination** — Residents can submit volunteer interest; admins can review it.
- **Admin dashboard** — A React/Vite dashboard for managing incidents, notices, resources, and volunteers, with analytics.
- **REST API** — Express API with JWT authentication, role-based admin access, MySQL persistence through Drizzle ORM, and Cloudinary image uploads.

## Tech stack

| Area | Technologies |
| --- | --- |
| Mobile & web client | Expo, React Native, Expo Router, TypeScript, NativeWind |
| API | Node.js, Express, TypeScript, JWT, Zod |
| Database | MySQL, Drizzle ORM |
| Admin dashboard | React, Vite, React Router, Recharts |
| Media uploads | Cloudinary |

## Project structure

```text
app/             Expo Router screens and navigation
admin/           Admin dashboard (React + Vite)
server/          Express API, routes, middleware, and services
drizzle/         Database schema and migrations
hooks/           Shared React hooks
lib/             API client and application utilities
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- pnpm 9 or newer
- MySQL 8 or newer
- Optional: a Cloudinary account for image uploads

### 1. Clone and install dependencies

```bash
git clone https://github.com/farhanfuad16/WardConnect.git
cd WardConnect
pnpm install
```

### 2. Configure environment variables

Copy the example file and update it with your local credentials.

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=mysql://user:password@localhost:3306/wardconnect
JWT_SECRET=use-a-long-random-secret-of-at-least-32-characters
PORT=3000
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

For image uploads, also configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### 3. Create the database and run migrations

Create an empty MySQL database named `wardconnect`, then run:

```bash
pnpm db:push
```

### 4. Start the resident app and API

```bash
pnpm dev
```

This starts the API (normally on `http://localhost:3000`) and Expo/Metro for the app. Open the Expo interface in a browser or scan its QR code with Expo Go.

To start only one service:

```bash
pnpm dev:server  # API server
pnpm dev:metro   # Expo app
```

### 5. Start the admin dashboard (optional)

In another terminal:

```bash
cd admin
npm install
npm run dev
```

The dashboard uses the same API. Ensure the API is running and that you sign in with an account marked as an administrator.

## Common commands

```bash
pnpm dev       # Run API and Expo together
pnpm check     # Type-check the project
pnpm lint      # Run Expo linting
pnpm test      # Run tests
pnpm db:push   # Generate and apply Drizzle migrations
pnpm android   # Open the app on Android
pnpm ios       # Open the app on iOS
```

## API overview

The API health check is available at:

```text
GET /api/health
```

Core endpoint groups include:

- `/api/auth` — registration, login, logout, current user, and wards
- `/api/issues` — civic issue reports
- `/api/sos` — emergency alerts
- `/api/incidents` — ward incidents
- `/api/resources` — local resources and contacts
- `/api/notices` — public notices
- `/api/notifications` — user notifications
- `/api/volunteers` — volunteer applications
- `/api/uploads/image` — authenticated image uploads
- `/api/analytics/summary` — administrator analytics

See [server/README.md](server/README.md) for request examples and API setup details.

## Administrator access

Administrator-only actions are protected by the `isAdmin` flag on a user. For local development, promote a user directly in MySQL:

```sql
UPDATE users SET isAdmin = 1 WHERE email = 'admin@example.com';
```

Log in again afterward so the application uses a fresh session.

## Contributing

1. Fork the repository and create a feature branch.
2. Make focused changes and run `pnpm check`, `pnpm lint`, and `pnpm test`.
3. Open a pull request with a clear summary of the change.

## License

This project does not currently specify a license.

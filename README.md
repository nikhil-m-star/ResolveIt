# ResolveIt

ResolveIt is an AI-assisted civic issue reporting and resolution platform. Citizens can report infrastructure problems with evidence, officers can triage and resolve them, and city leadership can monitor operational health through dashboards, SLA tracking, and rankings.

## Features

- Citizen issue reporting with image uploads and map pinning
- AI-assisted category detection, intensity scoring, ETA estimation, and duplicate detection
- Voting and discussion on reported issues
- Officer workflow with drag-and-drop Kanban board
- Admin command center with city-level insights and exports
- SLA breach detection with scheduled checks and notifications
- Leaderboard and tiering system for community participation
- Clerk-based sign-in with internal API session syncing

## Tech Stack

### Frontend

- React 19 + Vite
- Tailwind CSS + custom glassmorphism theme
- Framer Motion
- TanStack Query
- Clerk React SDK
- Leaflet / React Leaflet
- Recharts

### Backend

- Node.js + Express
- Prisma ORM + PostgreSQL (Neon compatible)
- JWT + cookie-based API session support
- Clerk backend SDK
- Cloudinary for media uploads
- Resend for email alerts
- NVIDIA API for AI workflows
- node-cron for SLA routines

## Project Structure

```text
Resolve It/
	client/                 # React frontend
		src/
			components/         # Layout and UI building blocks
			pages/              # Route-level screens
			hooks/              # React Query hooks
			lib/                # API/auth wrappers
	server/                 # Express backend
		src/
			controllers/        # Route handlers
			routes/             # API route modules
			middleware/         # Auth and upload middleware
			services/           # AI + SLA service logic
			lib/                # Prisma/email/infra wrappers
		prisma/
			schema.prisma       # Data model
			seed.js             # Seed script
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database
- Clerk project keys
- Cloudinary credentials

### 1) Clone and install

```bash
git clone <your-repo-url>
cd "Resolve It"

cd client && npm install
cd ../server && npm install
```

### 2) Configure environment

Create `server/.env`:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
PORT=5000
FRONTEND_URL="http://localhost:5173"

JWT_SECRET="your-strong-jwt-secret"
CLERK_SECRET_KEY="sk_live_or_test_..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

RESEND_API_KEY="re_..."
NVIDIA_API_KEY="nvapi-..."
```

Create `client/.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_live_or_test_..."
VITE_API_URL="http://localhost:5000/api"
```

### 3) Prepare database

From `server/`:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 4) Run locally

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

App: `http://localhost:5173`  
API health: `http://localhost:5000/api/health`

## Scripts

### Client (`client/package.json`)

- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run lint` - ESLint checks
- `npm run preview` - Preview production build

### Server (`server/package.json`)

- `npm run dev` - Start API with nodemon
- `npm run start` - Start API in production mode
- `npm run test` - Placeholder test script
- Prisma seed - `node prisma/seed.js`

## Authentication and Session Flow

- User signs in via Clerk on frontend
- Frontend exchanges Clerk token at `POST /api/auth/session`
- Backend validates Clerk token and sets/uses internal API session context
- Protected routes use server-side auth middleware

Note: Frontend is configured with `withCredentials: true` for cookie-compatible API calls.

## Core API Route Groups

- `/api/health`
- `/api/auth`
- `/api/issues`
- `/api/users`
- `/api/admin`
- `/api/notifications`
- `/api/ratings`

## Deployment

### Frontend (Vercel)

- Build command: `npm run build`
- Output dir: `dist`
- SPA rewrite is configured in `client/vercel.json`

### Backend (Render)

- Start command: `npm run start`
- Health check endpoint: `/api/health`
- Ensure `FRONTEND_URL` matches deployed frontend domain

## Monitoring

If deployed on Render at `https://resolveit-cyhu.onrender.com`, use this uptime URL:

- `https://resolveit-cyhu.onrender.com/api/health`

## Troubleshooting

- CORS errors:
	- Verify `FRONTEND_URL` in server env
	- Confirm frontend `VITE_API_URL` points to `/api` base
- Clerk auth issues:
	- Ensure publishable and secret keys are from same Clerk app
- Prisma connection issues:
	- Validate `DATABASE_URL` and `DIRECT_URL`
	- Re-run `npx prisma generate`
- Image upload failures:
	- Validate Cloudinary credentials and unsigned payload settings
- Missing AI outputs:
	- Check `NVIDIA_API_KEY`

## Security Notes

- Never commit `.env` files
- Use a strong `JWT_SECRET` in all environments
- Keep rate limiting enabled on auth endpoints

## Contributing

1. Fork and create a feature branch
2. Make focused changes
3. Run lint/build checks
4. Open a PR with clear scope and screenshots for UI changes

## License

This project currently ships with no explicit open-source license file. Add a `LICENSE` file before public distribution to clarify usage rights.

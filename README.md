# HistoRando Admin Dashboard

Admin dashboard for managing the HistoRando application - a historical tourism and treasure hunt platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 🌐 Production Setup

### Backend Configuration

The dashboard is configured to use the production backend:

```
https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

This is set in `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

### Admin Credentials

See `ADMIN_CREDENTIALS.md` for login credentials and setup instructions.

⚠️ **Important**: The backend auth endpoints currently need to be fixed. See `BACKEND_SETUP.md` for troubleshooting.

### Testing Backend Connection

Run the included test script to verify backend connectivity:

```bash
./test-backend.sh
```

This will test:
- Health check endpoint
- Authentication protection
- Login endpoint
- Registration endpoint

## 📱 Features

- **User Management**: View and manage app users
- **Parcours Management**: Create and edit historical routes
- **POI Management**: Manage Points of Interest
- **Quiz Management**: Create quizzes for routes
- **Podcast Management**: Manage audio guides
- **Treasure Hunts**: Configure treasure hunt challenges
- **Rewards System**: Manage user rewards

## 🏗️ Project Structure

```
admin-dashboard/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── users/          # User management
│   │   ├── parcours/       # Route management
│   │   ├── poi/            # POI management
│   │   ├── quizzes/        # Quiz management
│   │   ├── podcasts/       # Podcast management
│   │   ├── treasure-hunts/ # Treasure hunt management
│   │   └── rewards/        # Rewards management
│   ├── login/              # Authentication
│   └── layout.tsx          # Root layout
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api.ts              # Axios instance with auth
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with shadcn/ui components
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)

## 🔐 Authentication

The dashboard uses JWT-based authentication:

1. Login at `/login` with admin credentials
2. Token stored in localStorage
3. Automatically attached to all API requests via Axios interceptor
4. Protected routes redirect to login if unauthenticated

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

### Adding New Pages

1. Create page in `app/dashboard/[feature]/page.tsx`
2. Update navigation in `app/dashboard/layout.tsx`
3. Add API calls in `lib/api.ts` if needed

## 📚 Documentation

- `ADMIN_CREDENTIALS.md` - Admin login credentials and user setup
- `BACKEND_SETUP.md` - Backend troubleshooting and setup guide
- `test-backend.sh` - Automated backend testing script

## 🐛 Troubleshooting

### Cannot login

1. Check backend is running: `curl https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1/health`
2. Run test script: `./test-backend.sh`
3. See `BACKEND_SETUP.md` for backend fixes

### API errors

1. Check browser console for detailed error messages
2. Verify token in localStorage
3. Check network tab for request/response details

### Build errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: Production backend URL

### Other Platforms

The app is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- Docker container

## 📝 License

Private project for HistoRando.

## 👥 Support

For issues or questions:
1. Check `BACKEND_SETUP.md` for backend issues
2. Review browser console logs
3. Run `./test-backend.sh` to diagnose connectivity

---

**Current Status**: ✅ Frontend ready | ⚠️ Backend auth needs fixing

Last updated: December 2, 2025

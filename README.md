# Digital Factory Events - Ticket Booking System

A modern ticket booking application for internal company events, built with Next.js, TypeScript, and Supabase.

## Features

- 🎫 **Event Management**: Browse and book tickets for internal company events
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📅 **Event Types**: Support for defined events (with tickets) and undefined events (with voting)
- 💳 **Booking System**: Complete booking flow with capacity management
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices
- 🎨 **Dark Theme**: Elegant dark mode interface

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ticket-booking-ui
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up your Supabase database:
   - Go to your Supabase project SQL Editor
   - Run the database schema SQL (see `SUPABASE_SETUP.md`)

6. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── events/            # Events listing and details
│   ├── my-tickets/        # User bookings
│   ├── checkout/          # Checkout flow
│   ├── profile/           # User profile
│   └── login/register/    # Authentication pages
├── components/            # React components
│   ├── ui/               # UI component library
│   └── ...               # Other components
├── lib/                  # Utilities and helpers
│   └── supabase/         # Supabase integration
│       ├── client.ts     # Supabase client
│       ├── api.ts        # API functions
│       ├── types.ts      # TypeScript types
│       └── utils.ts      # Utility functions
└── contexts/             # React contexts
    └── auth-context.tsx  # Authentication context
```

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles linked to auth.users
- `events` - Event information
- `event_enrollments` - Ticket bookings/enrollments
- `event_votes` - Votes for undefined events

See `SUPABASE_SETUP.md` for complete database setup instructions.

## Features

### Event Management
- View published events
- Filter and search events
- Event details with capacity tracking
- Support for defined and undefined event types

### Booking System
- Create enrollments with capacity validation
- View user bookings
- Payment status tracking
- Booking history (upcoming and past)

### Voting System
- Vote for undefined events during voting window
- View vote counts
- Prevent duplicate votes

### User Management
- Registration and login
- Profile management
- Role-based access (user, admin, superadmin)

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

- `SUPABASE_SETUP.md` - Complete Supabase setup guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `lib/supabase/README.md` - API reference

## License

Private - Internal use only



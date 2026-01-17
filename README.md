# CollabBot Admin Panel

A modern, responsive admin panel for CollabBot - a university mentorship platform connecting Juniors, Seniors, and Alumni.

## Features

- **Dashboard**: Real-time stats, charts, and activity feed
- **User Management**: Manage users with filtering and search
- **Job Posts**: Review and approve job postings
- **Reports**: Handle user reports and complaints
- **Events**: Create and manage platform events
- **Mentorships**: Monitor mentorship connections
- **Settings**: Admin profile and preferences

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Recharts (for data visualization)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/      # Layout components (Sidebar, Header)
│   ├── DataTable.tsx
│   ├── Modal.tsx
│   ├── StatCard.tsx
│   ├── StatusBadge.tsx
│   └── Toast.tsx
├── data/            # Mock data
├── lib/             # Utility functions
├── pages/           # Page components
├── types/           # TypeScript type definitions
└── App.tsx          # Main app component
```

## Build for Production

```bash
npm run build
```

## Future Integration

This admin panel is designed to connect with Supabase backend. Mock data is currently used for demonstration purposes.

## Design System

- **Primary Color**: Indigo/Violet (#6366F1)
- **Sidebar**: Dark theme (#1e1b4b)
- **Border Radius**: lg (0.75rem) and xl (1rem)
- **Shadows**: Soft shadows for depth
- **Typography**: Inter font family

## License

MIT

# GreenTrust Frontend

A modern, responsive React frontend for the GreenTrust agricultural marketplace application.

## Features

- **Authentication**: Login, registration, and OTP verification
- **Farmer Dashboard**: Manage harvest batches, create marketplace listings
- **Buyer Dashboard**: Browse marketplace, make inquiries
- **Marketplace**: Search and filter produce listings
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Socket.io integration for live notifications

## Tech Stack

- React 19
- React Router DOM 7
- Tailwind CSS 3
- Axios for API calls
- Vite for build tooling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Update `.env` with your backend API URL:
```
VITE_API_URL=http://localhost:3000/api
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Navbar.jsx      # Navigation bar
│   └── ProtectedRoute.jsx  # Route protection
├── context/            # React context providers
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── VerifyOTP.jsx   # OTP verification
│   ├── Marketplace.jsx # Marketplace listing
│   ├── farmer/         # Farmer-specific pages
│   │   ├── FarmerDashboard.jsx
│   │   └── BatchList.jsx
│   └── buyer/          # Buyer-specific pages
│       └── BuyerDashboard.jsx
├── services/           # API services
│   └── api.js          # Axios configuration
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend connects to the GreenTrust backend API. All API calls are made through the centralized `api.js` service which handles:

- JWT token management
- Automatic token refresh
- Request/response interceptors
- Error handling

## Authentication Flow

1. User registers with phone number, email, and password
2. OTP is sent to phone number
3. User verifies OTP
4. User can login with phone number and password
5. JWT tokens are stored in localStorage
6. Protected routes check authentication status

## User Roles

- **Farmer**: Can create batches, list produce, manage listings
- **Buyer**: Can browse marketplace, make inquiries, view recommendations

## Styling

The app uses Tailwind CSS with a custom green-themed color palette reflecting the agricultural nature of the platform. Key design principles:

- Clean, modern interface
- High contrast for readability
- Responsive grid layouts
- Smooth transitions and hover effects
- Accessible form controls

## License

MIT

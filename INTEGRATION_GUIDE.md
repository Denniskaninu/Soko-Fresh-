# GreenTrust - Frontend & Backend Integration Guide

## Quick Start

### Backend Setup
1. Navigate to the project root:
```bash
cd /tmp/cc-agent/59286914/project
```

2. Install dependencies and run migrations:
```bash
npm install
npm run migrate
npm run seed
```

3. Start the backend server:
```bash
npm start
```
Backend will run on http://localhost:3000

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL in `.env`:
```bash
VITE_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:
```bash
npm run dev
```
Frontend will run on http://localhost:5173

## Testing the Integration

### 1. User Registration Flow
- Visit http://localhost:5173
- Click "Sign up"
- Choose user type (Farmer or Buyer)
- Fill in the registration form
- Submit and wait for OTP (check backend logs for OTP code)
- Enter OTP on verification page
- Login with credentials

### 2. Farmer Workflow
After logging in as a farmer:
- View dashboard at `/farmer/dashboard`
- See batch statistics and recent data
- Navigate to "My Batches" to view all harvest batches
- Create new batches (backend integration complete)
- List batches on marketplace

### 3. Buyer Workflow
After logging in as a buyer:
- View dashboard at `/buyer/dashboard`
- See inquiry statistics and recommendations
- Browse marketplace at `/marketplace`
- Filter and search for produce
- View listing details
- Make inquiries (backend integration complete)

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Farmer
- `GET /api/farmer/dashboard` - Get dashboard data
- `GET /api/farmer/profile` - Get farmer profile
- `PUT /api/farmer/profile` - Update farmer profile
- `GET /api/farmer/batches` - Get all batches
- `POST /api/farmer/batches` - Create new batch
- `GET /api/farmer/batches/:id` - Get batch details
- `PUT /api/farmer/batches/:id` - Update batch
- `DELETE /api/farmer/batches/:id` - Delete batch
- `GET /api/farmer/listings` - Get farmer listings
- `POST /api/farmer/listings` - Create listing
- `PUT /api/farmer/listings/:id` - Update listing

### Buyer
- `GET /api/buyer/dashboard` - Get dashboard data
- `GET /api/buyer/profile` - Get buyer profile
- `PUT /api/buyer/profile` - Update buyer profile
- `GET /api/buyer/inquiries` - Get buyer inquiries
- `POST /api/buyer/inquiries` - Create inquiry

### Marketplace
- `GET /api/marketplace/listings` - Get all listings
- `GET /api/marketplace/listings/:id` - Get listing details
- `POST /api/marketplace/listings/:id/view` - Increment views

## Environment Variables

### Backend (.env in project root)
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/greentrust
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
```

### Frontend (.env in frontend directory)
```env
VITE_API_URL=http://localhost:3000/api
```

## CORS Configuration

The backend is already configured to accept requests from the frontend. If you change ports, update the CORS settings in `server.js`.

## Authentication Flow

1. **Registration**:
   - User submits registration form
   - Backend creates user and sends OTP
   - Frontend redirects to OTP verification
   - User enters OTP
   - Backend verifies and activates account

2. **Login**:
   - User submits phone number and password
   - Backend validates credentials
   - Backend returns access token and refresh token
   - Frontend stores tokens in localStorage
   - Frontend redirects to appropriate dashboard

3. **Token Refresh**:
   - When access token expires (401 response)
   - Frontend automatically calls refresh-token endpoint
   - New tokens are stored
   - Original request is retried

4. **Logout**:
   - User clicks logout
   - Frontend calls logout endpoint
   - Tokens are removed from localStorage
   - User is redirected to login page

## Troubleshooting

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check VITE_API_URL in frontend .env
- Check browser console for CORS errors

### OTP not received
- Check backend console logs for generated OTP
- Ensure SMS service is configured (if using real SMS)
- Use console OTP for development

### Authentication errors
- Clear localStorage in browser
- Ensure JWT secrets are set in backend .env
- Check if user is verified (completed OTP verification)

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend .env
- Run migrations: `npm run migrate`

## Production Deployment

### Backend
1. Build: Not required (Node.js app)
2. Set production environment variables
3. Run migrations on production database
4. Use process manager like PM2
5. Configure reverse proxy (nginx)

### Frontend
1. Build production bundle:
```bash
cd frontend
npm run build
```
2. Serve `dist` folder with nginx or similar
3. Update VITE_API_URL to production backend URL
4. Enable HTTPS for secure token transmission

## File Structure Overview

```
project/
├── backend/
│   ├── server.js                 # Express server
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Route handlers
│   │   ├── models/              # Database models
│   │   ├── middleware/          # Auth, validation
│   │   └── services/            # Business logic
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/          # Reusable components
    │   ├── context/             # React context
    │   ├── pages/               # Page components
    │   ├── services/            # API service
    │   ├── App.jsx              # Main app
    │   └── main.jsx             # Entry point
    ├── public/
    ├── dist/                    # Production build
    └── package.json
```

## Support & Resources

- Backend API Documentation: `/API_DOCUMENTATION.md`
- Frontend README: `/frontend/README.md`
- Implementation Summary: `/FRONTEND_SUMMARY.md`

## Next Development Steps

1. Add Socket.io for real-time updates
2. Implement file upload for product images
3. Add map integration for farmer locations
4. Build notification center
5. Add analytics and reporting features
6. Implement payment integration
7. Add review and rating system
8. Create admin panel

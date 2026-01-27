# Megzed Web - Frontend

Modern web application for Megzed marketplace with authentication using Laravel API and Firebase.

## Features

- Email/Password Authentication
- Google Social Login via Firebase
- Phone OTP Authentication via Firebase
- JWT Token Management
- User Registration with Profile Information
- Protected Routes
- Responsive Design with Tailwind CSS
- Modern UI/UX

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Firebase Authentication
- Lucide React Icons

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication methods:
   - Google Sign-In
   - Phone Authentication
4. Get your Firebase configuration from Project Settings
5. Update `.env` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Laravel API Configuration

The application connects to your Laravel API at `https://api.megzed.com/api/v1`

Ensure your Laravel backend:
- Has CORS properly configured to allow requests from your frontend domain
- JWT authentication is set up (Tymon/JWTAuth)
- Social login endpoint (`/social-login`) accepts Firebase tokens
- All API endpoints from your routes file are accessible

### 4. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

Built files will be in the `dist` folder.

## Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── contexts/
│   └── AuthContext.tsx      # Authentication context and hooks
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Register.tsx        # Registration page
│   └── Home.tsx            # Protected home page
├── services/
│   └── api.ts              # API service for Laravel backend
├── App.tsx                 # Main app with routing
└── main.tsx               # Entry point
```

## Documentation

- Payments and gateways overview: `docs/payments.md`

## Authentication Flow

### Email/Password Login
1. User enters email and password
2. App calls Laravel `/login` endpoint
3. JWT token received and stored
4. User redirected to home

### Registration
1. User fills registration form with profile details
2. App calls Laravel `/register` endpoint
3. JWT token received and stored
4. User redirected to home

### Google Login
1. User clicks "Sign in with Google"
2. Firebase handles Google authentication
3. App receives Firebase ID token
4. Token sent to Laravel `/social-login` endpoint
5. Laravel validates token and creates/logs in user
6. JWT token received and stored
7. User redirected to home

### Phone OTP Login
1. User enters phone number with country code
2. Firebase sends OTP
3. User enters OTP code
4. Firebase validates OTP
5. App receives Firebase ID token
6. Token sent to Laravel `/social-login` endpoint
7. JWT token received and stored
8. User redirected to home

## API Integration

All API calls are handled through the `ApiService` class in `src/services/api.ts`:

- `login(credentials)` - Email/password login
- `register(data)` - User registration
- `socialLogin(data)` - Firebase social login
- `getProfile()` - Get user profile (with JWT)

JWT tokens are automatically included in authenticated requests via the `Authorization: Bearer {token}` header.

## Environment Variables

Required environment variables in `.env`:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Supabase (pre-configured)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Laravel Backend Requirements

Your Laravel API should handle these endpoints:

- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login
- `POST /api/v1/social-login` - Social/Firebase login
- `GET /api/v1/profile` - Get user profile (protected)

Expected response format for authentication endpoints:

```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_photo_url": "https://...",
    "is_verified": false,
    "kyc_status": "not_submitted"
  }
}
```

## Security Notes

- JWT tokens are stored in localStorage
- Firebase handles all social authentication securely
- All passwords are sent over HTTPS to Laravel API
- Laravel validates and hashes passwords server-side
- Phone OTP uses Firebase's secure verification

## Styling

The application uses a modern, clean design with:
- Slate gray and blue color scheme (no purple!)
- Gradient backgrounds
- Smooth transitions and hover effects
- Responsive layouts
- Professional shadows and borders

## Next Steps

After login/registration is working, you can:
- Add more pages (Items, Shops, Profile, etc.)
- Implement marketplace features
- Add chat functionality
- Integrate wallet and payments
- Build admin dashboard

## Support

For issues with:
- Frontend: Check browser console for errors
- Firebase: Verify configuration and enabled auth methods
- API: Check Laravel logs and CORS settings
- CORS: Ensure Laravel allows your frontend domain

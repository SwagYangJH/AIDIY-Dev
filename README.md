# AIDIY - AI-Powered DIY Learning Platform

A modern family learning platform with Google OAuth authentication, parent-child account management, and task system.

## Project Overview

AIDIY is a full-stack web application with React frontend and Flask backend, designed to provide interactive learning experiences for families.

### Key Features

- **Multiple Login Methods**: Google OAuth, email/password, and 4-digit kid login
- **Family Account Management**: Support for parent and child profiles
- **Task System**: Task assignment and completion tracking
- **Reward System**: Virtual currency accumulation
- **Responsive Design**: Mobile and desktop support
- **Modern UI**: Built with Twind (Tailwind-in-JS)

## Quick Start

### Prerequisites

- Node.js (v16+ recommended)
- Python (v3.9+ recommended)
- npm or yarn

### Installation and Setup

#### 1. Clone the Project

```bash
git clone <your-repo-url>
cd AIDIY-Dev
```

#### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

#### 3. Install Backend Dependencies

```bash
cd ..
pip install -r requirements.txt
```

#### 4. Start Backend Server

```bash
python app.py
```

Backend will run on `http://localhost:5500`

#### 5. Start Frontend Server

```bash
cd client
npm start
```

Frontend will run on `http://localhost:3000`

## Project Structure

```
AIDIY-Dev/
├── client/                 # React Frontend Application
│   ├── public/            # Static Files
│   ├── src/               # Source Code
│   └── package.json       # Frontend Dependencies
├── app.py                 # Flask Backend Main File
├── requirements.txt       # Python Dependencies
└── README.md             # Project Documentation
```

## File Descriptions

### Backend Files

#### `app.py`

Main Flask server file containing:

- **Google OAuth Authentication**: Verify Google login tokens
- **User Management API**: Registration, login, user information
- **Child Account API**: 4-digit code login system
- **OTP Verification**: Email verification code sending and validation
- **JWT Token Management**: User session management
- **CORS Configuration**: Cross-origin request support

Main API Endpoints:

- `POST /auth/google` - Google OAuth login
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/kid-login` - Child digit code login
- `GET /api/users/profile` - Get user information
- `POST /api/users/children` - Add child profile

#### `requirements.txt`

Python backend dependency list:

- `Flask` - Web framework
- `Flask-CORS` - Cross-origin resource sharing
- `google-auth` - Google authentication
- `PyJWT` - JWT token processing

### Frontend Files

#### `client/public/`

##### `index.html`

Main HTML template file containing:

- Google Identity Services SDK integration
- Responsive viewport settings
- Basic application metadata

##### `manifest.json`

PWA configuration file defining:

- Application name and icons
- Theme colors
- Display mode

#### `client/src/`

##### Main Components

###### `App.js`

Application root component configuring:

- React Router route setup
- Redux Store provider
- Twind CSS-in-JS configuration
- Main page routing

###### `index.js`

Application entry file responsible for:

- React application mounting
- Redux store initialization
- Root component rendering

##### Page Components

###### `components/HomePage.jsx`

Home page component featuring:

- Brand showcase and introduction
- Login option display
- Responsive navigation
- Feature highlights

###### `components/LoginPage.jsx`

Login page supporting:

- Google OAuth one-click login
- Email/password authentication
- 4-digit child login
- Form validation and error handling

###### `components/OTPVerification.jsx`

OTP verification page including:

- Verification code input interface
- Automatic focus switching
- Resend verification code functionality
- Verification status feedback

###### `components/ForgotPassword.jsx`

Password reset page providing:

- Email verification
- OTP verification flow
- New password setup
- Multi-step form

###### `components/ProfilePage.jsx`

User profile page featuring:

- Parent and child profile management
- Add/edit profiles
- Account statistics
- Secure logout functionality

##### State Management

###### `store/store.js`

Redux store configuration:

- Middleware setup
- Reducer combination
- Development tools integration

###### `store/authSlice.js`

Authentication state management:

- User login/logout state
- Token management
- User information storage

##### Style Configuration

###### `twind.config.js`

Twind CSS-in-JS configuration:

- Custom color theme
- Responsive breakpoints
- Animation effects
- Font settings

##### Configuration Files

###### `package.json`

Frontend project configuration:

- React application dependencies
- Script commands
- Development tools configuration

Main Dependencies:

- `react` - Frontend framework
- `react-router-dom` - Route management
- `@reduxjs/toolkit` - State management
- `@twind/core` - CSS-in-JS solution

## Configuration

### Google OAuth Setup

1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Identity API
3. Create OAuth 2.0 Client ID
4. Update `CLIENT_ID` in `app.py`

### Port Configuration

- Backend: `localhost:5500`
- Frontend: `localhost:3000`

If port conflicts occur, modify:

- Backend: Change port parameter in last line of `app.py`
- Frontend: Add PORT environment variable in package.json

## Development Guide

### Adding New Features

1. Backend API: Add new routes in `app.py`
2. Frontend Components: Create new components in `client/src/components/`
3. State Management: Add new slices in `store/`

### Style Development

Project uses Twind CSS-in-JS, use in components:

```javascript
import { tw } from '@twind/core';
// Usage
className={tw('bg-blue-500 text-white p-4')}
```

### API Calls

Frontend communicates with backend via fetch API:

```javascript
const response = await fetch('http://localhost:5500/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Find process using the port
   lsof -i :5500
   # Kill the process
   kill -9 <PID>
   ```
2. **Dependency Installation Failed**

   ```bash
   # Clear npm cache
   npm cache clean --force
   # Remove node_modules and reinstall
   rm -rf node_modules && npm install
   ```
3. **Python Dependency Issues**

   ```bash
   # Use virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

# Authentication Integration Guide

## Overview
This guide explains how to integrate automatic login between the main ZP Chandrapur application and the E-estimate application using shared Supabase authentication.

## Implementation in E-estimate Application

### 1. Copy the Auth Receiver Utility
Copy the `src/utils/authReceiver.ts` file to your E-estimate application.

### 2. Initialize Auto-Login in E-estimate App
Add this to your main App component or entry point:

```typescript
// In your E-estimate App.tsx or main component
import { useEffect } from 'react';
import { initializeAuthReceiver } from './utils/authReceiver';

function App() {
  useEffect(() => {
    // Initialize auth receiver when app loads
    initializeAuthReceiver();
  }, []);

  // Rest of your app code...
}
```

### 3. Alternative: Check in Auth Guard
If you have an authentication guard or login page, you can check there:

```typescript
// In your login component or auth guard
import { handleAutoLogin } from './utils/authReceiver';

const LoginPage = () => {
  useEffect(() => {
    const checkAutoLogin = async () => {
      const success = await handleAutoLogin();
      if (success) {
        // Redirect to dashboard or main app
        navigate('/dashboard');
      }
    };
    
    checkAutoLogin();
  }, []);

  // Rest of login component...
};
```

## How It Works

### Method 1: URL Parameters (Fallback)
- Main app passes auth tokens via URL parameters
- E-estimate app reads and uses them to set Supabase session
- URL is cleaned after successful login

### Method 2: localStorage Transfer (Primary)
- Main app stores auth data in localStorage temporarily
- E-estimate app reads and uses the data
- Data is automatically cleaned up after use

## Security Considerations

1. **localStorage Method**: More secure as tokens aren't visible in URL
2. **Automatic Cleanup**: Auth data is removed after 10 seconds or successful use
3. **Source Verification**: Checks that auth data comes from the main app
4. **Error Handling**: Graceful fallback to normal login if auto-login fails

## Testing

1. Login to main ZP Chandrapur application
2. Click on E-estimate card
3. E-estimate should open in new tab and automatically log you in
4. If auto-login fails, normal login page should appear

## Configuration

Update the E-estimate URL in the main application:
```typescript
// In Dashboard.tsx, update this line:
const estimateUrl = 'https://your-actual-estimate-url.com';
```

## Troubleshooting

1. **Auto-login not working**: Check browser console for errors
2. **Session expired**: Main app session might be expired
3. **CORS issues**: Ensure both apps have proper CORS configuration
4. **Different domains**: localStorage won't work across different domains - use URL method only

## Same Domain Optimization

If both applications are on the same domain, you can use:
- Shared localStorage/sessionStorage
- Shared cookies
- Direct session sharing

This implementation provides a seamless user experience while maintaining security best practices.
# Railway Environment Variables Setup

## Required Environment Variables for WittyYeti-VG Project

### 1. DATABASE_URL
- **Value:** Your PostgreSQL connection URL from Railway
- **Example:** `postgresql://username:password@host:port/database`
- **Source:** Copy from PostgreSQL database "Connect" tab

### 2. JWT_SECRET
- **Value:** A secure random string for JWT token signing
- **Example:** `your-super-secret-jwt-key-2024`
- **Purpose:** Secures user session tokens

### 3. NODE_ENV
- **Value:** `production`
- **Purpose:** Enables production mode and SSL for database

### 4. PayPal Variables (Already Set)
- **PAYPAL_CLIENT_ID:** Your live PayPal Client ID
- **PAYPAL_CLIENT_SECRET:** Your live PayPal Secret Key

## How to Add in Railway:

1. Go to your WittyYeti-VG project
2. Click "Variables" tab
3. Click "New Variable" for each one
4. Add the variables above
5. Save changes

## Database Tables Will Be Created Automatically

The application will automatically create these tables when it starts:
- `users` - User accounts
- `user_skins` - Purchased skins
- `user_sessions` - Active sessions

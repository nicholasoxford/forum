# Solana Wallet Authentication Setup

This project uses Solana wallet authentication to protect routes and provide a secure user experience.

## Environment Variables

Make sure your `.env.local` file includes the following variables:

```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here # Generate with: openssl rand -hex 32
```

To generate a secure NEXTAUTH_SECRET, you can run:

```bash
openssl rand -hex 32
```

## Protected Routes

Routes that require authentication are defined in the `middleware.ts` file. Currently, these include:

- `/my-group-chats`
- `/launch`

You can add more protected routes by updating the `protectedRoutes` array in the middleware file.

## Usage

1. Connect your wallet using the wallet adapter
2. Sign in with your wallet by clicking the "Sign in with Wallet" button
3. Once authenticated, you can access protected routes and API endpoints

## Testing

Visit `/auth-test` to test the authentication flow and protected API endpoints.

## Components

The following components are available for authentication:

- `WalletAuth`: Main component for handling wallet authentication
- `AuthButton`: Simple button wrapper around WalletAuth

## API Endpoints

- `/api/auth/[...nextauth]`: NextAuth authentication API
- `/api/protected`: Example protected API endpoint that requires authentication
- `/api/auth/csrf`: Endpoint to get a CSRF token for signing in

## Authentication Flow

1. User connects their wallet
2. User clicks "Sign in with Wallet"
3. A CSRF token is fetched from the server
4. User signs a message containing the CSRF token
5. The signature is verified on the server
6. If valid, the user is authenticated and can access protected routes

## Middleware

The middleware automatically redirects unauthenticated users to the home page when they try to access protected routes.

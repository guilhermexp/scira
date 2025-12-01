import { createAuthClient } from 'better-auth/react';
// REMOVED for self-hosting: payment plugins disabled
// import { dodopaymentsClient } from '@dodopayments/better-auth';
// import { polarClient } from '@polar-sh/better-auth';
import { magicLinkClient } from 'better-auth/client/plugins';

// REMOVED for self-hosting: betterauthClient with dodopaymentsClient
// export const betterauthClient = createAuthClient({
//   baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8931',
//   plugins: [dodopaymentsClient()],
// });

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8931',
  // REMOVED polarClient() for self-hosting
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

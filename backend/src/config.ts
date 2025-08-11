import dotenv from 'dotenv';

// This line loads the variables from your .env file into process.env
dotenv.config();

export const config = {

    // The port the server will listen on.
    port: Number(process.env.PORT) || 3000,

    // The allowed origin for CORS requests.

    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // The duration in milliseconds to prevent re-matching skipped users.
    skipCooldownMs: Number(process.env.SKIP_COOLDOWN_MS) || 5 * 60 * 1000,
};
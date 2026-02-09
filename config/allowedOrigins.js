/**
 * Allowed origins for CORS
 * @type {string[]}
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite default
  "https://your-production-domain.com",
];

export default allowedOrigins;

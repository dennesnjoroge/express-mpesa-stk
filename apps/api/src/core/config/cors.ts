import cors from "cors";
const allowedOrigins = [
  "http://localhost:5173",
  "https://express-mpesa-stk.vercel.app",
];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
});

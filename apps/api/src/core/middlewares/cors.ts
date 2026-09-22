import cors from "cors";

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header, e.g. curl/Postman.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  credentials: true,

  optionsSuccessStatus: 204,
};

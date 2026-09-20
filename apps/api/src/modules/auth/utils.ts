// auth module utils
import crypto from "node:crypto";

export const generateVerificationToken = () => {
  const verificationTokenPublicId = crypto.randomUUID();

  const token = crypto.randomBytes(32).toString("base64url");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  return {
    verificationTokenPublicId,
    token,
    tokenHash,
    expiresAt,
  };
};

const ACCOUNTS_URL =
  process.env.NODE_ENV === "production"
    ? process.env.ACCOUNTS_URL
    : "http://localhost:5173";

export interface VerificationLinkParams {
  token: string;
  ref: string;
}

export const createVerificationLink = ({
  token,
  ref,
}: VerificationLinkParams): string => {
  const url = new URL("/verify-email", ACCOUNTS_URL);

  url.searchParams.set("token", token);
  url.searchParams.set("ref", ref);

  return url.toString();
};

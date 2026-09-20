import axios from "axios";

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const getAccessToken = async () => {
  try {
    const MPESA_CONSUMER_KEY = requireEnv("MPESA_CONSUMER_KEY");
    const MPESA_CONSUMER_SECRET = requireEnv("MPESA_CONSUMER_SECRET");
    const daraja_api_url = requireEnv("DARAJA_API_URL");
    //const daraja_api_url = process.env.NODE_ENV === "production" ? "" : "";

    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`,
    ).toString("base64");

    const response = await axios.get(
      `${daraja_api_url}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    const token = response?.data?.access_token;

    return token;
  } catch (error) {
    throw error;
  }
};

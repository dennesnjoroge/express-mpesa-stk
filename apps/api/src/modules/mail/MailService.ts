import { Resend } from "resend";
import { verificationEmailTemplate } from "./templates/verificationEmail.js";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is not configured");
}

const resend = new Resend(apiKey);

export interface SendVerificationEmailParams {
  to: string;
  firstName: string;
  verificationLink: string;
}

export class MailService {
  sendVerificationEmail = async ({
    to,
    firstName,
    verificationLink,
  }: SendVerificationEmailParams): Promise<string> => {
    const from =
      process.env.MAIL_FROM ?? "Loft Technologies<noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Verify your account",
      html: verificationEmailTemplate({ firstName, verificationLink }),
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  };
}

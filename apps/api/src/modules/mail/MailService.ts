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

export interface SendForgotPasswordParams {
  to: string;
  firstName: string;
  resetLink: string;
}

interface SendSubscriptionSuccessful {
  email: string;
  lastName: string;
  subscriptionId: string;
  planName: string;
  expiresAt: Date;
  amount: number;
}

interface SendSubscriptionCancelledEmail {
  email: string;
  lastName: string;
  subscriptionId: string;
  planName: string;
  expiresAt: Date;
}

interface SendPaymentFailedEmail {
  lastName: string;
  email: string;
  paymentId: string;
  planName: string;
  amount: number;
}

export class MailService {
  sendVerificationEmail = async ({
    to,
    firstName,
    verificationLink,
  }: SendVerificationEmailParams): Promise<string> => {
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

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

  sendForgotPassword = async ({
    to,
    firstName,
    resetLink,
  }: SendForgotPasswordParams): Promise<string> => {
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Forgot your password",
      html: ` <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2>Your password reset link</h2>

          <p>Hi ${firstName},</p>

          <p>
            Click the link below to reset your password.
          </p>

          <p>
           <a href="${resetLink}">
            Reset password
           </a>
          </p>

          <p>
            This link will expire in 30 minutes.
          </p>
        </div>`,
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  };

  async sendSubscriptionSuccessfulEmail(params: SendSubscriptionSuccessful) {
    const { email, lastName, subscriptionId, planName, expiresAt, amount } =
      params;
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Subscription successful",
      html: `
    <p>Hello ${lastName},</p>

    <p>
      Your ${planName} subscription has been successfully confirmed.
    </p>

    <p>
      Your subscription will expire on ${expiresAt}.
      After that date, your access will end.
    </p>

    <p>
      Subscription: ${subscriptionId}
    </p>

    <p>Amount: KES ${amount}</p>
  `,
    });

    if (error) {
      throw new Error(
        `Failed to send subscription confirmation email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }

  async sendPaymentFailedEmail(params: SendPaymentFailedEmail) {
    const { lastName, email, paymentId, planName, amount } = params;
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Payment unsuccessful",
      html: `
      <p>Hello ${lastName},</p>
      <p>We couldn't complete the payment for your ${planName} subscription.</p>
      <p>Amount: KES ${amount}</p>
      <p>
        Payment reference: ${paymentId}
      </p>
      <p>
      No subscription was activated from this payment.
      </p>
      <p>
      Please try again if you would like to continue.
      </p>
    `,
    });

    if (error) {
      throw new Error(
        `Failed to send subscription confirmation email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }

  async sendSubscriptionCancelledEmail(params: SendSubscriptionCancelledEmail) {
    const { lastName, email, subscriptionId, planName, expiresAt } = params;
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Subscription cancelled",
      html: `
      <p>Hello ${lastName},</p>
      <p>Your ${planName} subscription has been cancelled.</p>
      <p>Your subscription remains active until ${expiresAt}. After that date, your access will end.</p>
      <p>
        Subscription: ${subscriptionId}
      </p>
      <p>
      If you cancelled this by mistake, you can purchase a new subscription from your account.
      </p>
    `,
    });

    if (error) {
      throw new Error(
        `Failed to send subscription confirmation email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }

  async sendWelcome(email: string, firstName: string) {
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Welcome to Payflow",
      html: `
      <p>Hello ${firstName},</p>

      <p>
        Welcome to Payflow!
      </p>

      <p>
       Your account has been successfully created. We're glad to have you with us.
      </p>

      <p>Payflow Team</p>
    `,
    });

    if (error) {
      throw new Error(
        `Failed to send account deletion email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }

  async sendAccountDataExport(email: string, firstName: string, pdf: any) {
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Your Payflow account data",
      html: `
      <p>Hello ${firstName},</p>
      <p>
      Your account data is attached to this email.
      </p>
        <p>
        Your account deletion will now be completed.
      </p>

       <p>
      This is an automated email. Do not reply.
      </p>
    `,
      attachments: [
        {
          filename: "account-data.pdf",
          content: pdf,
        },
      ],
    });

    if (error) {
      throw new Error(
        `Failed to send subscription confirmation email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }

  async sendAccountDeleted(email: string, firstName: string) {
    const from = process.env.MAIL_FROM ?? "Payflow <noreply@mail.loft.co.ke>";

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Account deleted",
      html: `
      <p>Hello ${firstName},</p>

      <p>
        Your Payflow Technologies account has been successfully deleted.
      </p>

      <p>
        Your account data has been permanently removed in accordance with our
        account deletion process.
      </p>
    `,
    });

    if (error) {
      throw new Error(
        `Failed to send account deletion email: ${error.message}`,
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email ID");
    }

    return data.id;
  }
}

export const mailService = new MailService();

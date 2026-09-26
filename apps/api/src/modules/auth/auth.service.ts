import { ApiError } from "../../core/errors/api-error.js";
import { AuthRepository } from "./auth.repository.js";
import { pool, requireEnv } from "../../core/config/db.js";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { MailService } from "../mail/MailService.js";
import { createVerificationLink } from "./utils.js";
import type { LoginParams, RegisterParams } from "./types.js";
import jwt from "jsonwebtoken";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";
import { PaymentRepository } from "../payments/payment.repository.js";
import { generateUserDataPdf } from "./pdf-kit.js";

const authRepository = new AuthRepository();
const mailService = new MailService();
const subscriptionRepository = new SubscriptionRepository();
const paymentRepository = new PaymentRepository();

export class AuthService {
  async register(params: RegisterParams) {
    const { firstName, lastName, emailAddress, password } = params;

    //find if email exists
    const existingUser = await authRepository.getByEmailAddress(emailAddress);

    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists.");
    }

    // hash password
    const passwordHash = await argon2.hash(password);

    const connection = await pool.getConnection();

    const userId = randomUUID();
    const verificationTokenId = randomUUID();

    const verificationToken = crypto.randomBytes(32).toString("base64url");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("base64url");

    const verificationTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    try {
      await connection.beginTransaction();

      // create user
      await authRepository.createUser(
        {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email_address: emailAddress,
          password_hash: passwordHash,
        },
        connection,
      );

      // create email verification token
      await authRepository.createVerificationToken(
        {
          id: verificationTokenId,
          user_id: userId,
          token_hash: verificationTokenHash,
          expires_at: verificationTokenExpiresAt,
        },
        connection,
      );

      await connection.commit();

      const verificationLink = createVerificationLink({
        token: verificationToken,
        ref: verificationTokenId,
      });

      mailService.sendVerificationEmail({
        to: emailAddress,
        firstName,
        verificationLink,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.commit();
    }
  }

  async login(params: LoginParams): Promise<string> {
    const { emailAddress, password } = params;

    // find user by email
    const existingUser = await authRepository.getByEmailAddress(emailAddress);

    if (!existingUser) {
      throw ApiError.badRequest("Invalid email address or password.");
    }

    if (existingUser.status === "PENDING_VERIFICATION") {
      // check for existing verification token(email) by user id
      const userVerificationToken =
        await authRepository.getVerificationTokenByUserId(existingUser.id);

      const expiresAt = userVerificationToken?.expires_at;

      if (expiresAt && new Date(expiresAt).getTime() >= Date.now()) {
        // generate and send new verification token/link

        throw ApiError.unauthorized(
          "Email not verified. Please check your inbox for the verification link.",
        );
      }

      // Token is missing or expired.
      // Generate a new verification token and send the verification email here.
      const verificationTokenId = randomUUID();

      const verificationToken = crypto.randomBytes(32).toString("base64url");
      const verificationTokenHash = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("base64url");

      const verificationTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await authRepository.createVerificationToken({
        id: verificationTokenId,
        user_id: existingUser.id,
        token_hash: verificationTokenHash,
        expires_at: verificationTokenExpiresAt,
      });
      const verificationLink = createVerificationLink({
        token: verificationToken,
        ref: verificationTokenId,
      });

      mailService.sendVerificationEmail({
        to: emailAddress,
        firstName: existingUser.first_name,
        verificationLink,
      });

      throw ApiError.unauthorized(
        "Email not verified. A new verification link has been sent to your inbox.",
      );
    }

    // compare passwords
    const isPasswordValid = await argon2.verify(
      existingUser.password_hash,
      password,
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email address or password.");
    }

    // generate access token

    const jwt_secret = requireEnv("JWT_SECRET");

    const accessToken = jwt.sign({ id: existingUser.id }, jwt_secret, {
      expiresIn: "1h",
    });

    return accessToken;
  }

  async currentAuthuser(userId: string) {
    const user = await authRepository.getById(userId);

    if (!user) {
      throw new Error(`user with id ${userId} not found`);
    }

    const authUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      emailAddress: user.email_address,
      phoneNumber: user.phone_number,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return authUser;
  }

  async deleteUser(userId: string) {
    const user = await authRepository.getById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // 1. Collect data before deletion
    const data = await this.getUserDataForExport(userId);

    // 2. Generate export
    const pdf = await generateUserDataPdf(data);

    await mailService.sendAccountDataExport(
      user.email_address,
      user.first_name,
      pdf,
    );

    await authRepository.deleteUser(userId);

    mailService.sendAccountDeleted(user.email_address, user.first_name);

    // send alert email
    // delete user data
    // payments
    // subscriptions
  }

  async getUserDataForExport(userId: string) {
    const user = await authRepository.getById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const subscriptions = await subscriptionRepository.getByUserId(userId);
    const payments = await paymentRepository.getByUserId(userId);

    const normalizedSubscriptions = subscriptions.map((subscription) => ({
      id: subscription.id,
      plan: subscription.plan_name,
      status: subscription.status,
      startAt: subscription.start_at ? new Date(subscription.startAt) : null,
      expiresAt: subscription.expires_at
        ? new Date(subscription.expiresAt)
        : null,
    }));

    const normalizedPayments = payments.map((payment) => ({
      id: payment.payment_id,
      amount: Number(payment.amount ?? 0),
      status: payment.status,
      receipt: payment.mpesa_receipt_number ?? null,
      phoneNumber: payment.phone_number ?? payment.phoneNumber ?? "",
      createdAt: payment.created_at ?? payment.createdAt ?? new Date(0),
    }));

    return {
      user: {
        id: user.id,
        firstName: user.first_name ?? user.firstName ?? "",
        lastName: user.last_name ?? user.lastName ?? "",
        email: user.email_address ?? user.email ?? "",
        phone: user.phone_number ?? user.phone ?? "",
        createdAt: user.created_at ?? user.createdAt ?? new Date(0),
      },
      subscriptions: normalizedSubscriptions,
      payments: normalizedPayments,
    };
  }

  async resendVerification(email: string) {
    // get non verified user
    const user = await authRepository.getByEmailAddressNotVerified(email);

    if (!user) {
      return;
    }

    const verificationTokenId = randomUUID();

    const verificationToken = crypto.randomBytes(32).toString("base64url");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("base64url");

    const verificationTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await authRepository.createVerificationToken({
      id: verificationTokenId,
      user_id: user.id,
      token_hash: verificationTokenHash,
      expires_at: verificationTokenExpiresAt,
    });

    const verificationLink = createVerificationLink({
      token: verificationToken,
      ref: verificationTokenId,
    });

    mailService.sendVerificationEmail({
      to: user.email_address,
      firstName: user.first_name,
      verificationLink,
    });
  }

  async verifyEmail(token: string, ref: string) {
    // get token by id(not expired)
    const verificationToken =
      await authRepository.getVerificationTokenById(ref);

    if (!verificationToken) {
      throw ApiError.badRequest(
        "This verification link is invalid or has expired.",
      );
    }

    const user = await authRepository.getByUserId(verificationToken.user_id);

    if (!user) {
      throw ApiError.badRequest(
        "This verification link is invalid or has expired.",
      );
    }

    // hash and compare
    const incomingVerificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("base64url");

    if (incomingVerificationTokenHash !== verificationToken.token_hash) {
      throw ApiError.badRequest(
        "This verification link is invalid or has expired.",
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      // update user verification status
      await authRepository.markUserAsVerified(
        verificationToken.user_id,
        connection,
      );

      await authRepository.markVerificationTokenAsUsed(
        verificationToken.id,
        connection,
      );

      await connection.commit();

      mailService.sendWelcome(user.email_address, user.first_name);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

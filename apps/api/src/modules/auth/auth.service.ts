import { ApiError } from "../../core/errors/api-error";
import { AuthRepository } from "./auth.repository.js";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";
import { pool } from "../../core/config/db.js";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { MailService } from "../mail/MailService.js";
import { createVerificationLink } from "./utils.js";

const authRepository = new AuthRepository();
const subscriptionRepository = new SubscriptionRepository();
const mailService = new MailService();

interface RegisterServiceParams {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  password: string;
}
export class AuthService {
  async register(params: RegisterServiceParams) {
    const { firstName, lastName, emailAddress, phoneNumber, password } = params;

    //find if email exists
    const existingUser = await authRepository.getByEmailAddress(emailAddress);

    if (existingUser) {
      console.log(existingUser);
      // check for an active subscription
      const activeSubscription =
        await subscriptionRepository.getCurrentSubscriptionByUserId(
          existingUser.id,
        );

      if (activeSubscription) {
        throw ApiError.conflict(
          "You already have an active subscription. Please log in.",
        );
      }

      throw ApiError.conflict(
        "An account with this email already exists. Please log in to finish your subscription checkout.",
      );
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
          phone_number: phoneNumber,
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
}

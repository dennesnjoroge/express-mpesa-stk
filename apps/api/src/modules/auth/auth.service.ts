import { ApiError } from "../../core/errors/api-error";
import { AuthRepository } from "./auth.repository.js";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";
import { pool, requireEnv } from "../../core/config/db.js";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { MailService } from "../mail/MailService.js";
import { createVerificationLink } from "./utils.js";
import type { LoginParams, RegisterParams } from "./types.js";
import jwt from "jsonwebtoken";

const authRepository = new AuthRepository();
const mailService = new MailService();

export class AuthService {
  async register(params: RegisterParams) {
    const { firstName, lastName, emailAddress, phoneNumber, password } = params;

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

  async login(params: LoginParams): Promise<string> {
    const { emailAddress, password } = params;

    // find user by email
    const existingUser = await authRepository.getByEmailAddress(emailAddress);

    if (!existingUser) {
      throw ApiError.badRequest(
        "User with that email does not exist in our system.",
      );
    }

    // compare passwords
    const isPasswordValid = await argon2.verify(
      existingUser.password_hash,
      password,
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized(
        "Incorrect password. Try resetting your password.",
      );
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
}

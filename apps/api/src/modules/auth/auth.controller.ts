import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import type { LoginParams, RegisterParams } from "./types.js";
import { ApiError } from "../../core/errors/api-error.js";

const authService = new AuthService();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kenyanPhoneRegex = /^(?:07\d{8}|011\d{7})$/;

export const normalizeKenyanPhone = (phone: string): string => {
  const normalized = phone.trim().replace(/\s+/g, "");

  if (/^07\d{8}$/.test(normalized)) {
    return `254${normalized.slice(1)}`;
  }

  if (/^011\d{7}$/.test(normalized)) {
    return `254${normalized.slice(1)}`;
  }

  if (/^2547\d{8}$/.test(normalized)) {
    return normalized;
  }

  if (/^25411\d{7}$/.test(normalized)) {
    return normalized;
  }

  throw new Error("Invalid phone number");
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params: RegisterParams = req.body;

    const { firstName, lastName, emailAddress, phoneNumber, password } = params;

    if (!firstName) {
      throw ApiError.badRequest("First name is required.");
    }

    if (!lastName) {
      throw ApiError.badRequest("Last name is required.");
    }

    if (!emailAddress) {
      throw ApiError.badRequest("Email address is required.");
    }

    if (!emailRegex.test(emailAddress)) {
      throw ApiError.badRequest("Invalid email address.");
    }

    if (!phoneNumber) {
      throw ApiError.badRequest("Phone number is required.");
    }

    if (!kenyanPhoneRegex.test(phoneNumber)) {
      throw ApiError.badRequest(
        "Invalid phone number. Use the 07... or 011... format.",
      );
    }

    if (!password) {
      throw ApiError.badRequest("Password is required.");
    }

    await authService.register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: emailAddress.trim().toLowerCase(),
      phoneNumber: normalizeKenyanPhone(phoneNumber),
      password,
    });

    return res.status(201).json({
      message:
        "Registration successful. A verification link has been sent to your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params: LoginParams = req.body;

    const { emailAddress, password } = params;

    if (!emailAddress) {
      throw ApiError.badRequest("Email address is required");
    }

    if (!password) {
      throw ApiError.badRequest("Password is required");
    }

    const access_token = await authService.login({
      emailAddress: emailAddress.trim().toLocaleLowerCase(),
      password,
    });

    console.log(access_token);

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    next(error);
  }
};

export const currentAuthUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as { id?: string } | undefined;

    if (!user?.id) {
      throw ApiError.unauthorized();
    }

    const authUser = await authService.currentAuthuser(user.id);

    return res.status(200).json(authUser);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    next(error);
  }
};

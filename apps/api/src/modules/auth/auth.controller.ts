import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import type { LoginParams, RegisterParams } from "./types.js";
import { ApiError } from "../../core/errors/api-error.js";

const authService = new AuthService();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params: RegisterParams = req.body;

    const { firstName, lastName, emailAddress, password } = params;

    if (!firstName) {
      throw ApiError.badRequest("First name is required.");
    }

    if (!nameRegex.test(firstName)) {
      throw ApiError.badRequest("Enter a valid first name");
    }

    if (!lastName) {
      throw ApiError.badRequest("Last name is required.");
    }

    if (!nameRegex.test(lastName)) {
      throw ApiError.badRequest("Enter a valid last name");
    }

    if (!emailAddress) {
      throw ApiError.badRequest("Email address is required.");
    }

    if (!emailRegex.test(emailAddress)) {
      throw ApiError.badRequest("Invalid email address.");
    }

    if (!password) {
      throw ApiError.badRequest("Password is required.");
    }

    await authService.register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: emailAddress.trim().toLowerCase(),
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

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as { id?: string } | undefined;

    if (!user?.id) {
      throw ApiError.unauthorized();
    }

    //console.log(user);

    // should clear auth cookie
    await authService.deleteUser(user.id);

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const emailAddress = req.body?.emailAddress;

    if (
      typeof emailAddress !== "string" ||
      !emailAddress ||
      !emailRegex.test(emailAddress)
    ) {
      return res.sendStatus(200);
    }

    await authService.resendVerification(emailAddress);

    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

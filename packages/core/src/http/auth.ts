import type { NextFunction, Request, Response } from "express";
import { createHash, timingSafeEqual } from "node:crypto";

export type AuthOptions = {
  bearerToken?: string;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest();

const timingSafeStringEqual = (left: string, right: string) =>
  timingSafeEqual(sha256(left), sha256(right));

export const createBearerAuthMiddleware = (options: AuthOptions) => {
  const expected = options.bearerToken
    ? `Bearer ${options.bearerToken}`
    : undefined;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!expected || req.path === "/health") {
      next();
      return;
    }

    if (!timingSafeStringEqual(req.header("authorization") ?? "", expected)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };
};

import type { NextFunction, Request, Response } from "express";

export type AuthOptions = {
  bearerToken?: string;
};

export const createBearerAuthMiddleware = (options: AuthOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.bearerToken || req.path === "/health") {
      next();
      return;
    }

    const expected = `Bearer ${options.bearerToken}`;
    if (req.header("authorization") !== expected) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };
};

import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Endpoint not found" });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[Error]", err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Drizzle/MySQL errors
  if ((err as any).code === "ER_DUP_ENTRY") {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }

  if ((err as any).code === "ER_NO_REFERENCED_ROW_2") {
    res.status(400).json({ error: "Referenced resource not found" });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

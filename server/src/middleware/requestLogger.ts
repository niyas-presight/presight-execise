import type { NextFunction, Request, Response } from 'express';

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  const method = request.method;
  const path = request.originalUrl.split('?')[0];

  response.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(`${method} ${path} ${response.statusCode} ${durationMs.toFixed(2)}ms`);
  });

  next();
}
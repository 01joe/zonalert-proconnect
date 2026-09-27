/**
 * ResponseTimeMiddleware
 * Log le temps de réponse de chaque requête HTTP.
 * Sortie : 🟢 POST   /auth/register  → 201 · 143ms
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const ms     = Date.now() - start;
      const status = res.statusCode;
      const color  = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
      this.logger.log(
        `${color} ${method.padEnd(6)} ${originalUrl.padEnd(40)} → ${status} · ${ms}ms`,
      );
    });

    next();
  }
}

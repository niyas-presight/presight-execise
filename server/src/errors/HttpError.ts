import type { ApiIssue } from '../types/api';

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly issues?: ApiIssue[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
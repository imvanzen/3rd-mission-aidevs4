/** Verification API types and errors. */

export interface WeryfikacjaGetResponse {
  pytania: string[];
  token: string;
}

export interface WeryfikacjaPostResponse {
  status: string;
  is_correct?: boolean[];
  flag?: string;
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

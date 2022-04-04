import { IValidationError } from "./types";

export class ValidationError extends Error {}

export abstract class APIError extends Error {}
export class APIValidationError extends APIError {
  static StatusCode = 400;
  static message = "Validation Error";
  errors: IValidationError[];
  constructor(errors: IValidationError[]) {
    super(APIValidationError.message);
    this.errors = errors;
  }
}
export class APIInternalServerError extends APIError {
  static StatusCode = 500;
  static message = "Internal Server Error";
}

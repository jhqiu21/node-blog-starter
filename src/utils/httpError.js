export class HttpError extends Error {
  constructor(status = 500, message = 'Server Error') {
    super(message);
    this.status = status;
  }
}
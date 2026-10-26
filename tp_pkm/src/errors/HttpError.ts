export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what: string, id: number) => new HttpError(404, `${what} ${id} introuvable`);

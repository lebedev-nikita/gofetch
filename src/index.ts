import { SafePromise } from "@lebedevna/safe-promise";

export class FetchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FetchError";
  }
}

export class JsonParseError extends Error {
  constructor(source: string) {
    super(`invalid json: ${source}`);
    this.name = "JsonParseError";
  }
}

export class TextParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TextParseError";
  }
}

export class UnexpectedFetchError extends Error {
  constructor(err: Error) {
    super(err.message, { cause: err });
  }
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

async function parseText(res: Response) {
  return SafePromise.from(res.text(), (err) => new TextParseError(err.message, { cause: err }));
}

export function gofetch(...args: Parameters<typeof fetch>) {
  return SafePromise.from(
    Promise.try(() => fetch(...args)),
    (err) => new FetchError(err.message, { cause: err }),
  ).pipe(
    (res) => ({
      ok: res.ok,
      status: res.status,
      async json() {
        const source = await parseText(res);
        if (source instanceof TextParseError) return source;

        return SafePromise.try(
          () => JSON.parse(source) as JsonValue,
          () => new JsonParseError(source),
        );
      },
      text() {
        return parseText(res);
      },
    }),
    (err) => new UnexpectedFetchError(err),
  );
}

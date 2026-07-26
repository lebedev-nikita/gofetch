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

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export async function gofetch(...args: Parameters<typeof fetch>) {
  const res = await SafePromise.from(
    Promise.resolve().then(() => fetch(...args)),
    (err) => new FetchError(err.message, { cause: err }),
  );

  if (res instanceof FetchError) return res;

  return {
    ok: res.ok,
    status: res.status,
    async json() {
      const source = await this.text();
      if (source instanceof TextParseError) return source;

      return SafePromise.try(
        () => JSON.parse(source) as JsonValue,
        () => new JsonParseError(source),
      );
    },
    async text() {
      return SafePromise.from(
        res.text(),
        (err) => new TextParseError(err.message, { cause: err }),
      );
    },
  };
}

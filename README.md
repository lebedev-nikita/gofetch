# gofetch

`gofetch` is a small, fetch-compatible TypeScript wrapper that represents
request and body-reading failures as values instead of rejected promises.
It retains the familiar `fetch` request arguments and response `ok` and
`status` fields.

## Install

```sh
pnpm add @lebedevna/gofetch
```

Requires Node.js 18+ or another runtime with the standard Fetch API.

## Usage

```ts
import { FetchError, gofetch, JsonParseError, TextParseError } from "@lebedevna/gofetch";

const result = await gofetch("https://api.example.com/users");

if (result instanceof FetchError) {
  console.error("Request failed:", result.message);
} else if (!result.ok) {
  console.error("Unexpected status:", result.status);
} else {
  const users = await result.json();

  if (users instanceof JsonParseError || users instanceof TextParseError) {
    console.error("Could not read JSON:", users.message);
  } else {
    console.log(users);
  }
}
```

## API

### `gofetch(input, init?)`

Accepts the same arguments as global `fetch` and returns:

```ts
Promise<
  | FetchError
  | {
      ok: boolean;
      status: number;
      text(): Promise<string | TextParseError>;
      json(): Promise<JsonValue | JsonParseError | TextParseError>;
    }
>;
```

`ok` and `status` keep the native response values. HTTP responses such as
`404` and `500` are not request errors; check `ok` or `status` yourself.

### Errors

- `FetchError` — the request could not be started or completed, including a
  synchronous error from `fetch`, an abort, or a network failure. The original
  error is available through `cause`.
- `TextParseError` — the response body could not be read. Its `cause` is the
  original error.
- `JsonParseError` — the response body was read but was not valid JSON. Its
  message includes the original body text.

### `text()` and `json()`

`text()` reads the response body as a string. `json()` first reads it as text,
then parses it with `JSON.parse`. As with native `Response`, a body can only be
read once; do not call both methods for the same response.

`JsonValue` covers JSON strings, numbers, booleans, `null`, arrays, and
objects. Cast or validate the parsed value before relying on its shape.

## Development

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

If you have [just](https://github.com/casey/just) installed, `just test` and
`just build` run the same workflows (and install locked dependencies first).

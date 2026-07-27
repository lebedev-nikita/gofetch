import { afterEach, assert, describe, expect, it, vi } from "vitest";

import { FetchError, gofetch, JsonParseError, TextParseError } from "../src/index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gofetch", () => {
  it("forwards fetch arguments and exposes response status", async () => {
    const response = new Response("ok", { status: 201 });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await gofetch("https://api.example.com/users", {
      method: "POST",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/users", {
      method: "POST",
    });
    expect(result).not.toBeInstanceOf(FetchError);
    if (result instanceof FetchError) throw result;
    if (result instanceof Error) throw result;

    expect(result).toMatchObject({ ok: true, status: 201 });
    await expect(result.text()).resolves.toBe("ok");
  });

  it("keeps unsuccessful HTTP responses as responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("missing", { status: 404 })),
    );

    const result = await gofetch("https://api.example.com/missing");

    assert(!(result instanceof FetchError));
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("returns FetchError for rejected requests", async () => {
    const cause = new Error("network unavailable");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(cause));

    const result = await gofetch("https://api.example.com/users");

    expect(result).toBeInstanceOf(FetchError);
    expect(result).toMatchObject({ message: "network unavailable", cause });
  });

  it("returns FetchError when fetch throws synchronously", async () => {
    const cause = new Error("invalid request");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(() => {
        throw cause;
      }),
    );

    const result = await gofetch("not a URL");

    expect(result).toBeInstanceOf(FetchError);
    expect(result).toMatchObject({ message: "invalid request", cause });
  });

  it("parses valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":1,"active":true}')),
    );

    const result = await gofetch("https://api.example.com/user");

    if (result instanceof FetchError) throw result;
    await expect(result.json()).resolves.toEqual({ id: 1, active: true });
  });

  it("returns JsonParseError with the original body for invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response("not json")));

    const result = await gofetch("https://api.example.com/user");
    if (result instanceof FetchError) throw result;

    const body = await result.json();
    expect(body).toBeInstanceOf(JsonParseError);
    expect(body).toMatchObject({ message: "invalid json: not json" });
  });

  it("returns TextParseError when the response body cannot be read", async () => {
    const cause = new Error("body stream failed");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockRejectedValue(cause),
      } as any as Response),
    );

    const result = await gofetch("https://api.example.com/user");

    if (result instanceof FetchError) throw result;
    const body = await result.text();
    expect(body).toBeInstanceOf(TextParseError);
    expect(body).toMatchObject({ message: "body stream failed", cause });
  });
});

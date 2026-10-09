import { describe, expect, it } from "vitest";
import { frameAncestorsDirective, trustedStudioOrigin } from "./framing-policy";

describe("preview framing policy", () => {
  it("allows only the current origin when Studio is not configured", () => {
    expect(frameAncestorsDirective(undefined)).toBe("frame-ancestors 'self'");
  });

  it("allows one exact HTTPS Studio origin", () => {
    expect(frameAncestorsDirective("https://editor.example.com/")).toBe(
      "frame-ancestors 'self' https://editor.example.com",
    );
  });

  it("permits loopback HTTP for local Studio development", () => {
    expect(trustedStudioOrigin("http://localhost:3333")).toBe(
      "http://localhost:3333",
    );
  });

  it("allows both exact Studio origins and their Sanity dashboard ancestor", () => {
    expect(
      frameAncestorsDirective(
        "http://127.0.0.1:3334",
        "https://ar-editor.sanity.studio",
      ),
    ).toBe(
      "frame-ancestors 'self' http://127.0.0.1:3334 https://ar-editor.sanity.studio https://www.sanity.io",
    );
    expect(
      frameAncestorsDirective(
        "https://ar-editor.sanity.studio",
        "https://ar-editor.sanity.studio/",
      ),
    ).toBe(
      "frame-ancestors 'self' https://ar-editor.sanity.studio https://www.sanity.io",
    );
  });

  it("keeps local framing limited to its existing origin without hosted Studio", () => {
    expect(frameAncestorsDirective("http://127.0.0.1:3334")).toBe(
      "frame-ancestors 'self' http://127.0.0.1:3334",
    );
  });

  it.each([
    "http://ar-editor.sanity.studio",
    "http://127.0.0.1:3334",
    "https://ar-editor.sanity.studio:8443",
    "https://user:password@ar-editor.sanity.studio",
    "https://*.sanity.studio",
    "https://ar-editor.sanity.studio/path",
    "https://ar-editor.sanity.studio?token=value",
    "https://ar-editor.sanity.studio#",
    "https://ar-editor.sanity.studio/../",
  ])("rejects an unsafe hosted Studio origin: %s", (value) => {
    expect(() =>
      frameAncestorsDirective("http://127.0.0.1:3334", value),
    ).toThrow();
  });

  it.each([
    "http://editor.example.com",
    "https://user:password@editor.example.com",
    "https://editor.example.com/path",
    "https://editor.example.com/?token=value",
    "https://*.example.com",
    "https://editor.example.com#",
  ])("rejects an unsafe or non-origin Studio value: %s", (value) => {
    expect(() => trustedStudioOrigin(value)).toThrow();
  });
});

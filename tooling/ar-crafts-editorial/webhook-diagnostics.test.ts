import { describe, expect, it } from "vitest";
import { webhookDiagnostics } from "./webhook-diagnostics";

describe("sanitized provider webhook diagnostics", () => {
  it.each([
    [true, false, true],
    [false, true, true],
    [true, true, true],
    [false, false, false],
    [undefined, false, null],
    [false, undefined, null],
    [true, undefined, true],
  ] as const)(
    "distinguishes operator %s and service %s disable states",
    (operator, service, effective) => {
      const report = webhookDiagnostics(
        { isDisabledByUser: operator, isDisabled: service },
        "isolated",
      );
      expect(report.operatorDisabled).toBe(operator ?? null);
      expect(report.serviceDisabled).toBe(service ?? null);
      expect(report.disabled).toBe(effective);
    },
  );

  it("reads rule.on and never copies credentials, destinations or unrecognized events", () => {
    const privateHook = {
      dataset: "isolated",
      isDisabledByUser: true,
      isDisabled: false,
      rule: { on: ["create", "update", "delete", "private-event"] },
      on: ["wrong-source"],
      url: "https://ar-crafts-demo.vercel.app/api/revalidate/sanity?secret=private-value",
      secret: "private-value",
      headers: { authorization: "private-value" },
      filter: "private-filter",
      projection: "private-projection",
    };
    const report = webhookDiagnostics(privateHook, "isolated");
    expect(report.events).toEqual(["create", "update", "delete"]);
    expect(report.destinationIsProvisionalDemo).toBe(true);
    expect(report.datasetMatches).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(
      /private|wrong-source|secret|authorization|https/,
    );
  });

  it("reports missing state as unknown and malformed destination without exposing it", () => {
    expect(webhookDiagnostics(undefined, "isolated")).toMatchObject({
      found: false,
      disabled: null,
      events: [],
    });
    expect(
      webhookDiagnostics({ url: "private-invalid-url" }, "isolated")
        .destinationIsProvisionalDemo,
    ).toBe(false);
  });
});

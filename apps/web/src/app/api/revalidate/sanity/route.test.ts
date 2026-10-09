import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  createClient: vi.fn(),
  claim: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("../../../../lib/sanity-revalidation-receipts", () => ({
  createRevalidationReceiptClient: mocks.createClient,
  claimReceipt: mocks.claim,
  completeReceipt: mocks.complete,
  failReceipt: mocks.fail,
  hashIdempotencyKey: (key: string) => `hash:${key}`,
}));

import { POST } from "./route";

const secret = "s".repeat(32);
const canonical = JSON.stringify({ _id: "ar-workshop-1", _type: "arWorkshop" });

async function request(
  body = canonical,
  headers: Record<string, string> = {},
): Promise<Request> {
  return new Request("http://test.local/api/revalidate/sanity", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [SIGNATURE_HEADER_NAME]: await encodeSignatureHeader(
        body,
        Date.now(),
        secret,
      ),
      "sanity-dataset": "sandbox",
      "sanity-document-id": "ar-workshop-1",
      "sanity-operation": "update",
      "sanity-project-id": "project-id",
      "sanity-transaction-id": "transaction-1",
      "sanity-transaction-time": "2026-09-20T12:00:00Z",
      "sanity-webhook-id": "webhook-1",
      "idempotency-key": "event-1",
      ...headers,
    },
    body,
  });
}

async function assertPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
}

describe("POST /api/revalidate/sanity", () => {
  it.each([
    "arSite",
    "arWorkshop",
    "arWorkshopEdition",
    "arMaterial",
    "arInspiration",
    "arFaq",
  ])(
    "invalidates AR %s for publish, update and delete/unpublish",
    async (_type) => {
      for (const operation of ["create", "update", "delete"]) {
        const response = await POST(
          await request(JSON.stringify({ _id: "ar-workshop-1", _type }), {
            "sanity-operation": operation,
          }),
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          revalidated: ["ar-crafts"],
          source: "sanity-webhook",
        });
        expect(mocks.revalidateTag).toHaveBeenLastCalledWith(
          "ar-crafts",
          "max",
        );
        await assertPrivate(response);
      }
    },
  );

  it("rejects forged signatures and signatures for different raw bodies", async () => {
    for (const signature of [
      await encodeSignatureHeader(canonical, Date.now(), "f".repeat(32)),
      await encodeSignatureHeader(canonical + " ", Date.now(), secret),
    ]) {
      const response = await POST(
        await request(canonical, { [SIGNATURE_HEADER_NAME]: signature }),
      );
      expect(response.status).toBe(401);
      await assertPrivate(response);
    }
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it.each(["business", "menuItem", "faq", "sanityRevalidationReceipt"])(
    "rejects signed non-AR %s payloads",
    async (_type) => {
      const response = await POST(
        await request(JSON.stringify({ _id: "ar-workshop-1", _type })),
      );
      expect(response.status).toBe(400);
      expect(mocks.claim).not.toHaveBeenCalled();
    },
  );

  it("retries a failed AR event, then acknowledges its durable replay", async () => {
    mocks.revalidateTag.mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });
    mocks.claim
      .mockResolvedValueOnce({ state: "claimed", receiptId: "receipt-1" })
      .mockResolvedValueOnce({ state: "claimed", receiptId: "receipt-1" })
      .mockResolvedValueOnce({ state: "replay", receiptId: "receipt-1" });
    expect((await POST(await request())).status).toBe(500);
    expect(mocks.fail).toHaveBeenCalledWith({}, "receipt-1");
    expect((await POST(await request())).status).toBe(200);
    expect(await (await POST(await request())).json()).toEqual({
      replay: true,
      source: "sanity-webhook",
    });
    expect(mocks.revalidateTag).toHaveBeenCalledTimes(2);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.claim.mock.calls.map((call) => call[1])).toEqual([
      "event-1",
      "event-1",
      "event-1",
    ]);
  });

  it("does not acknowledge invalidation when durable completion fails", async () => {
    mocks.complete.mockRejectedValueOnce(new Error("receipt write failed"));
    const response = await POST(await request());
    expect(response.status).toBe(500);
    expect(mocks.fail).toHaveBeenCalledWith({}, "receipt-1");
    await assertPrivate(response);
  });
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SANITY_WEBHOOK_SECRET = secret;
    process.env.SANITY_PROJECT_ID = "project-id";
    process.env.SANITY_DATASET = "sandbox";
    process.env.SANITY_WEBHOOK_ID = "webhook-1";
    vi.spyOn(console, "info").mockImplementation(mocks.logInfo);
    vi.spyOn(console, "warn").mockImplementation(mocks.logWarn);
    vi.spyOn(console, "error").mockImplementation(mocks.logError);
    mocks.createClient.mockReturnValue({});
    mocks.claim.mockResolvedValue({ state: "claimed", receiptId: "receipt-1" });
    mocks.complete.mockResolvedValue(undefined);
    mocks.fail.mockResolvedValue(undefined);
  });
  afterEach(() => {
    delete process.env.SANITY_WEBHOOK_SECRET;
    delete process.env.SANITY_PROJECT_ID;
    delete process.env.SANITY_DATASET;
    delete process.env.SANITY_WEBHOOK_ID;
    delete process.env.PATO_HOSTED_INTERNAL_PREVIEW;
    vi.restoreAllMocks();
  });

  it.each(["create", "update", "delete"])(
    "accepts the published %s event and invalidates its tag once",
    async (operation) => {
      const response = await POST(
        await request(canonical, { "sanity-operation": operation }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        revalidated: ["ar-crafts"],
      });
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
      expect(mocks.complete).toHaveBeenCalledWith({}, "receipt-1");
      const event = JSON.parse(
        String(mocks.logInfo.mock.calls.at(-1)?.[0]),
      ) as Record<string, unknown>;
      expect(event).toMatchObject({
        event: "sanity_webhook",
        outcome: "completed",
        projectId: "project-id",
        dataset: "sandbox",
        webhookId: "webhook-1",
        transactionId: "transaction-1",
        documentId: "ar-workshop-1",
        operation,
        status: 200,
      });
      expect(JSON.stringify(event)).not.toContain(secret);
      await assertPrivate(response);
    },
  );

  it("responds to a replay without another invalidation", async () => {
    mocks.claim.mockResolvedValue({ state: "replay", receiptId: "receipt-1" });
    const response = await POST(await request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ replay: true });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    await assertPrivate(response);
  });

  it("returns a retryable response while another invocation holds the lease", async () => {
    mocks.claim.mockResolvedValue({
      state: "in_progress",
      receiptId: "receipt-1",
    });
    const response = await POST(await request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Webhook processing is in progress",
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
    const event = JSON.parse(
      String(mocks.logWarn.mock.calls.at(-1)?.[0]),
    ) as Record<string, unknown>;
    expect(event).toMatchObject({ outcome: "in_progress", status: 503 });
    expect(JSON.stringify(event)).not.toContain(secret);
    await assertPrivate(response);
  });

  it("returns 503 for a receipt storage failure without acknowledging the event", async () => {
    mocks.claim.mockRejectedValue(new Error("private storage failure"));
    const response = await POST(await request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Webhook receipt unavailable",
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
    const event = JSON.parse(
      String(mocks.logError.mock.calls.at(-1)?.[0]),
    ) as Record<string, unknown>;
    expect(event).toMatchObject({
      outcome: "receipt_unavailable",
      status: 503,
    });
    expect(JSON.stringify(event)).not.toContain("private storage failure");
    await assertPrivate(response);
  });

  it("verifies the unparsed request text before JSON handling", async () => {
    const raw = '{  "_id" : "ar-workshop-1", "_type" : "arWorkshop" }';
    const response = await POST(await request(raw));
    expect(response.status).toBe(200);
  });

  it.each([
    [{ "idempotency-key": " " }, 400, "invalid_idempotency_key"],
    [{ "sanity-operation": "publish" }, 400, "invalid_operation"],
    [{ "content-type": "text/plain" }, 415, "invalid_content_type"],
    [{ [SIGNATURE_HEADER_NAME]: "" }, 401, "invalid_signature"],
  ] as const)(
    "rejects invalid request metadata",
    async (headers, status, outcome) => {
      const response = await POST(await request(canonical, headers));
      expect(response.status).toBe(status);
      expect(mocks.claim).not.toHaveBeenCalled();
      const event = JSON.parse(
        String(mocks.logWarn.mock.calls.at(-1)?.[0]),
      ) as Record<string, unknown>;
      expect(event).toMatchObject({ outcome, status });
      expect(JSON.stringify(event)).not.toContain(secret);
      await assertPrivate(response);
    },
  );

  it("requires an idempotency key", async () => {
    const response = await POST(
      new Request("http://test.local/api/revalidate/sanity", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [SIGNATURE_HEADER_NAME]: await encodeSignatureHeader(
            canonical,
            Date.now(),
            secret,
          ),
          "sanity-operation": "update",
        },
        body: canonical,
      }),
    );
    expect(response.status).toBe(400);
    await assertPrivate(response);
  });

  it("rejects a validly signed delivery from another project or webhook", async () => {
    for (const headers of [
      { "sanity-project-id": "other-project" },
      { "sanity-webhook-id": "other-webhook" },
      { "sanity-dataset": "other-dataset" },
      { "sanity-document-id": "other-document" },
    ] as Record<string, string>[]) {
      const response = await POST(await request(canonical, headers));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Unexpected webhook source",
      });
    }
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.logWarn).toHaveBeenCalledTimes(4);
  });

  it("fails closed when the expected project or dataset is not configured", async () => {
    delete process.env.SANITY_DATASET;
    const response = await POST(await request());
    expect(response.status).toBe(503);
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledOnce();
  });

  it("requires the configured webhook ID on a hosted internal preview", async () => {
    process.env.PATO_HOSTED_INTERNAL_PREVIEW = "authenticated";
    delete process.env.SANITY_WEBHOOK_ID;
    const response = await POST(await request());
    expect(response.status).toBe(503);
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledOnce();
  });

  it("rejects malformed, draft, unsupported and oversized bodies", async () => {
    for (const [body, headers, status] of [
      ["{", {}, 400],
      [
        JSON.stringify({ _id: "drafts.ar-workshop-1", _type: "arWorkshop" }),
        {},
        400,
      ],
      [JSON.stringify({ _id: "ar-workshop-1", _type: "unknown" }), {}, 400],
      ["x".repeat(16 * 1024 + 1), { "content-length": "16385" }, 413],
    ] as const) {
      const response = await POST(await request(body, headers));
      expect(response.status).toBe(status);
      await assertPrivate(response);
    }
  });

  it("fails closed for a malformed signature", async () => {
    const response = await POST(
      await request(canonical, { [SIGNATURE_HEADER_NAME]: "malformed" }),
    );
    expect(response.status).toBe(401);
    await assertPrivate(response);
  });

  it("marks a claimed receipt failed so a later delivery may retry", async () => {
    mocks.revalidateTag.mockImplementation(() => {
      throw new Error("cache unavailable");
    });
    const response = await POST(await request());
    expect(response.status).toBe(500);
    expect(mocks.fail).toHaveBeenCalledWith({}, "receipt-1");
    await assertPrivate(response);
  });
});

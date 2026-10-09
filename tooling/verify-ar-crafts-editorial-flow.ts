import { editorialHttp } from "./ar-crafts-editorial/http.ts";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@sanity/client";
import { encodeSignatureHeader } from "@sanity/webhook";
import {
  parseCraftContent,
  publishedCraftQuery,
  previewCraftQuery,
  approvedCraftContent,
} from "@ar-crafts/content";
import {
  editorialConfiguration,
  inspectEditorialEnvironment,
} from "./ar-crafts-editorial/config.ts";
import {
  editorialIds,
  editorialTestDocuments,
  editorialDraftDocument,
  draftId,
  testRaster,
  type TestDocument,
} from "./ar-crafts-editorial/documents.ts";

const args = process.argv.slice(2);
const argument = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const apply = args.includes("--apply");
const simulateWebhook = args.includes("--simulate-webhook");
const marker = `AR-CMS-TEST-${randomUUID()}`;
const steps: Record<string, unknown>[] = [];
const report = {
  currentStage: "configuration",
  failureStage: null as string | null,
  failureHttpStatus: null as number | null,
  marker,
  startedAt: new Date().toISOString(),
  mode: apply ? "real-sanity" : "dry-run",
  webhookOrigin: simulateWebhook ? "synthetic-signed-callback" : "not-verified",
  presentation: "not-verified",
  hostedAuthentication: "not-verified",
  integratedCMSClosed: false,
  sanityConnectionAttempted: false,
  sanityWritesAttempted: false,
  configuration: inspectEditorialEnvironment(process.env),
  steps,
};
const reportPath = resolve(
  argument("report") || `docs/delivery/ar-crafts-editorial/${marker}.json`,
);
const evidenceRoot = resolve("docs/delivery");
if (
  !reportPath.startsWith(evidenceRoot + "/") &&
  !reportPath.startsWith(evidenceRoot + "\\")
)
  throw new Error("Evidence must remain under docs/delivery.");
const save = () => {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
};
const check = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!apply) {
    steps.push({
      stage: "plan",
      operations: [
        "collision-check",
        "baseline",
        "draft",
        "preview-cookie",
        "publish",
        "modify",
        "unpublish",
        "delete",
        "exact-cleanup",
      ],
      actualSanityOperations: 0,
    });
    save();
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const config = editorialConfiguration(process.env);
  const editorialFetch = editorialHttp(config);
  check(
    args.includes("--confirm-sandbox-write") &&
      argument("confirm-project") === config.projectId &&
      argument("confirm-dataset") === config.dataset,
    "Explicit project/dataset/write confirmations required.",
  );
  const timeoutMs = Number(argument("timeout-ms") || 45000);
  check(
    Number.isFinite(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 60000,
    "Observation deadline must be 1–60 s; this is not an update SLA.",
  );
  const webhookId = process.env.SANITY_WEBHOOK_ID?.trim();
  check(webhookId, "SANITY_WEBHOOK_ID must identify the AR-only hook.");
  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: "2026-09-18",
    useCdn: false,
    token: config.writeToken,
    perspective: "raw",
  });
  const reader = client.withConfig({ token: config.readToken });
  const ids = Object.values(editorialIds);
  steps.push({ stage: "reserved-test-ids", documentIds: ids });
  const allIds = [...ids, ...ids.map(draftId)];
  const receipts: string[] = [];
  let createdAsset: string | undefined;
  const ownedDocuments = new Set<string>();
  const snapshot = async (preview: boolean) =>
    parseCraftContent(
      await reader.fetch(
        preview ? previewCraftQuery : publishedCraftQuery,
        { now: new Date().toISOString() },
        { perspective: preview ? "drafts" : "published" },
      ),
    );
  const pageObservation = async (
    cookie?: string,
    signal = AbortSignal.timeout(timeoutMs),
  ) => {
    const response = await editorialFetch(config.baseUrl, {
      headers: cookie ? { cookie } : {},
      redirect: "manual",
      signal,
    });
    check(response.ok, "Editorial page must respond successfully.");
    const html = await response.text();
    check(
      html.includes("Contacto por confirmar") && !html.includes("wa.me/"),
      "Contact must remain unconfirmed.",
    );
    const cacheStatus = (header: string) => {
      const value = response.headers.get(header)?.toUpperCase();
      return value &&
        ["HIT", "MISS", "STALE", "BYPASS", "REVALIDATED", "PRERENDER"].includes(
          value,
        )
        ? value
        : "not-reported";
    };
    return {
      html,
      status: response.status,
      cache: {
        vercel: cacheStatus("x-vercel-cache"),
        next: cacheStatus("x-nextjs-cache"),
      },
    };
  };
  const page = async (cookie?: string) => (await pageObservation(cookie)).html;
  const privateValues = Object.entries(process.env)
    .filter(
      ([name, value]) =>
        /TOKEN|SECRET|PASSWORD|BYPASS|PRIVATE_KEY|ACCESS_KEY/i.test(name) &&
        value?.trim(),
    )
    .flatMap(([, value]) => {
      const secret = value!.trim();
      return [
        secret,
        JSON.stringify(secret).slice(1, -1),
        encodeURIComponent(secret),
        secret
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll("'", "&#39;"),
      ];
    });
  let htmlSequence = 0;
  const saveHTML = (html: string) => {
    check(
      !privateValues.some((value) => html.includes(value)),
      "HTML evidence rejected; private values withheld.",
    );
    const filename = `${marker}-response-${String(++htmlSequence).padStart(4, "0")}.html`;
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(resolve(dirname(reportPath), filename), html);
    return filename;
  };
  type ActionClock = {
    documentId: string;
    operation: string;
    actionStartedAt: string;
    actionCompletedAt: string;
  };
  const actionsByDocument = new Map<string, ActionClock>();
  const action = async (
    documentId: string,
    operation: string,
    mutate: () => Promise<unknown>,
  ) => {
    report.currentStage = `${operation}-warm-cache`;
    const warm = await pageObservation();
    steps.push({
      stage: "cache-warmed",
      documentId,
      operation,
      observedAt: new Date().toISOString(),
      status: warm.status,
      cache: warm.cache,
      htmlArtifact: saveHTML(warm.html),
      providerDeliveryVerified: false,
    });
    report.currentStage = `${operation}-action`;
    const actionStartedAt = new Date().toISOString();
    steps.push({
      stage: "action-started",
      documentId,
      operation,
      actionStartedAt,
    });
    save();
    await mutate();
    const clock = {
      documentId,
      operation,
      actionStartedAt,
      actionCompletedAt: new Date().toISOString(),
    };
    actionsByDocument.set(documentId, clock);
    steps.push({ stage: "action-completed", ...clock });
    save();
  };
  const waitForPage = async (
    needle: string,
    present: boolean,
    stage: string,
    actionDocumentId: string = editorialIds.site,
  ) => {
    report.currentStage = stage;
    const start = performance.now();
    const clock = actionsByDocument.get(actionDocumentId);
    check(clock, "Web observation must follow a recorded document action.");
    while (performance.now() - start < timeoutMs) {
      const observation = await pageObservation(
        undefined,
        AbortSignal.timeout(
          Math.max(1, Math.ceil(timeoutMs - (performance.now() - start))),
        ),
      );
      const observedAt = new Date().toISOString();
      const markerInResponseHTML = observation.html.includes(needle);
      const timing = {
        ...clock,
        observedAt,
        elapsedMs: Math.round(performance.now() - start),
        elapsedFromActionMs:
          Date.parse(observedAt) - Date.parse(clock!.actionStartedAt),
        elapsedFromActionCompletedMs:
          Date.parse(observedAt) - Date.parse(clock!.actionCompletedAt),
      };
      steps.push({
        stage: "page-observation",
        observationStage: stage,
        ...timing,
        status: observation.status,
        cache: observation.cache,
        markerInResponseHTML,
        expectedMarkerInResponseHTML: present,
        expectedStateReached: markerInResponseHTML === present,
        htmlArtifact: saveHTML(observation.html),
        providerDeliveryVerified: false,
      });
      save();
      if (markerInResponseHTML === present) {
        steps.push({
          stage,
          ...timing,
          markerInResponseHTML: present,
          providerDeliveryVerified: false,
        });
        return;
      }
      await pause(
        Math.max(1, Math.min(500, timeoutMs - (performance.now() - start))),
      );
    }
    throw new Error(
      "Published page did not reach the expected state within the observation deadline.",
    );
  };
  const webhook = async (
    doc: TestDocument,
    operation: "create" | "update" | "delete",
  ) => {
    if (!simulateWebhook) return;
    const key = `${marker}-${doc._id}-${operation}-${receipts.length}`;
    const receipt = `revalidation-receipt.${createHash("sha256").update(key).digest("hex")}`;
    check(
      !(await client.getDocument(receipt)),
      "Refusing a preexisting receipt collision.",
    );
    receipts.push(receipt);
    const body = JSON.stringify({ _id: doc._id, _type: doc._type });
    const headers = {
      "content-type": "application/json",
      "idempotency-key": key,
      "sanity-project-id": config.projectId,
      "sanity-dataset": config.dataset,
      "sanity-document-id": doc._id,
      "sanity-webhook-id": webhookId!,
      "sanity-operation": operation,
      "sanity-webhook-signature": await encodeSignatureHeader(
        body,
        Date.now(),
        config.webhookSecret,
      ),
    };
    const deliver = () =>
      editorialFetch(new URL("/api/revalidate/sanity", config.baseUrl), {
        method: "POST",
        headers,
        body,
      });
    const first = await deliver();
    check(first.ok, "Synthetic signed callback failed.");
    const replay = await deliver();
    const result = await replay.json();
    check(
      replay.ok && result.replay === true,
      "Callback replay was not deduplicated.",
    );
    steps.push({
      stage: "synthetic-callback",
      operation,
      documentId: doc._id,
      replayDeduplicated: true,
      providerDeliveryVerified: false,
    });
  };
  try {
    report.currentStage = "collision-check";
    report.sanityConnectionAttempted = true;
    const existing = await client.fetch<number>(
      "count(*[_id in $ids])",
      { ids: allIds },
      { perspective: "raw" },
    );
    const foreign = await client.fetch<number>(
      'count(*[_type in ["business", "whatsappConversion", "menuCategory", "menuItem", "galleryImage", "promotion", "faq", "testimonial"]])',
      {},
      { perspective: "raw" },
    );
    check(
      existing === 0 && foreign === 0,
      "Refusing existing singleton/test IDs or food documents; use an isolated AR dataset.",
    );
    steps.push({
      stage: "before",
      exactDocuments: existing,
      foreignFoodDocuments: foreign,
    });
    report.sanityWritesAttempted = true;
    report.currentStage = "test-asset-upload";
    createdAsset = (
      await client.assets.upload("image", testRaster(marker), {
        filename: `${marker}.png`,
        contentType: "image/png",
      })
    )._id;
    const generated = editorialTestDocuments(marker, createdAsset);
    const documents = [generated.site, ...generated.documents];
    // The published baseline initializes a real cache entry before draft changes.
    report.currentStage = "baseline-create";
    await action(generated.site._id, "baseline-create", async () => {
      await client.create(generated.site);
      ownedDocuments.add(generated.site._id);
    });
    await webhook(generated.site, "create");
    await waitForPage(`${marker}-BASELINE`, true, "baseline-web");
    const draftSite = {
      ...generated.site,
      _id: draftId(generated.site._id),
      hero: {
        ...(generated.site.hero as Record<string, unknown>),
        text: `${marker}-DRAFT`,
      },
    };
    report.currentStage = "draft-transaction";
    let transaction = client.transaction().create(draftSite);
    for (const document of generated.documents)
      transaction = transaction.create(editorialDraftDocument(document));
    await transaction.commit({ returnDocuments: false });
    for (const id of ids) ownedDocuments.add(draftId(id));
    report.currentStage = "draft-isolation-read";
    const before = await snapshot(false);
    const draft = await snapshot(true);
    check(
      !before.site.hero.text.includes("-DRAFT") &&
        draft.site.hero.text === `${marker}-DRAFT`,
      "Draft/publication isolation failed.",
    );
    check(
      draft.materials.length === 2 &&
        draft.gallery.length === 3 &&
        draft.workshops.length === 1 &&
        draft.editions.length === 1 &&
        draft.faq.length === 1,
      "AR document projections do not agree.",
    );
    check(
      !(await page()).includes(`${marker}-DRAFT`),
      "Normal page leaked the draft.",
    );
    steps.push({
      stage: "draft-saved",
      directPublishedMarker: before.site.hero.text,
      directPreviewMarker: draft.site.hero.text,
      normalDraftHidden: true,
    });
    save();
    const enterPreview = async () => {
      report.currentStage = "draft-entry";
      const enable = await editorialFetch(
        new URL("/api/draft/enable", config.baseUrl),
        {
          redirect: "manual",
        },
        true,
      );
      // Protected hosted and local production use the private manual preview secret.
      let authorized = enable;
      if (enable.status === 401) {
        const url = new URL("/api/draft/enable", config.baseUrl);
        url.searchParams.set("secret", config.previewSecret);
        authorized = await editorialFetch(url, { redirect: "manual" }, true);
      }
      check(authorized.status === 307, "Draft entry failed.");
      const cookieHeader = authorized.headers
        .getSetCookie()
        .find((c) => c.startsWith("__prerender_bypass="));
      check(
        cookieHeader && /HttpOnly/i.test(cookieHeader),
        "Draft cookie missing or exposed to scripts.",
      );
      return cookieHeader!.split(";")[0]!;
    };
    const cookie = await enterPreview();
    report.currentStage = "draft-preview-read";
    check(
      (await page(cookie)).includes(`${marker}-DRAFT`),
      "Preview did not render the saved AR draft.",
    );
    report.currentStage = "draft-exit";
    const disable = await editorialFetch(
      new URL("/api/draft/disable", config.baseUrl),
      {
        headers: { cookie },
        redirect: "manual",
      },
      true,
    );
    check(
      disable.status === 307 &&
        disable.headers
          .getSetCookie()
          .some(
            (c) =>
              c.startsWith("__prerender_bypass=") &&
              /(?:Expires=Thu, 01 Jan 1970|Max-Age=0)/i.test(c),
          ),
      "Draft exit did not expire the cookie.",
    );
    check(
      !(await page()).includes(`${marker}-DRAFT`),
      "Exited preview leaked draft content.",
    );
    steps.push({
      stage: "draft-preview",
      normalDraftHidden: true,
      previewDraftVisible: true,
      cookieHttpOnly: true,
      exitExpiresCookie: true,
      presentationVerified: false,
    });
    const publish = async (id: string) => {
      await action(id, "publish", async () => {
        await client.action({
          actionType: "sanity.action.document.publish",
          draftId: draftId(id),
          publishedId: id,
        });
        ownedDocuments.add(id);
      });
    };
    for (const doc of documents) await publish(doc._id);
    report.currentStage = "published-reference-check";
    const edition = await reader.getDocument(editorialIds.edition);
    const workshopReference = edition?.workshop as
      Record<string, unknown> | undefined;
    check(
      workshopReference?._ref === editorialIds.workshop &&
        workshopReference._weak === undefined &&
        workshopReference._strengthenOnPublish === undefined,
      "Published edition must strengthen its workshop reference.",
    );
    steps.push({ stage: "published-reference", workshopReferenceStrong: true });
    report.currentStage = "published-direct-read";
    const published = await snapshot(false);
    check(
      approvedCraftContent(published)?.materials.length === 2 &&
        published.site.contact.confirmed === false,
      "Published AR contract failed.",
    );
    steps.push({
      stage: "published-direct-read",
      heroMarker: published.site.hero.text,
      documentIds: ids,
      contactConfirmed: false,
    });
    save();
    await webhook(generated.site, "update");
    await waitForPage(`${marker}-DRAFT`, true, "published-web-update");
    report.currentStage = "modified-draft-create";
    await client.create({
      ...draftSite,
      hero: {
        ...(draftSite.hero as Record<string, unknown>),
        text: `${marker}-MODIFIED`,
      },
    });
    const modifiedCookie = await enterPreview();
    check(
      (await page(modifiedCookie)).includes(`${marker}-MODIFIED`) &&
        !(await page()).includes(`${marker}-MODIFIED`),
      "Modified draft isolation failed.",
    );
    steps.push({
      stage: "modified-draft",
      previewMarker: `${marker}-MODIFIED`,
      normalDraftHidden: true,
    });
    await publish(generated.site._id);
    await webhook(generated.site, "update");
    await waitForPage(`${marker}-MODIFIED`, true, "modified-web-update");
    report.currentStage = "material-unpublish";
    await action(editorialIds.material, "unpublish", () =>
      client.action({
        actionType: "sanity.action.document.unpublish",
        draftId: draftId(editorialIds.material),
        publishedId: editorialIds.material,
      }),
    );
    check(
      !(await snapshot(false)).materials.some(
        (d) => d.id === editorialIds.material,
      ),
      "Unpublished material remained in published reads.",
    );
    steps.push({
      stage: "unpublished-direct-read",
      documentId: editorialIds.material,
      absent: true,
    });
    const material = documents.find((d) => d._id === editorialIds.material)!;
    await webhook(material, "delete");
    await waitForPage(
      `${marker}-MATERIAL`,
      false,
      "unpublished-web-removal",
      editorialIds.material,
    );
    report.currentStage = "faq-delete";
    await action(editorialIds.faq, "delete", () =>
      client.action({
        actionType: "sanity.action.document.delete",
        publishedId: editorialIds.faq,
        includeDrafts: [],
      }),
    );
    check(
      !(await snapshot(false)).faq.some((d) => d.id === editorialIds.faq),
      "Deleted FAQ remained published.",
    );
    steps.push({
      stage: "deleted-direct-read",
      documentId: editorialIds.faq,
      absent: true,
    });
    await webhook(
      documents.find((d) => d._id === editorialIds.faq)!,
      "delete",
    );
    await waitForPage(
      "[PRUEBA CMS] ¿Es contenido real?",
      false,
      "deleted-faq-removal",
      editorialIds.faq,
    );
    steps.push({
      stage: "result",
      realSanityMutationsVerified: true,
      webObservationsVerified: true,
      providerDeliveryVerified: false,
      completeEditorialApproval: false,
    });
  } catch (error) {
    report.failureStage = report.currentStage;
    const status = (error as { statusCode?: unknown } | null)?.statusCode;
    report.failureHttpStatus =
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 400 &&
      status <= 599
        ? status
        : null;
    throw error;
  } finally {
    report.currentStage = "cleanup";
    steps.push({
      stage: "cleanup-start",
      ownedDocumentIds: [...ownedDocuments],
      syntheticReceiptIds: receipts,
      testAssetId: createdAsset,
    });
    save();
    // Check ownership again before revision-guarded cleanup. A collision or another
    // editor's changed document must never be removed by this verification tool.
    const cleanup: {
      delete: { query: string; params: { id: string; rev: string } };
    }[] = [];
    for (const id of ownedDocuments) {
      const document = await client.getDocument(id);
      if (!document) continue;
      check(
        document.sourceRef === `AR-CMS-TEST:${marker}`,
        "Cleanup ownership changed; manual review required.",
      );
      cleanup.push({
        delete: {
          query: "*[_id == $id && _rev == $rev]",
          params: { id, rev: document._rev },
        },
      });
    }
    for (const id of receipts) {
      const receipt = await client.getDocument(id);
      if (!receipt) continue;
      check(
        receipt.eventHash === id.slice("revalidation-receipt.".length),
        "Receipt ownership changed; manual review required.",
      );
      cleanup.push({
        delete: {
          query: "*[_id == $id && _rev == $rev]",
          params: { id, rev: receipt._rev },
        },
      });
    }
    if (cleanup.length)
      await client.mutate(cleanup, { returnDocuments: false });
    if (createdAsset) await client.delete(createdAsset);
    const remaining = await client.fetch<number>(
      "count(*[_id in $ids])",
      { ids: [...allIds, ...receipts] },
      { perspective: "raw" },
    );
    steps.push({
      stage: "cleanup",
      remainingExactDocuments: remaining,
      knownTestAssetRemoved: Boolean(createdAsset),
      providerGeneratedReceipts:
        "retained; unknown event hashes are not deleted",
    });
    check(remaining === 0, "Exact cleanup incomplete.");
    save();
  }
}

main().catch(() => {
  report.failureStage ??= report.currentStage;
  steps.push({
    stage: "failure",
    message:
      "Flow incomplete; private provider error details withheld. Inspect configuration and stage evidence locally.",
  });
  save();
  console.error(
    "AR editorial verification incomplete; see sanitized evidence. No secrets printed.",
  );
  process.exitCode = 1;
});

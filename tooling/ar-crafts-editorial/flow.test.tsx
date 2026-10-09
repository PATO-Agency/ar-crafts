import { mkdirSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { evaluate, parse } from "groq-js";
import {
  parseCraftContent,
  previewCraftQuery,
  publishedCraftQuery,
} from "@ar-crafts/content";
import { toCraftPageContent } from "../../apps/web/src/features/ar-crafts/to-page-content";
import { CraftPageView } from "../../apps/web/src/features/ar-crafts/page-view";
import {
  draftId,
  editorialIds,
  editorialTestDocuments,
  editorialDraftDocument,
  testRaster,
  type TestDocument,
} from "./documents";

// Explicit doubles: no Sanity transport, Draft Mode cookie or hydration is exercised here.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img
      src={String(props.src)}
      alt={String(props.alt)}
      width={624}
      height={480}
    />
  ),
}));
const now = new Date("2026-10-06T12:00:00Z");
const marker = "AR-CMS-TEST-LOCAL";
const generated = editorialTestDocuments(marker, "test-owned-asset", now);
const asset = {
  _id: "test-owned-asset",
  _type: "sanity.imageAsset",
  url: "/ar-crafts/conceptual/material-beads.svg",
};
const project = async (documents: TestDocument[], preview = false) => {
  // This overlay is a test double for the provider's drafts perspective.
  const visible = new Map<string, TestDocument>();
  for (const doc of documents.filter((d) => !d._id.startsWith("drafts.")))
    visible.set(doc._id, doc);
  if (preview)
    for (const doc of documents.filter((d) => d._id.startsWith("drafts."))) {
      const id = doc._id.slice(7);
      visible.set(id, { ...doc, _id: id });
    }
  const result = await (
    await evaluate(parse(preview ? previewCraftQuery : publishedCraftQuery), {
      dataset: [asset, ...visible.values()],
      params: { now: now.toISOString() },
    })
  ).get();
  return toCraftPageContent(parseCraftContent(result), { preview, now });
};
const render = (content: Awaited<ReturnType<typeof project>>) =>
  renderToStaticMarkup(
    <CraftPageView content={content} previewExitAvailable={content.preview} />,
  );

describe("AR editorial stages (local simulation)", () => {
  it("saves a draft edition before its workshop is published without weakening published fixtures", async () => {
    const edition = generated.documents.find(
      (doc) => doc._id === editorialIds.edition,
    )!;
    const workshop = generated.documents.find(
      (doc) => doc._id === editorialIds.workshop,
    )!;
    const draftEdition = editorialDraftDocument(edition);
    const reference = draftEdition.workshop as Record<string, unknown>;
    // Models Content Lake referential integrity; drafts do not satisfy a strong published-ID reference.
    const integrityAllows = (
      ref: Record<string, unknown>,
      dataset: TestDocument[],
    ) => ref._weak === true || dataset.some((doc) => doc._id === ref._ref);
    expect(
      integrityAllows(edition.workshop as Record<string, unknown>, [
        editorialDraftDocument(workshop),
      ]),
    ).toBe(false);
    expect(integrityAllows(reference, [editorialDraftDocument(workshop)])).toBe(
      true,
    );
    expect(reference).toEqual({
      _type: "reference",
      _ref: editorialIds.workshop,
      _weak: true,
      _strengthenOnPublish: { type: "arWorkshop" },
    });
    expect(edition.workshop).toEqual({
      _type: "reference",
      _ref: editorialIds.workshop,
    });
    expect(
      integrityAllows(edition.workshop as Record<string, unknown>, [workshop]),
    ).toBe(true);
    const preview = await project(
      [generated.site, ...generated.documents.map(editorialDraftDocument)],
      true,
    );
    const published = await project([
      generated.site,
      ...generated.documents.map(editorialDraftDocument),
    ]);
    expect(preview.workshops).toHaveLength(1);
    expect(preview.workshops[0].dateLabel).toContain("hora de Lima");
    expect(published.workshops).toHaveLength(0);
  });
  it("separates saved drafts, published changes and removal across actual GROQ/contract/rendering", async () => {
    const draftSite = {
      ...generated.site,
      _id: draftId(editorialIds.site),
      hero: {
        ...(generated.site.hero as Record<string, unknown>),
        text: `${marker}-DRAFT`,
      },
    };
    const dataset = [
      generated.site,
      draftSite,
      ...generated.documents.map(editorialDraftDocument),
    ];
    const publishedBefore = await project(dataset);
    const preview = await project(dataset, true);
    expect(render(publishedBefore)).toContain(`${marker}-BASELINE`);
    expect(render(publishedBefore)).not.toContain(`${marker}-DRAFT`);
    expect(render(preview)).toContain(`${marker}-DRAFT`);
    expect(preview.workshops[0].dateLabel).toContain("hora de Lima");
    expect(preview.workshops[0].priceLabel).toBe("Consultar precio");
    expect(preview.materials.map((m) => m.status)).toEqual([
      "inquiry",
      "unavailable",
    ]);
    expect(preview.gallery.map((g) => g.step)).toEqual([
      "piece",
      "detail",
      "hands",
    ]);
    expect(preview.about?.text).toContain("Nuestra esencia");
    expect(preview.faq).toHaveLength(1);
    const publishedDataset = [
      { ...draftSite, _id: editorialIds.site },
      ...generated.documents,
    ];
    const published = await project(publishedDataset);
    expect(render(published)).toContain(`${marker}-DRAFT`);
    const removed = await project(
      publishedDataset.filter(
        (d) => d._id !== editorialIds.material && d._id !== editorialIds.faq,
      ),
    );
    expect(render(removed)).not.toContain(`${marker}-MATERIAL`);
    expect(removed.faq).toEqual([]);
    expect(render(removed)).not.toContain('href="#preguntas"');
    for (const page of [publishedBefore, preview, published, removed]) {
      const html = render(page);
      expect(html).toContain('data-motion-policy="always"');
      expect(html).toContain("Contacto por confirmar");
      expect(html).not.toContain("wa.me/");
    }
    mkdirSync("tests/.generated", { recursive: true });
    writeFileSync(
      "tests/.generated/ar-editorial-preview.html",
      render(preview),
    );
    writeFileSync(
      "tests/.generated/ar-editorial-published.html",
      render(published),
    );
  });
  it("removes hidden materials and unapproved media while keeping honest empty states", async () => {
    const changed = generated.documents.map((doc) =>
      doc._id === editorialIds.material
        ? { ...doc, status: "hidden" }
        : doc._id === editorialIds.piece
          ? {
              ...doc,
              image: {
                ...(doc.image as Record<string, unknown>),
                rightsConfirmed: false,
              },
            }
          : doc,
    );
    const page = await project([generated.site, ...changed]);
    expect(page.materials.map((d) => d.id)).toEqual([editorialIds.unavailable]);
    expect(page.gallery.map((d) => d.step)).toEqual(["detail", "hands"]);
    expect(render(page)).toContain("Imagen por confirmar");
    expect(render(page)).toContain('data-scene-eligible="false"');
  });
  it("creates a distinct, owned PNG for each isolated run without importing photography", () => {
    const a = testRaster("run-a");
    expect(a.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(a.readUInt32BE(16)).toBe(1);
    expect(a.readUInt32BE(20)).toBe(1);
    expect(a.equals(testRaster("run-b"))).toBe(false);
  });
});

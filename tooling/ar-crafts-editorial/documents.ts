import { deflateSync } from "node:zlib";

export const editorialIds = {
  site: "arSite",
  workshop: "ar-cms-test-workshop",
  edition: "ar-cms-test-edition",
  material: "ar-cms-test-material",
  unavailable: "ar-cms-test-unavailable",
  piece: "ar-cms-test-piece",
  detail: "ar-cms-test-detail",
  hands: "ar-cms-test-hands",
  faq: "ar-cms-test-faq",
} as const;
export const draftId = (id: string) => `drafts.${id}`;
export type TestDocument = {
  _id: string;
  _type: string;
  [field: string]: unknown;
};

/** Match Studio's reference input when its workshop exists only as a draft. */
export function editorialDraftDocument(document: TestDocument): TestDocument {
  return {
    ...document,
    _id: draftId(document._id),
    ...(document._type === "arWorkshopEdition"
      ? {
          workshop: {
            ...(document.workshop as Record<string, unknown>),
            _weak: true,
            _strengthenOnPublish: { type: "arWorkshop" },
          },
        }
      : {}),
  };
}

export function editorialTestDocuments(
  marker: string,
  assetRef: string,
  now = new Date(),
) {
  const approved = {
    contentStatus: "approved",
    sourceRef: `AR-CMS-TEST:${marker}`,
    sourceObservedAt: now.toISOString(),
    approvedAt: now.toISOString(),
  };
  const image = (label: string) => ({
    _type: "image",
    asset: { _type: "reference", _ref: assetRef },
    alt: `[PRUEBA CMS] Raster generado ${label}; no fotografía real`,
    // Exercises the authorized-raster branch only in the isolated test dataset.
    kind: "photograph",
    rightsConfirmed: true,
  });
  const site: TestDocument = {
    _id: editorialIds.site,
    _type: "arSite",
    ...approved,
    hero: {
      eyebrow: "PRUEBA CMS · AR CRAFTS",
      title: "Prueba editorial\nAR Crafts.",
      text: `${marker}-BASELINE`,
      mobileText: "Contenido de prueba; no oferta real.",
    },
    about: {
      text: "[PRUEBA CMS] Texto sintético de Nuestra esencia.",
      image: image("esencia"),
    },
    contact: { confirmed: false },
  };
  const starts = new Date(now.getTime() + 90 * 86400000);
  const workshop: TestDocument = {
    _id: editorialIds.workshop,
    _type: "arWorkshop",
    ...approved,
    title: "[PRUEBA CMS] Taller",
    technique: "Prueba editorial",
    details: "Taller sintético; no inscripción real.",
    sortOrder: 0,
    image: image("taller"),
  };
  const documents: TestDocument[] = [
    workshop,
    {
      _id: editorialIds.edition,
      _type: "arWorkshopEdition",
      ...approved,
      workshop: { _type: "reference", _ref: editorialIds.workshop },
      startsAt: starts.toISOString(),
      endsAt: new Date(starts.getTime() + 3600000).toISOString(),
      timeZone: "America/Lima",
    },
    {
      _id: editorialIds.material,
      _type: "arMaterial",
      ...approved,
      title: `${marker}-MATERIAL`,
      presentationLabel: "Una presentación sintética",
      status: "inquiry",
      featured: true,
      sortOrder: 0,
      image: image("material"),
    },
    {
      _id: editorialIds.unavailable,
      _type: "arMaterial",
      ...approved,
      title: "[PRUEBA CMS] Material no disponible",
      presentationLabel: "Sin promesa de reposición",
      status: "unavailable",
      featured: false,
      sortOrder: 1,
    },
    ...(["piece", "detail", "hands"] as const).map((step, i) => ({
      _id: editorialIds[step],
      _type: "arInspiration",
      ...approved,
      image: image(step),
      caption: `[PRUEBA CMS] Raster sintético ${step}`,
      step,
      sortOrder: i,
    })),
    {
      _id: editorialIds.faq,
      _type: "arFaq",
      ...approved,
      question: "[PRUEBA CMS] ¿Es contenido real?",
      answer: "No. Solo verifica el flujo editorial en un dataset aislado.",
      sortOrder: 0,
    },
  ];
  return { site, documents };
}

// A generated pixel with a unique test label. No source image or third-party rights.
export function testRaster(marker: string) {
  const crc32 = (bytes: Buffer) => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("tEXt", Buffer.from(`Comment\0AR-CMS-TEST:${marker}`)),
    chunk("IDAT", deflateSync(Buffer.from([0, 23, 61, 50]))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

import { defineType, defineField } from "sanity";
import type { StructureResolver } from "sanity/structure";
import { e164Schema } from "@pato-food/content-contract";
import { arEditorialDateTimeSchema } from "@ar-crafts/content";
const nonBlank = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;
const datetime = (value: unknown) =>
  value === undefined ||
  arEditorialDateTimeSchema.safeParse(value).success ||
  "Usa una fecha válida con zona horaria explícita.";
const fieldTitles: Record<string, string> = {
  title: "Título",
  text: "Descripción",
  eyebrow: "Texto sobre el título",
  alt: "Descripción de la imagen (accesibilidad)",
  technique: "Técnica",
  level: "Nivel",
  mode: "Modalidad",
  caption: "Pie de foto",
  question: "Pregunta",
  code: "Código",
  presentationLabel: "Presentación",
  sourceRef: "Referencia de la fuente",
};
const string = (name: string, max = 120, required = true) =>
  defineField({
    name,
    title: fieldTitles[name] ?? name,
    type: "string",
    validation: (rule) =>
      required
        ? rule
            .required()
            .min(1)
            .max(max)
            .custom(
              (value) =>
                nonBlank(value) || "El texto no puede contener solo espacios.",
            )
        : rule.max(max),
  });
const image = defineField({
  name: "image",
  title: "Imagen",
  type: "image",
  options: { hotspot: true },
  validation: (rule) =>
    rule.custom((value) => {
      if (value === undefined) return true;
      const supplied = value as { asset?: { _ref?: string }; alt?: string };
      return (
        (nonBlank(supplied.asset?._ref) && nonBlank(supplied.alt)) ||
        "La imagen requiere un archivo y texto alternativo."
      );
    }),
  fields: [
    string("alt", 180),
    defineField({
      name: "kind",
      title: "Tipo de imagen",
      type: "string",
      initialValue: "photograph",
      options: {
        list: [
          { title: "Ilustración", value: "illustration" },
          { title: "Fotografía", value: "photograph" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rightsConfirmed",
      title: "Derechos de uso confirmados",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
const editorial = [
  defineField({
    name: "contentStatus",
    title: "Aprobación editorial",
    type: "string",
    initialValue: "pendingValidation",
    options: { list: ["demo", "pendingValidation", "approved"] },
    validation: (rule) => rule.required(),
  }),
  string("sourceRef", 240),
  defineField({
    name: "sourceObservedAt",
    title: "Fecha de consulta de la fuente",
    type: "datetime",
    validation: (rule) => rule.custom(datetime),
  }),
  defineField({
    name: "approvedAt",
    title: "Fecha de aprobación",
    type: "datetime",
    validation: (rule) =>
      rule
        .custom(datetime)
        .custom(
          (value, context) =>
            context.document?.contentStatus !== "approved" ||
            Boolean(value) ||
            "La aprobación requiere fecha y verificación del contenido.",
        ),
  }),
];
const sortOrder = defineField({
  name: "sortOrder",
  title: "Orden (menor número primero)",
  type: "number",
  initialValue: 0,
  validation: (rule) => rule.required().integer().min(0),
});
const price = defineField({
  name: "price",
  title: "Precio confirmado (PEN), vacío para consultar",
  type: "number",
  validation: (rule) => rule.positive(),
});
const copyText = (name: string, title: string, max: number) =>
  defineField({
    name,
    title,
    type: "text",
    rows: name === "title" ? 2 : 3,
    validation: (rule) =>
      rule
        .max(max)
        .custom(
          (value) =>
            value === undefined ||
            nonBlank(value) ||
            "Completa el texto o deja el campo vacío.",
        ),
  });
const copyGroup = (
  name: string,
  title: string,
  fields: ReturnType<typeof defineField>[],
) => defineField({ name, title, type: "object", fields });
const headingCopy = () => [
  copyText("eyebrow", "Texto sobre el título", 120),
  copyText("title", "Título (permite saltos de línea)", 180),
];
const sectionCopy = () => [
  ...headingCopy(),
  copyText("text", "Descripción", 800),
];
const journeyCopy = () => [
  copyText("title", "Título (permite saltos de línea)", 180),
  copyText("text", "Descripción", 800),
];
const pageCopy = copyGroup("pageCopy", "Textos de las secciones", [
  copyGroup("hero", "Portada · textos complementarios", [
    copyText("mobileEyebrow", "Texto sobre el título en móvil", 120),
    copyText("secondary", "Frase complementaria", 800),
    copyText("scrollCue", "Invitación a deslizar", 800),
  ]),
  copyGroup("journeys", "Caminos para crear", [
    ...headingCopy(),
    copyGroup("workshop", "Tarjeta de talleres", journeyCopy()),
    copyGroup("materials", "Tarjeta de materiales", journeyCopy()),
  ]),
  copyGroup("workshops", "Talleres", sectionCopy()),
  copyGroup("materials", "Materiales", sectionCopy()),
  copyGroup("about", "Nuestra esencia", headingCopy()),
  copyGroup("inspiration", "Inspiración", [
    ...sectionCopy(),
    copyGroup("stories", "Relato de la galería", [
      copyText("piece", "Pieza", 300),
      copyText("detail", "Detalle", 300),
      copyText("hands", "Manos", 300),
    ]),
  ]),
  copyGroup("faq", "Preguntas frecuentes", sectionCopy()),
  copyGroup("contact", "Contacto · presentación", sectionCopy()),
  copyGroup("footer", "Pie de página", [
    copyText("text", "Frase del pie (permite saltos de línea)", 800),
  ]),
]);
const site = defineType({
  name: "arSite",
  title: "AR Crafts · Página y contacto",
  type: "document",
  preview: {
    select: { title: "hero.title" },
    prepare: ({ title }) => ({
      title: "AR Crafts · Página y contacto",
      subtitle:
        typeof title === "string" ? title.replace(/\n/g, " ") : undefined,
    }),
  },
  fields: [
    ...editorial,
    defineField({
      name: "hero",
      title: "Portada",
      type: "object",
      fields: [
        string("eyebrow", 120),
        defineField({
          name: "mobileText",
          title: "Descripción breve para móvil (opcional)",
          type: "text",
          validation: (rule) => rule.max(500),
        }),
        defineField({
          name: "title",
          title: "Título (permite saltos de línea)",
          type: "text",
          rows: 2,
          validation: (rule) =>
            rule
              .required()
              .max(160)
              .custom(
                (value) =>
                  nonBlank(value) ||
                  "El texto no puede contener solo espacios.",
              ),
        }),
        defineField({
          name: "text",
          title: "Descripción",
          type: "text",
          validation: (rule) =>
            rule
              .required()
              .max(500)
              .custom(
                (value) =>
                  nonBlank(value) ||
                  "El texto no puede contener solo espacios.",
              ),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    pageCopy,
    defineField({
      name: "about",
      title: "Nuestra esencia (afirmaciones confirmadas)",
      type: "object",
      fields: [
        defineField({
          name: "text",
          title: "Descripción",
          type: "text",
          validation: (rule) =>
            rule
              .required()
              .max(800)
              .custom(
                (value) =>
                  nonBlank(value) ||
                  "El texto no puede contener solo espacios.",
              ),
        }),
        image,
      ],
    }),
    defineField({
      name: "contact",
      title: "Contacto",
      type: "object",
      initialValue: { confirmed: false },
      fields: [
        defineField({
          name: "confirmed",
          title: "Contacto verificado y autorizado",
          type: "boolean",
          initialValue: false,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "destinationE164",
          title: "Número E.164 confirmado",
          type: "string",
          hidden: (context) => !context.parent?.confirmed,
          validation: (rule) =>
            rule.custom(
              (value, context) =>
                !context.parent ||
                !(context.parent as { confirmed?: boolean }).confirmed ||
                e164Schema.safeParse(value).success ||
                "Requiere un E.164 confirmado.",
            ),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
});
const workshop = defineType({
  name: "arWorkshop",
  title: "Taller artesanal",
  type: "document",
  preview: {
    select: { title: "title", subtitle: "technique", media: "image" },
  },
  fields: [
    ...editorial,
    string("title", 120),
    string("technique", 60),
    defineField({
      name: "details",
      type: "text",
      validation: (rule) =>
        rule
          .required()
          .max(600)
          .custom(
            (value) =>
              nonBlank(value) || "El texto no puede contener solo espacios.",
          ),
    }),
    string("level", 80, false),
    string("mode", 80, false),
    image,
    price,
    sortOrder,
  ],
});
const edition = defineType({
  name: "arWorkshopEdition",
  title: "Edición de taller · hora de Lima",
  type: "document",
  preview: {
    select: { title: "workshop.title", subtitle: "startsAt" },
    prepare: ({ title, subtitle }) => ({
      title: typeof title === "string" ? title : "Edición de taller",
      subtitle: typeof subtitle === "string" ? subtitle : "Fecha por confirmar",
    }),
  },
  fields: [
    ...editorial,
    defineField({
      name: "workshop",
      title: "Taller relacionado",
      type: "reference",
      to: [{ type: "arWorkshop" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startsAt",
      title: "Inicio",
      type: "datetime",
      validation: (rule) => rule.required().custom(datetime),
    }),
    defineField({
      name: "endsAt",
      title: "Fin",
      type: "datetime",
      validation: (rule) =>
        rule
          .required()
          .custom(datetime)
          .custom(
            (value, context) =>
              !value ||
              Date.parse(value) >
                Date.parse(String(context.document?.startsAt)) ||
              "El fin debe ser posterior al inicio.",
          ),
    }),
    defineField({
      name: "timeZone",
      title: "Zona horaria de publicación",
      type: "string",
      initialValue: "America/Lima",
      readOnly: true,
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              value === "America/Lima" ||
              "La zona horaria debe ser America/Lima.",
          ),
    }),
  ],
});
const material = defineType({
  name: "arMaterial",
  title: "Material · una presentación",
  type: "document",
  preview: {
    select: { title: "title", subtitle: "presentationLabel", media: "image" },
  },
  fields: [
    ...editorial,
    string("title", 120),
    string("presentationLabel", 160),
    string("code", 40, false),
    image,
    price,
    defineField({
      name: "status",
      title: "Disponibilidad",
      type: "string",
      initialValue: "inquiry",
      options: {
        list: [
          { title: "Consultar disponibilidad", value: "inquiry" },
          { title: "No disponible (alternativas)", value: "unavailable" },
          { title: "Oculto", value: "hidden" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Destacado",
      type: "boolean",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    sortOrder,
  ],
});
const inspiration = defineType({
  name: "arInspiration",
  title: "Inspiración · foto autorizada",
  type: "document",
  preview: { select: { title: "caption", subtitle: "step", media: "image" } },
  fields: [
    ...editorial,
    {
      ...image,
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const supplied = value as
            | {
                asset?: { _ref?: string };
                alt?: string;
                kind?: string;
                rightsConfirmed?: boolean;
              }
            | undefined;
          if (
            !supplied ||
            !nonBlank(supplied.asset?._ref) ||
            !nonBlank(supplied.alt)
          )
            return "La imagen requiere un archivo y texto alternativo.";
          return (
            context.document?.contentStatus !== "approved" ||
            (supplied.kind === "photograph" &&
              supplied.rightsConfirmed === true) ||
            "La inspiración aprobada requiere una fotografía autorizada."
          );
        }),
    },
    string("caption", 120),
    defineField({
      name: "step",
      title: "Etapa de la galería",
      type: "string",
      options: {
        list: [
          { title: "Pieza", value: "piece" },
          { title: "Detalle", value: "detail" },
          { title: "Manos", value: "hands" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    sortOrder,
  ],
});
const faq = defineType({
  name: "arFaq",
  title: "Pregunta frecuente",
  type: "document",
  preview: { select: { title: "question" } },
  fields: [
    ...editorial,
    string("question", 180),
    defineField({
      name: "answer",
      type: "text",
      validation: (rule) =>
        rule
          .required()
          .max(800)
          .custom(
            (value) =>
              nonBlank(value) || "El texto no puede contener solo espacios.",
          ),
    }),
    sortOrder,
  ],
});
export const arSchemaTypes = [
  site,
  workshop,
  edition,
  material,
  inspiration,
  faq,
];
export const arSingletonTypes = new Set(["arSite"]);
export const arStructure: StructureResolver = (S) =>
  S.list()
    .title("AR Crafts")
    .items(
      arSchemaTypes.map((type) =>
        arSingletonTypes.has(type.name)
          ? S.listItem()
              .title(type.title ?? type.name)
              .id(type.name)
              .child(S.document().schemaType(type.name).documentId(type.name))
          : S.documentTypeListItem(type.name),
      ),
    );

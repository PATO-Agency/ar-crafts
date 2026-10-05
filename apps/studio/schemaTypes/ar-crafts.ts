import { defineType, defineField } from "sanity";
import type { StructureResolver } from "sanity/structure";
import { e164Schema } from "@pato-food/content-contract";
const string = (name: string, max = 120, required = true) =>
  defineField({
    name,
    type: "string",
    validation: (rule) =>
      required ? rule.required().min(1).max(max) : rule.max(max),
  });
const image = defineField({
  name: "image",
  type: "image",
  options: { hotspot: true },
  fields: [
    string("alt", 180),
    defineField({
      name: "kind",
      type: "string",
      initialValue: "photograph",
      options: { list: ["illustration", "photograph"] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rightsConfirmed",
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
  defineField({ name: "sourceObservedAt", type: "datetime" }),
  defineField({
    name: "approvedAt",
    title: "Fecha de aprobación",
    type: "datetime",
    validation: (rule) =>
      rule.custom(
        (value, context) =>
          context.document?.contentStatus !== "approved" ||
          Boolean(value) ||
          "La aprobación requiere fecha y verificación del contenido.",
      ),
  }),
];
const sortOrder = defineField({
  name: "sortOrder",
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
const site = defineType({
  name: "arSite",
  title: "AR Crafts · Página y contacto",
  type: "document",
  fields: [
    ...editorial,
    defineField({
      name: "hero",
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
          type: "text",
          rows: 2,
          validation: (rule) => rule.required().max(160),
        }),
        defineField({
          name: "text",
          type: "text",
          validation: (rule) => rule.required().max(500),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "about",
      title: "Nuestra esencia (afirmaciones confirmadas)",
      type: "object",
      fields: [
        defineField({
          name: "text",
          type: "text",
          validation: (rule) => rule.required().max(800),
        }),
        image,
      ],
    }),
    defineField({
      name: "contact",
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
  fields: [
    ...editorial,
    string("title", 120),
    string("technique", 60),
    defineField({
      name: "details",
      type: "text",
      validation: (rule) => rule.required().max(600),
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
  fields: [
    ...editorial,
    defineField({
      name: "workshop",
      type: "reference",
      to: [{ type: "arWorkshop" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startsAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endsAt",
      type: "datetime",
      validation: (rule) =>
        rule
          .required()
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
      type: "string",
      initialValue: "America/Lima",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
});
const material = defineType({
  name: "arMaterial",
  title: "Material · una presentación",
  type: "document",
  fields: [
    ...editorial,
    string("title", 120),
    string("presentationLabel", 160),
    string("code", 40, false),
    image,
    price,
    defineField({
      name: "status",
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
  fields: [
    ...editorial,
    { ...image, validation: (rule) => rule.required() },
    string("caption", 120),
    defineField({
      name: "step",
      type: "string",
      options: { list: ["piece", "detail", "hands"] },
      validation: (rule) => rule.required(),
    }),
    sortOrder,
  ],
});
const faq = defineType({
  name: "arFaq",
  title: "Pregunta frecuente",
  type: "document",
  fields: [
    ...editorial,
    string("question", 180),
    defineField({
      name: "answer",
      type: "text",
      validation: (rule) => rule.required().max(800),
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

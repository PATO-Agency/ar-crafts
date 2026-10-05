import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { singletonActions } from "@pato-food/sanity-schema";
import {
  arSchemaTypes as schemaTypes,
  arSingletonTypes as singletonTypes,
  arStructure as structure,
} from "./schemaTypes/ar-crafts";

const previewUrl =
  process.env.SANITY_STUDIO_PREVIEW_URL ||
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ||
  "http://localhost:3000";
const parsedPreviewUrl = new URL(previewUrl);
const previewOrigin = parsedPreviewUrl.origin;
const isLocalPreview =
  parsedPreviewUrl.protocol === "http:" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(parsedPreviewUrl.hostname);
if (parsedPreviewUrl.protocol !== "https:" && !isLocalPreview)
  throw new Error(
    "SANITY_STUDIO_PREVIEW_URL must use HTTPS or a loopback HTTP origin",
  );

// Buildable scaffold only. Supply a separately owned project to connect a Studio.
export default defineConfig({
  name: "ar-crafts-local",
  title: "AR Crafts — Contenido",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "localdemo",
  dataset: process.env.SANITY_STUDIO_DATASET || "development",
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        initial: previewUrl,
        previewMode: {
          enable: "/api/draft/enable",
          disable: "/api/draft/disable",
        },
      },
      allowOrigins: [previewOrigin],
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((t) => !singletonTypes.has(t.schemaType)),
  },
  document: {
    actions: (actions, context) =>
      singletonTypes.has(context.schemaType)
        ? actions.filter(
            (action) => action.action && singletonActions.has(action.action),
          )
        : actions,
  },
});

import { defineCliConfig } from "sanity/cli";
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "localdemo",
    dataset: process.env.SANITY_STUDIO_DATASET || "development",
  },
  studioHost: process.env.SANITY_STUDIO_HOST,
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID,
    autoUpdates: false,
  },
});

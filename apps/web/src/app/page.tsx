import { draftMode } from "next/headers";
import { getCraftPageContent } from "../features/ar-crafts/content-source";
import { CraftPageView } from "../features/ar-crafts/page-view";
export const revalidate = 300;
export default async function Home() {
  const draft = await draftMode();
  return (
    <CraftPageView
      content={await getCraftPageContent(draft.isEnabled)}
      previewExitAvailable={draft.isEnabled}
    />
  );
}

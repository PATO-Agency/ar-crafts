const editorial =
  '"id": _id, contentStatus, sourceRef, sourceObservedAt, approvedAt';
const image = '"src": asset->url, alt, rightsConfirmed, kind';
const approved =
  'contentStatus == "approved" && defined(approvedAt) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))';
const query = (filter: string) => `{
  "site": *[_type == "arSite" && _id in ["arSite", "drafts.arSite"] && ${filter}][0]{${editorial}, hero, about{text, "image": select(defined(image.asset) => image{${image}})}, contact{confirmed, destinationE164}},
  "workshops": *[_type == "arWorkshop" && ${filter}] | order(sortOrder asc)[0...3]{${editorial}, title, technique, details, level, mode, price, "image": select(defined(image.asset) => image{${image}})},
  "editions": *[_type == "arWorkshopEdition" && ${filter}] | order(startsAt asc)[0...30]{${editorial}, "workshopId": workshop._ref, startsAt, endsAt, timeZone},
  "materials": *[_type == "arMaterial" && ${filter} && status != "hidden"] | order(sortOrder asc)[0...12]{${editorial}, title, presentationLabel, code, price, status, featured, "image": select(defined(image.asset) => image{${image}})},
  "gallery": *[_type == "arInspiration" && ${filter}] | order(sortOrder asc)[0...8]{${editorial}, image{${image}}, caption, step},
  "faq": *[_type == "arFaq" && ${filter}] | order(sortOrder asc)[0...6]{${editorial}, question, answer}
}`;
export const publishedCraftQuery = query(approved);
export const previewCraftQuery = query('!(_id in path("versions.**"))');

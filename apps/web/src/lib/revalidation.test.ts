import { describe, expect, it } from "vitest";
import {
  parseSanityOperation,
  parseWebhookDocument,
  tagsForWebhook,
  tagsForArWebhook,
} from "./revalidation";

describe("webhook document contract", () => {
  it.each([
    "arSite",
    "arWorkshop",
    "arWorkshopEdition",
    "arMaterial",
    "arInspiration",
    "arFaq",
  ])("accepts only AR %s for the active endpoint", (type) => {
    expect(tagsForArWebhook({ _id: "published-id", _type: type })).toEqual([
      "ar-crafts",
    ]);
    expect(
      tagsForArWebhook({ _id: "drafts.published-id", _type: type }),
    ).toBeNull();
    expect(
      tagsForArWebhook({ _id: "versions.published-id", _type: type }),
    ).toBeNull();
  });

  it.each([
    "business",
    "whatsappConversion",
    "menuCategory",
    "menuItem",
    "galleryImage",
    "promotion",
    "faq",
    "testimonial",
    "unknown",
  ])("excludes %s from the AR endpoint", (type) => {
    expect(tagsForArWebhook({ _id: "published-id", _type: type })).toBeNull();
  });
  it.each([
    ["arSite", "ar-crafts"],
    ["arWorkshop", "ar-crafts"],
    ["arWorkshopEdition", "ar-crafts"],
    ["arMaterial", "ar-crafts"],
    ["arInspiration", "ar-crafts"],
    ["arFaq", "ar-crafts"],
    ["business", "business"],
    ["whatsappConversion", "business"],
    ["menuCategory", "menu"],
    ["menuItem", "menu"],
    ["galleryImage", "gallery"],
    ["promotion", "promotion"],
    ["faq", "faq"],
    ["testimonial", "testimonial"],
  ])("maps published %s documents", (type, tag) => {
    expect(tagsForWebhook({ _id: "published-id", _type: type })).toEqual([tag]);
  });

  it("keeps the payload canonical and excludes non-published identities", () => {
    expect(
      parseWebhookDocument({
        _id: "item-1",
        _type: "menuItem",
        title: "ignored",
      }),
    ).toEqual({ _id: "item-1", _type: "menuItem" });
    expect(
      tagsForWebhook({ _id: "drafts.item-1", _type: "menuItem" }),
    ).toBeNull();
    expect(
      tagsForWebhook({ _id: "versions.item-1", _type: "menuItem" }),
    ).toBeNull();
    expect(tagsForWebhook({ _id: "item-1", _type: "other" })).toBeNull();
  });

  it.each(["create", "UPDATE", "delete"])("accepts operation %s", (operation) =>
    expect(parseSanityOperation(operation)).not.toBeNull(),
  );
  it.each([null, "publish", "unpublish", "", "create,update"])(
    "rejects operation %s",
    (operation) => expect(parseSanityOperation(operation)).toBeNull(),
  );
});

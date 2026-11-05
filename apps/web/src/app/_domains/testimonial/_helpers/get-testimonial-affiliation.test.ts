import { describe, expect, it } from "vitest";

import { getTestimonialAffiliation } from "./get-testimonial-affiliation";

describe("getTestimonialAffiliation", () => {
  it("keeps the title, the organization and its website", () => {
    expect(
      getTestimonialAffiliation({
        authorTitle: " Founder ",
        organizationName: "Acme",
        websiteUrl: "https://acme.dev",
      }),
    ).toEqual({
      title: "Founder",
      organization: "Acme",
      websiteUrl: "https://acme.dev",
    });
  });

  it("hides the default organization name, whatever its case and spacing", () => {
    expect(
      getTestimonialAffiliation({
        authorTitle: "Developer",
        organizationName: "  my Organization ",
        websiteUrl: null,
      }),
    ).toEqual({ title: "Developer", organization: null, websiteUrl: null });
  });

  it("labels the website link with its host when the organization name is the default", () => {
    expect(
      getTestimonialAffiliation({
        authorTitle: null,
        organizationName: "My organization",
        websiteUrl: "https://www.acme.dev/about",
      }),
    ).toEqual({
      title: null,
      organization: "acme.dev",
      websiteUrl: "https://www.acme.dev/about",
    });
  });

  it("keeps the organization as plain text without a website", () => {
    expect(
      getTestimonialAffiliation({
        authorTitle: "",
        organizationName: "Acme",
        websiteUrl: null,
      }),
    ).toEqual({ title: null, organization: "Acme", websiteUrl: null });
  });

  it("drops a website that is not a valid URL", () => {
    expect(
      getTestimonialAffiliation({
        authorTitle: null,
        organizationName: "Acme",
        websiteUrl: "not a url",
      }),
    ).toEqual({ title: null, organization: "Acme", websiteUrl: null });
  });
});

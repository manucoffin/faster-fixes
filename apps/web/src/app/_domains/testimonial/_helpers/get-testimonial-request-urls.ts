// The public form and decline pages are keyed by the request token alone.
export function getTestimonialRequestUrls(appUrl: string, token: string) {
  const formUrl = `${appUrl}/testimonial/${encodeURIComponent(token)}`;
  return { formUrl, declineUrl: `${formUrl}/decline` };
}

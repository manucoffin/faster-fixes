// Uploads from the form are staged per request; submission copies the chosen
// image under the Testimonial-owned prefix, which nothing else ever deletes.
export function getTestimonialUploadPrefix(requestId: string) {
  return `testimonial-uploads/${requestId}/`;
}

export function getTestimonialPhotoKey(
  requestId: string,
  extension: string,
  now: Date,
) {
  return `testimonial-photos/${requestId}/${now.getTime()}.${extension}`;
}

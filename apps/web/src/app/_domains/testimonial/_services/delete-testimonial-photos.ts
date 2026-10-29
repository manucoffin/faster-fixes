import { deleteStorageObjects } from "@/server/storage/objects";

/**
 * Deletes Testimonial photo objects once their User is gone. A failure is
 * logged, not thrown: the User is already deleted and the rows with them.
 */
export async function deleteTestimonialPhotos({ keys }: { keys: string[] }) {
  if (keys.length === 0) return;

  try {
    const { errors } = await deleteStorageObjects(keys);
    if (errors.length > 0) {
      console.error("Failed to delete Testimonial photos", { errors });
    }
  } catch (error) {
    console.error("Failed to delete Testimonial photos", { keys, error });
  }
}

import { deleteTestimonialPhotos } from "@/app/_domains/testimonial/_services/delete-testimonial-photos";
import { listTestimonialPhotoKeys } from "@/app/_domains/testimonial/_services/list-testimonial-photo-keys";
import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";

export async function deleteAccount({
  userId,
  password,
  headers,
}: {
  userId: string;
  password: string;
  headers: Headers;
}) {
  const photoKeys = await listTestimonialPhotoKeys({ userId });

  try {
    await auth.api.deleteUser({
      body: {
        password,
      },
      headers,
    });

    await deleteTestimonialPhotos({ keys: photoKeys });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      // Better Auth reports a rejected password through the message, not a
      // code, and it keeps winning over the OAuth branch below: a message
      // naming both tells the User which of the two to act on.
      if (
        error.message.includes("Invalid") ||
        error.message.includes("incorrect") ||
        error.message.includes("password")
      ) {
        throw new BadRequestError("Password is incorrect.");
      }

      if (
        error.message.includes("OAuth") ||
        error.message.includes("provider")
      ) {
        throw new BadRequestError(
          "Please contact support to delete your account.",
        );
      }
    }

    throw error;
  }
}

import { UserType } from "@prisma/client";

export const UserTypeTranslation: Record<UserType, string> = {
  [UserType.PetParent]: "Pet Parent",
  [UserType.Professional]: "Professionnel",
};

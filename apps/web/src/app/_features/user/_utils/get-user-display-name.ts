import { ANONYMOUS_USER_NAME } from "@/app/_constants/app";

type UserWithOptionalProfile = {
  name?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export const getUserDisplayName = (
  user: UserWithOptionalProfile | null | undefined,
) => {
  if (!user) return ANONYMOUS_USER_NAME;

  if (user.profile?.firstName && user.profile.lastName) {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }

  return user.name || ANONYMOUS_USER_NAME;
};

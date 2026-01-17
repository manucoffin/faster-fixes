import { ProfessionalType } from "@prisma/client";

export const ProfessionalTypeTranslation: Record<ProfessionalType, string> = {
  [ProfessionalType.Company]: "Entreprise",
  [ProfessionalType.Breeder]: "Éleveur",
  [ProfessionalType.Association]: "Association",
};

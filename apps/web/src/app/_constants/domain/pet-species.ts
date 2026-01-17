import { PetSpecies } from "@prisma/client";

export const PetSpeciesTranslation: Record<PetSpecies, string> = {
  [PetSpecies.Dog]: "Chien",
  [PetSpecies.Cat]: "Chat",
};

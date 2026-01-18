import { z } from "zod";

export const PasswordSchema = z
  .string()
  .regex(
    new RegExp(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\W_]{8,}$/),
    "Votre mot de passe doit contenir au moins 8 caractères, dont au moins un chiffre, une lettre et un caractère spécial."
  );

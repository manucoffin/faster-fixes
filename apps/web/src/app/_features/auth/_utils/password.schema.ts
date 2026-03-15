import { z } from "zod";

export const PasswordSchema = z
  .string()
  .regex(
    new RegExp(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\W_]{8,}$/),
    "Your password must contain at least 8 characters, including at least one number, one letter, and one special character."
  );

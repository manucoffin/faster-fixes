"use client";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@workspace/ui/components/input-group";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  showToggle?: boolean;
}

export const PasswordInput = ({ showToggle = true, ...props }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <InputGroup>
      <InputGroupInput type={showPassword ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        {showToggle && (
          <InputGroupButton
            aria-label="Toggle password visibility"
            title="show"
            size="icon-xs"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>

  );
};



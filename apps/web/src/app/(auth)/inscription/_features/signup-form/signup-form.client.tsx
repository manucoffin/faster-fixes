"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";
import { signupAction } from "./signup.action";
import { SignupSchema } from "./signup.schema";

type SignupFormProps = Record<string, never>;

export function SignupForm({ }: SignupFormProps) {
  const router = useRouter();

  const { form, action, handleSubmitWithAction } = useHookFormAction(
    signupAction,
    zodResolver(SignupSchema),
    {
      actionProps: {
        onError: (error) => {
          console.error("Signup error:", error);
        },
      },
      formProps: {
        defaultValues: {
          email: "",
          password: "",
        },
      },
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-4">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                  disabled={action.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={action.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Server Error */}
        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={action.isPending}
          size="lg"
        >
          {action.isPending ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
}

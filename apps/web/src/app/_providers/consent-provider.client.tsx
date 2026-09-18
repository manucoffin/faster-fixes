"use client";

import {
  ConsentManagerDialog,
  ConsentManagerProvider,
  CookieBanner,
} from "@c15t/nextjs";
import { ClientSideOptionsProvider } from "@c15t/nextjs/client";
import { ReactNode } from "react";

type ConsentProviderProps = {
  children: ReactNode;
};

export function ConsentProvider({ children }: ConsentProviderProps) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "offline",
        consentCategories: ["necessary", "marketing", "measurement"], // Optional: Specify which consent categories to show in the banner.
        translations: {
          defaultLanguage: "en",
          translations: {
            en: {
              common: {
                acceptAll: "Accept all",
                rejectAll: "Reject all",
                customize: "Customize",
                save: "Save",
              },
              cookieBanner: {
                title: "Cookie management",
                description:
                  "We use cookies to improve your experience on our site, analyze traffic, and personalize content. You can accept all cookies, reject them, or customize your preferences.",
              },
              consentManagerDialog: {
                title: "Privacy settings",
                description:
                  "Manage your cookie and privacy preferences. You can change these settings at any time.",
              },
              consentTypes: {
                necessary: {
                  title: "Necessary cookies",
                  description:
                    "These cookies are essential for the website to function and cannot be disabled. They are usually set in response to actions you take that constitute a request for services.",
                },
                marketing: {
                  title: "Marketing cookies",
                  description:
                    "These cookies allow us to personalize advertising and measure the effectiveness of our marketing campaigns. They may be set by our advertising partners.",
                },
                measurement: {
                  title: "Analytics cookies",
                  description:
                    "These cookies help us analyze website usage, understand how visitors interact with our site, and improve our services.",
                },
              },
            },
          },
        },
      }}
    >
      <ClientSideOptionsProvider>
        <CookieBanner />
        <ConsentManagerDialog />

        {children}
      </ClientSideOptionsProvider>
    </ConsentManagerProvider>
  );
}

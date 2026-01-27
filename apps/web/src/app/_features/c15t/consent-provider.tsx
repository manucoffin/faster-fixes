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
          defaultLanguage: "fr",
          translations: {
            fr: {
              common: {
                acceptAll: "Tout accepter",
                rejectAll: "Tout refuser",
                customize: "Personnaliser",
                save: "Enregistrer",
              },
              cookieBanner: {
                title: "Gestion des cookies",
                description:
                  "Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. Vous pouvez accepter tous les cookies, les refuser ou personnaliser vos préférences.",
              },
              consentManagerDialog: {
                title: "Paramètres de confidentialité",
                description:
                  "Gérez vos préférences de cookies et de confidentialité. Vous pouvez modifier ces paramètres à tout moment.",
              },
              consentTypes: {
                necessary: {
                  title: "Cookies nécessaires",
                  description:
                    "Ces cookies sont indispensables au fonctionnement du site web et ne peuvent pas être désactivés. Ils sont généralement activés en réponse à des actions que vous effectuez et qui constituent une demande de services.",
                },
                marketing: {
                  title: "Cookies marketing",
                  description:
                    "Ces cookies nous permettent de personnaliser la publicité et de mesurer l'efficacité de nos campagnes marketing. Ils peuvent être définis par nos partenaires publicitaires.",
                },
                measurement: {
                  title: "Cookies de mesure d'audience",
                  description:
                    "Ces cookies nous aident à analyser l'utilisation du site web, à comprendre comment les visiteurs interagissent avec notre site et à améliorer nos services.",
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

import { INSTAGRAM_URL, LINKEDIN_URL, TIKTOK_URL, YOUTUBE_URL } from "@/app/_constants/company";
import { ManageConsentButton } from "@/app/_features/c15t/manage-consent-button";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { InstagramIcon } from "@workspace/ui/components/icons/instagram-icon";
import { LinkedinIcon } from "@workspace/ui/components/icons/linkedin-icon";
import { TiktokIcon } from "@workspace/ui/components/icons/tiktok-icon";
import { YoutubeIcon } from "@workspace/ui/components/icons/youtube-icon";
import { Route } from "next";
import Link from "next/link";
import { AppLogo } from "../logo/app-logo";

const data = {
  instaLink: INSTAGRAM_URL,
  linkedinLink: LINKEDIN_URL,
  youtubeLink: YOUTUBE_URL,
  tiktokLink: TIKTOK_URL,
  company: {
    name: "Startup Maker",
    description:
      "Alimentez votre parcours entrepreneurial avec notre plateforme complète conçue pour vous aider à construire, développer et faire croître votre entreprise.",
  },
};

const socialLinks = [
  { icon: YoutubeIcon, label: "YouTube", href: data.youtubeLink },
  { icon: TiktokIcon, label: "TikTok", href: data.youtubeLink },
  { icon: InstagramIcon, label: "Instagram", href: data.instaLink },
  { icon: LinkedinIcon, label: "LinkedIn", href: data.linkedinLink },
];

const legalLinks = [
  {
    text: "Politique de confidentialité",
    href: "/politique-de-confidentialite" as Route,
  },
  { text: "CGU", href: "/cgu" as Route },
  { text: "CGV", href: "/cgv" as Route },
];

const aboutLinks = [
  { text: "À propos", href: "/a-propos" as Route },
  { text: "Blog", href: "/blog" as Route },
];

const helpfulLinks = [
  {
    text: "Commencer",
    href: "/getting-started" as Route,
  },
  { text: "Tarifs", href: "/pricing" as Route },
  { text: "Contact", href: "/contact" as Route },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full place-self-end border-t">
      <div className="container mx-auto px-4 pt-16 pb-6 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <div className="text-primary flex justify-center gap-2 sm:justify-start">
              <AppLogo iconClassName="w-32" />
            </div>

            <p className="text-muted-foreground mx-auto mt-6 max-w-md text-center leading-relaxed sm:mx-0 sm:max-w-xs sm:text-left">
              {data.company.description}
            </p>

            <ul className="mt-8 flex justify-center gap-6 sm:justify-start md:gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon
                      className="fill-muted-foreground size-6"
                      fill="currentColor"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-2">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">À propos</p>
              <ul className="mt-8 space-y-4 text-sm">
                {aboutLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href}>
                      <AnimatedText >{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Utile</p>
              <ul className="mt-8 space-y-4 text-sm">
                {helpfulLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href}>
                      <AnimatedText >{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Légal</p>
              <ul className="mt-8 space-y-4 text-sm">
                {legalLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href}>
                      <AnimatedText >{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
                <li>
                  <ManageConsentButton className="px-0 py-0 font-normal h-fit hover:no-underline" >
                    <AnimatedText >Préférences de confidentialité</AnimatedText>
                  </ManageConsentButton>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t pt-6 pb-4">
        <div className="container mx-auto px-4">
          <div className="text-center sm:flex sm:justify-between sm:text-left">
            <p className="text-sm">
              <span className="block sm:inline">Tous droits réservés.</span>
            </p>

            <p className="mt-4 text-sm sm:order-first sm:mt-0">
              &copy; {currentYear} {data.company.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

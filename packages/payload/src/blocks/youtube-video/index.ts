import type { Block } from "payload";

export const YouTubeBlock: Block = {
  slug: "youtube-block",
  interfaceName: "YouTubeBlock",
  labels: {
    singular: {
      en: "YouTube Video",
      fr: "Vidéo YouTube",
    },
    plural: {
      en: "YouTube Videos",
      fr: "Vidéos YouTube",
    },
  },
  fields: [
    {
      name: "videoURL",
      label: {
        en: "YouTube Video URL",
        fr: "URL de la vidéo YouTube",
      },
      type: "text",
      required: true,
      validate: (val: string | null | undefined) => {
        if (!val) return "Video URL is required";
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(val) || "Please enter a valid YouTube URL";
      },
      admin: {
        description: {
          en: "Enter a YouTube video URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)",
          fr: "Entrez une URL de vidéo YouTube (ex: https://youtube.com/watch?v=dQw4w9WgXcQ)",
        },
      },
    },
    {
      name: "title",
      label: {
        en: "Video Title (Optional)",
        fr: "Titre de la vidéo (Optionnel)",
      },
      type: "text",
      required: false,
      admin: {
        description: {
          en: "Optional title to display above the video",
          fr: "Titre optionnel à afficher au-dessus de la vidéo",
        },
      },
    },
  ],
};

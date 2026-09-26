import type { VideoObject, WithContext } from "schema-dts";

type YoutubeEmbedProps = {
  id: string;
  title: string;
  description: string;
  uploadDate: string; // ISO 8601 date, e.g. "2026-03-15"
  duration?: string; // ISO 8601 duration, e.g. "PT5M30S"
};

export function YoutubeEmbed({
  id,
  title,
  description,
  uploadDate,
  duration,
}: YoutubeEmbedProps) {
  const jsonLd: WithContext<VideoObject> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    uploadDate,
    contentUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    ...(duration ? { duration } : {}),
  };

  return (
    <div className="not-prose aspect-video w-full overflow-hidden rounded-lg border">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"
      />
    </div>
  );
}

import { JSXConverters } from "@payloadcms/richtext-lexical/react";

const getVideoId = (url: string) => {
  const regex =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regex);
  return match ? match[1] : null;
};

export const youtubeBlockConverter: JSXConverters<any> = {
  youtubeBlock: ({ node }) => {
    const { videoURL, title } = node.fields;
    const videoId = getVideoId(videoURL);

    if (!videoId) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Invalid YouTube URL: {videoURL}
          </p>
        </div>
      );
    }

    return (
      <div className="youtube-block space-y-3">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={title || "YouTube video"}
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md"
          />
        </div>
      </div>
    );
  },
};

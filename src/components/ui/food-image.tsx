"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  /** Emoji shown if the image fails to load. */
  fallbackEmoji?: string;
};

const GRADIENTS = [
  "from-[#7c1fa8] to-[#ffd60a]",
  "from-[#8b1fd6] to-[#f0c400]",
  "from-[#6a12a8] to-[#ffe066]",
];

/**
 * Image with a graceful fallback.
 *
 * If the photo is missing (deleted file, typo in the path, or a deploy that did
 * not include the public folder), we render a branded gradient with an emoji
 * instead of the browser's broken-image icon.
 */
export function FoodImage({ src, alt, className = "", fallbackEmoji = "🍇" }: Props) {
  const [failed, setFailed] = useState(false);
  const broken = !src || failed;

  if (broken) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-gradient-to-br ${
          GRADIENTS[alt.length % GRADIENTS.length]
        } ${className}`}
      >
        <span className="text-2xl drop-shadow">{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
  );
}

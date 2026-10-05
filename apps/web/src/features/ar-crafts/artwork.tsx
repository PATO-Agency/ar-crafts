"use client";
import Image from "next/image";
import { useState } from "react";
import type { CraftImage } from "./model";
export function CraftArtwork({
  image,
  hero = false,
}: {
  image?: CraftImage;
  hero?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <div className={`craft-art ${hero ? "butterfly-art" : ""}`}>
      {image && failedSource !== image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={hero ? 720 : 624}
          height={hero ? 680 : 480}
          sizes={
            hero
              ? "(max-width: 767px) 280px, 48vw"
              : "(max-width: 767px) 90vw, (max-width: 1023px) 45vw, 30vw"
          }
          loading={hero ? "eager" : "lazy"}
          unoptimized={image.src.endsWith(".svg")}
          onError={() => setFailedSource(image.src)}
        />
      ) : (
        <span className="art-placeholder">
          {image ? "Imagen no disponible" : "Imagen por confirmar"}
        </span>
      )}
    </div>
  );
}

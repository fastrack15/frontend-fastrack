import { useState } from "react";
import { badgeGray } from "../ui/styles";
import ZoomableImage from "../ui/ZoomableImage";

function PhotoFrame({ title, name, date, url }) {
  const hasUrl = typeof url === "string" && url.trim() !== "";
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = failedUrl === url;

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3 text-center">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
          {name && <span className={badgeGray}>{name}</span>}
          <span>{date}</span>
        </div>
      </div>

      <div className="flex h-56 items-center justify-center bg-gray-50">
        {hasUrl && !failed ? (
          <ZoomableImage
            src={url}
            title={title}
            caption={[name, date].filter(Boolean).join(" · ")}
            onError={() => setFailedUrl(url)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
            <i className="fa-regular fa-image text-4xl" aria-hidden="true" />
            <span className="text-sm">
              {hasUrl ? "Foto tidak tersedia" : "Foto belum tersedia"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoFrame;

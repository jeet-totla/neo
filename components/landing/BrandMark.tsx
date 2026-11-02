"use client";

import { useState } from "react";

/** A source's own icon, loaded from the web at view time, with a letter tile if it can't load. */
export function BrandMark({ domain, name, size = 28 }: { domain: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex-shrink-0 grid place-items-center rounded-[8px] bg-[#f4f1ea] overflow-hidden" style={{ width: size, height: size }}>
      {failed ? (
        <span className="text-[12px] font-semibold text-[#0a0a0b]">{name[0]}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" width={size - 10} height={size - 10}
          loading="lazy" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

/* eslint-disable @next/next/no-img-element -- Stable public image routes cache pixels; private studio images use scoped signed URLs. */
export default function MemeMedia({ src, caption, rendered, eager = false, fetchPriority = "auto" }: { src: string; caption: string; rendered?: boolean; eager?: boolean; fetchPriority?: "high" | "low" | "auto" }) {
 return <div className={`meme-media${rendered ? " is-rendered" : ""}`}>
  {!rendered && <p className="meme-overlay-caption">{caption}</p>}
  <img src={src} alt={rendered ? caption : "Image accompanying the AI-generated caption"} draggable={false} loading={eager ? "eager" : "lazy"} fetchPriority={fetchPriority} decoding="async"/>
 </div>;
}

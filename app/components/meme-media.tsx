/* eslint-disable @next/next/no-img-element -- Protected media is served by a stable authorization-aware image route. */
export default function MemeMedia({ src, caption, rendered, eager = false }: { src: string; caption: string; rendered?: boolean; eager?: boolean }) {
 return <div className={`meme-media${rendered ? " is-rendered" : ""}`}>
  {!rendered && <p className="meme-overlay-caption">{caption}</p>}
  <img src={src} alt={rendered ? caption : "Image accompanying the AI-generated caption"} draggable={false} loading={eager ? "eager" : "lazy"} decoding="async"/>
 </div>;
}

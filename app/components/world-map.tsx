"use client";
import { useId, useState } from "react";
import shapes from "../../lib/data/world-map.json";
import { countries } from "../../lib/countries";
import { visitOpacity } from "../../lib/map-colors";
import type { VisitCount } from "../../lib/travel";

const knownCodes = new Set(countries.map(country => country.code));
export default function WorldMap({ counts, personal = false }: { counts: VisitCount[]; personal?: boolean }) {
  const titleId = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const byCode = new Map(counts.map(row => [row.country_code, Number(row.visitor_count)]));
  const max = Math.max(1, ...byCode.values());
  const chosen = countries.find(country => country.code === selected);
  const chosenCount = selected ? byCode.get(selected) ?? 0 : 0;
  return <section className="atlas" aria-label={personal ? "Your visited countries map" : "Community travel map"}>
    <div className="map-topline"><span>{personal ? "YOUR TRAVEL ATLAS" : "THE COMMUNITY ATLAS"}</span><span>Click a country to explore</span></div>
    <div className="map-scroll" tabIndex={0} aria-label="Scrollable world map">
      <svg viewBox="0 0 1100 540" role="group" aria-labelledby={titleId} style={{ width: `${zoom * 100}%`, minWidth: "100%" }}>
        <title id={titleId}>{personal ? "Countries you have visited" : "Countries visited by our community"}</title>
        <g>{shapes.map(shape => {
          const count = byCode.get(shape.code) ?? 0;
          const known = knownCodes.has(shape.code);
          return <g key={shape.code}>
            <path d={shape.path ?? undefined} fill="#dce4df" stroke="#f4f7f3" strokeWidth="0.7" />
            <path d={shape.path ?? undefined} className="map-country" fill="#23634e" fillOpacity={personal ? (count ? 1 : 0) : visitOpacity(count, max)}
              stroke={selected === shape.code ? "#132f25" : "#f4f7f3"} strokeWidth={selected === shape.code ? 1.8 : 0.6}
              role={known ? "button" : undefined} tabIndex={known ? 0 : undefined}
              aria-label={`${shape.name}: ${personal ? (count ? "visited" : "not yet visited") : `${count} ${count === 1 ? "traveler" : "travelers"}`}`}
              aria-pressed={known ? selected === shape.code : undefined}
              onClick={() => known && setSelected(shape.code)} onKeyDown={event => { if (known && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelected(shape.code); } }}>
              <title>{shape.name} · {count} {count === 1 ? "traveler" : "travelers"}</title>
            </path>
          </g>;
        })}</g>
      </svg>
    </div>
    <div className="map-bottomline">
      <div className="map-readout" aria-live="polite">{chosen ? <><strong>{chosen.name}</strong><span>{personal ? (chosenCount ? "On your travel list" : "Not on your list yet") : `${chosenCount} ${chosenCount === 1 ? "traveler has" : "travelers have"} been here`}</span></> : <><strong>The world, one country at a time.</strong><span>Hover, tap, or use your keyboard to explore.</span></>}</div>
      <div className="map-tools"><button type="button" onClick={() => setZoom(Math.max(1, zoom - 0.5))} disabled={zoom === 1} aria-label="Zoom out">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(Math.min(3, zoom + 0.5))} disabled={zoom === 3} aria-label="Zoom in">+</button></div>
    </div>
    <div className="map-legend"><span className="unvisited-key" /> Not visited {personal ? <><span className="visited-key" /> Visited by you</> : <><span className="legend-ramp" /> Fewer travelers <span>→</span> More travelers <span className="legend-max">Highest count: {!counts.length ? 0 : max}</span></>}</div>
  </section>;
}

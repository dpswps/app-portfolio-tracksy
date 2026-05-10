"use client";

import { useAppStore } from "@/stores/useAppStore";

type ThemePreset = {
  id: string;
  name: string;
  bg: string;
};

// Build an SVG gradient as a base64-encoded data URL. Each preset is a
// vertically-tall card-shaped gradient that doubles as both the canvas
// background AND the swatch shown in the picker row.
function svgGradient(stops: Array<{ off: number; color: string }>, accent?: string) {
  const stopXml = stops
    .map((s) => `<stop offset="${s.off}" stop-color="${s.color}"/>`)
    .join("");
  const accentBlob = accent
    ? `<circle cx="120" cy="500" r="180" fill="${accent}" opacity="0.45"/>` +
      `<circle cx="320" cy="200" r="120" fill="${accent}" opacity="0.35"/>`
    : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="700" viewBox="0 0 400 700">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stopXml}</linearGradient></defs>` +
    `<rect width="400" height="700" fill="url(#g)"/>` +
    accentBlob +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const THEMES: ThemePreset[] = [
  {
    id: "wave",
    name: "Wave",
    bg: svgGradient(
      [
        { off: 0, color: "#5b21b6" },
        { off: 0.5, color: "#8b5cf6" },
        { off: 1, color: "#ec4899" },
      ],
      "#a78bfa",
    ),
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: svgGradient(
      [
        { off: 0, color: "#fb923c" },
        { off: 0.55, color: "#f472b6" },
        { off: 1, color: "#7c3aed" },
      ],
      "#fde68a",
    ),
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: svgGradient(
      [
        { off: 0, color: "#0ea5e9" },
        { off: 0.5, color: "#0369a1" },
        { off: 1, color: "#0f172a" },
      ],
      "#67e8f9",
    ),
  },
  {
    id: "forest",
    name: "Forest",
    bg: svgGradient(
      [
        { off: 0, color: "#86efac" },
        { off: 0.55, color: "#10b981" },
        { off: 1, color: "#064e3b" },
      ],
      "#a7f3d0",
    ),
  },
  {
    id: "dawn",
    name: "Dawn",
    bg: svgGradient(
      [
        { off: 0, color: "#fef3c7" },
        { off: 0.5, color: "#fda4af" },
        { off: 1, color: "#9d174d" },
      ],
      "#fff1f2",
    ),
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: svgGradient(
      [
        { off: 0, color: "#1e1b4b" },
        { off: 0.55, color: "#312e81" },
        { off: 1, color: "#000" },
      ],
      "#818cf8",
    ),
  },
  {
    id: "candy",
    name: "Candy",
    bg: svgGradient(
      [
        { off: 0, color: "#a5f3fc" },
        { off: 0.5, color: "#f0abfc" },
        { off: 1, color: "#fb7185" },
      ],
      "#fbcfe8",
    ),
  },
];

export default function DesignSubmenu() {
  const submenu = useAppStore((s) => s.studioDesignSubmenu);
  const bg = useAppStore((s) => s.studioBackground);
  const apply = useAppStore((s) => s.applyStudioTheme);
  const showToast = useAppStore((s) => s.showToast);

  if (submenu !== "theme") return null;

  return (
    <div className="design-theme-row">
      <div className="dtr-scroll">
        {THEMES.map((th) => {
          const active = bg === th.bg;
          return (
            <button
              key={th.id}
              className={`dtr-thumb${active ? " active" : ""}`}
              style={{ backgroundImage: `url("${th.bg}")` }}
              aria-label={th.name}
              title={th.name}
              onClick={() => {
                apply(th.bg);
                showToast(`${th.name} 테마 적용됨`);
              }}
            >
              <span className="dtr-name">{th.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

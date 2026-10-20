import { DISTRICTS, type District } from "./lore";
import type { Panel, PanelShot, Setting, SlotShape } from "./types";

/* ---------------- page layouts ---------------- */

export interface Template {
  areas: string;
  rows: string;
  cols: string;
  shapes: SlotShape[];
}

/** 4-panel manga page layouts. Slot shapes decide the size each panel is drawn at. */
export const TEMPLATES: Template[] = [
  { areas: `"a a" "b c" "d d"`, rows: "1fr 1.15fr 1fr", cols: "1fr 1fr", shapes: ["wide", "square", "square", "wide"] },
  { areas: `"a b" "a c" "d d"`, rows: "1fr 1fr 1.05fr", cols: "1.05fr 1fr", shapes: ["tall", "square", "square", "wide"] },
  { areas: `"a a" "b d" "c d"`, rows: "1fr 1fr 1fr", cols: "1fr 1.05fr", shapes: ["wide", "square", "square", "tall"] },
];
/** 3-panel layouts, for pages the writer keeps short. */
export const TEMPLATES3: Template[] = [
  { areas: `"a a" "b c"`, rows: "1fr 1.35fr", cols: "1fr 1fr", shapes: ["wide", "tall", "tall"] },
  { areas: `"a" "b" "c"`, rows: "1fr 1fr 1fr", cols: "1fr", shapes: ["wide", "wide", "wide"] },
];
export const templateFor = (page: { template: number; panels: unknown[] }) =>
  page.panels.length === 3 ? TEMPLATES3[page.template % TEMPLATES3.length] : TEMPLATES[page.template % TEMPLATES.length];
export const AREAS = ["a", "b", "c", "d"];
export const PANELS_PER_PAGE = 4;

export const SIZE: Record<SlotShape, [number, number]> = {
  wide: [1024, 512],
  tall: [512, 768],
  square: [512, 512],
};

/* ---------------- scenery library (pre-drawn, no characters) ---------------- */

export const SETTING_DESC: Record<District["library"], string> = {
  city: "a vast asian-inspired fantasy city skyline with towers, paper lanterns and arched bridges",
  rooftop: "city rooftops with water tanks, antennas, laundry lines and a view of the skyline",
  market: "a crowded street-food market with stalls, hanging lanterns and steaming dumpling baskets",
  kitchen: "a cosy bakery kitchen with shelves of bread, copper pots and hanging utensils",
  forest: "a bamboo forest with an old mossy stone shrine and a torii gate",
  night: "a narrow back alley at night with neon signs, puddles and hanging lanterns",
  lair: "a dark abandoned factory lair with chains, broken windows and a throne made of crates",
  sky: "a sky of towering dramatic clouds above the city with a long suspension bridge below",
  home: "a small cosy bedroom with a round window, a food bowl and a cushion bed",
  street: "a busy city street with little shops, shop signs, bicycles and power lines",
};

export type Tone = "calm" | "tense" | "action" | "dark";
export const TONES: Tone[] = ["calm", "tense", "action", "dark"];
export const TONE_DESC: Record<Tone, string> = {
  calm: "peaceful soft morning light, gentle atmosphere",
  tense: "dramatic shadows, tilted dutch angle, ominous atmosphere",
  action: "dynamic extreme perspective, flying debris, explosive energy",
  dark: "night, heavy black ink, deep shadows, moody rain",
};

export function toneFor(mood: Panel["mood"]): Tone {
  if (mood === "action") return "action";
  if (mood === "dark") return "dark";
  if (mood === "tense" || mood === "sad") return "tense";
  return "calm";
}

export function libraryPrompt(setting: District["library"], tone: Tone) {
  return `black and white manga panel background art, detailed ink lineart, screentone shading, high contrast, professional shonen manga illustration, ${SETTING_DESC[setting]}, ${TONE_DESC[tone]}, empty scene, no people, no characters, no animals, no text, no letters, no signs with writing`;
}

export const district = (id: Setting): District => DISTRICTS.find((d) => d.id === id) ?? DISTRICTS.find((d) => d.id === "lanternrow")!;

/** Pre-drawn fallback art for a district (only used if drawing fails). */
export const libraryUrl = (setting: Setting, tone: Tone) =>
  `/bg/${(SETTING_DESC as Record<string, string>)[setting] ? setting : district(setting).library}-${tone}.webp`;

/* ---------------- panel art direction ---------------- */

const SHOT: Record<PanelShot, string> = {
  "extreme-closeup": "extreme close-up on the face of",
  closeup: "close-up shot of",
  medium: "medium shot of",
  wide: "wide shot of",
  establishing: "establishing shot with, small in the scene,",
  action: "dynamic action shot with speed lines of",
};

const STYLE_BW =
  "professional black and white shonen manga panel, strictly monochrome grayscale ink, no color at all, clean bold ink lineart, screentone shading, high contrast, expressive, dynamic composition";
const SINGLE = "One single illustration filling the whole frame: no panel borders, no comic grid, no split screen, no frames inside the image";
// The image model's output filter flags far more often when a prompt talks about
// children, body proportions, clothing or safety ("chibi", "full body", "wholesome",
// "fully clothed", "no blood"…) — measured: ~45–65% pass with them, ~95% without.
// So describe only what to draw, never what to avoid.
const SAFE = "Action shown with glowing energy, speed lines and dust clouds";
const STYLE_COLOR =
  "full-color manga splash panel, vibrant anime cel shading, dramatic lighting, rich saturated colors";

const CHARACTER_RULE =
  "keep each character exactly as in its reference image: same face, same eyes and eyewear, same headwear, same outfit, same accessories and colours as tones";

/** Prompt for a drawn panel. Image 0 is the hero; image 1 (if any) is the cast member. */
/**
 * Prompt for a drawn panel. Image 0 is the hero (or the rival when alone);
 * image 1 is the rival. Everyone else is drawn from their written design, so
 * nobody but the actual NFT holder's Chog looks like the NFT.
 */
export function panelPrompt(
  panel: Pick<Panel, "shot" | "setting" | "scene" | "action" | "characters" | "mood" | "color">,
  others: { name: string; look: string }[] = [],
) {
  const both = panel.characters.includes("hero") && panel.characters.includes("cast");
  const chogs = panel.characters.length;
  const who = both
    ? "the character from image 0 (\"the hero\") and the character from image 1 (\"the rival\") together"
    : chogs
      ? `the character from image 0 (${panel.characters[0] === "cast" ? '"the rival"' : '"the hero"'})`
      : "";
  const cast = others.length
    ? `Other characters in this panel, each drawn exactly from their own description (they are different creatures and must NOT resemble the reference image): ${others.map((o) => `${o.name} — ${o.look}`).join("; ")}.`
    : "";
  const exclusive = chogs
    ? `Only ${both ? "those two characters" : "that one character"} may look like the reference image${both ? "s" : ""}; draw exactly one of each — never duplicate them, never give anyone else their face, hat, eyewear or clothes, and don't give them anyone else's clothing or accessories.`
    : others.length
      ? "None of these characters is a cute mascot with a cap and glasses; follow their descriptions."
      : "";
  const style = panel.color ? STYLE_COLOR : STYLE_BW;
  return [
    who ? `${SHOT[panel.shot]} ${who}: ${panel.action}.` : `${panel.action}.`,
    cast,
    `Setting: ${panel.scene}. Location: ${district(panel.setting).name} — ${district(panel.setting).look}.`,
    `Mood: ${panel.mood}.`,
    style + ".",
    SINGLE + ".",
    SAFE + ".",
    chogs ? CHARACTER_RULE + "." : "",
    exclusive,
    "No text, no letters, no speech bubbles, no captions, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function coverPrompt(scene: string, action: string) {
  return `Manga volume cover illustration: the character from image 0 (the hero), ${action}. Background: ${scene}. ${STYLE_COLOR}, heroic composition with the hero large and centred, the only character resembling image 0. ${SINGLE}. ${CHARACTER_RULE}. No text, no letters, no title, no watermark.`;
}

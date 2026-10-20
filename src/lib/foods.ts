import type { Dim, FoodId, Personality } from "./types";

export interface Food {
  id: FoodId;
  name: string;
  emoji: string;
  blurb: string; // what the player sees — a flavour, never the effect
  pull: Partial<Record<Dim, number>>; // hidden
  reactions: string[];
}

export const FOODS: Record<FoodId, Food> = {
  riceball: {
    id: "riceball",
    name: "Rice Ball",
    emoji: "🍙",
    blurb: "Warm, simple, homemade.",
    pull: { kindness: 2, courage: 1, energy: 1 },
    reactions: ["It munches happily and leans against you.", "Crumbs everywhere. It looks… content.", "It saves half for later. Interesting."],
  },
  chili: {
    id: "chili",
    name: "Ghost Chili",
    emoji: "🌶️",
    blurb: "Hotter than the sun. Probably a bad idea.",
    pull: { courage: 3, chaos: 2, kindness: -1 },
    reactions: ["Its face goes red. Steam shoots out of its ears!", "It screams, then asks for another one.", "Its eyes are watering… but it looks fearless now."],
  },
  mushroom: {
    id: "mushroom",
    name: "Glowing Mushroom",
    emoji: "🍄",
    blurb: "Found it in the forest. It hums softly.",
    pull: { wisdom: 2, chaos: 3, darkness: 1 },
    reactions: ["It stares at the wall for a long time.", "It whispers something to the moon.", "Its pupils spiral. It says it can see sounds."],
  },
  honey: {
    id: "honey",
    name: "Golden Honey",
    emoji: "🍯",
    blurb: "Sticky, sweet, impossible to share.",
    pull: { greed: 3, kindness: 1, energy: 1 },
    reactions: ["It hugs the jar and won't let go.", "Paws stuck together. It doesn't care.", "It licks the jar clean and eyes yours."],
  },
  fish: {
    id: "fish",
    name: "Raw Fish",
    emoji: "🐟",
    blurb: "Fresh from the docks. Still wiggling.",
    pull: { courage: 2, darkness: 1, energy: 2 },
    reactions: ["It eats it in one gulp. Wild.", "It growls at the fish before eating it.", "Something primal flickers in its eyes."],
  },
  tea: {
    id: "tea",
    name: "Moon Tea",
    emoji: "🍵",
    blurb: "Brewed under a full moon.",
    pull: { wisdom: 3, energy: -1, kindness: 1 },
    reactions: ["It sips slowly and sighs like an old master.", "It closes its eyes and nods, as if understanding everything.", "Calm. Too calm."],
  },
  candy: {
    id: "candy",
    name: "Neon Candy",
    emoji: "🍬",
    blurb: "Glows in the dark. Not FDA approved.",
    pull: { mischief: 3, energy: 3, wisdom: -1 },
    reactions: ["ZOOMIES! It bounces off three walls.", "It giggles at nothing. Suspicious.", "It's vibrating. Literally vibrating."],
  },
  cake: {
    id: "cake",
    name: "Royal Cake",
    emoji: "🍰",
    blurb: "Fit for a king. Very, very rich.",
    pull: { greed: 2, mischief: 1, energy: -1 },
    reactions: ["It eats like royalty and demands a crown.", "Cream on its face. It looks smug.", "It wants another. And another."],
  },
  bread: {
    id: "bread",
    name: "Stolen Bread",
    emoji: "🥖",
    blurb: "Nobody saw you take it. Probably.",
    pull: { mischief: 2, darkness: 2, kindness: -1 },
    reactions: ["It eats quickly, looking over its shoulder.", "It learned something today. Something sneaky.", "It hides the crumbs. Smart. Too smart."],
  },
  coffee: {
    id: "coffee",
    name: "Midnight Coffee",
    emoji: "☕",
    blurb: "Black. Bitter. Wakes the dead.",
    pull: { energy: 3, darkness: 1, courage: 1 },
    reactions: ["Its eye twitches. It's ready for anything.", "It's pacing. Plotting? Probably plotting.", "It won't sleep tonight."],
  },
  mystery: {
    id: "mystery",
    name: "Mystery Box",
    emoji: "🎁",
    blurb: "Nobody knows what's inside. Not even us.",
    pull: {},
    reactions: ["It opened the box. Its expression changed completely.", "Whatever was inside… it's not telling.", "A puff of purple smoke. Uh oh."],
  },
};

export const DIMS: Dim[] = ["courage", "kindness", "mischief", "greed", "chaos", "darkness", "wisdom", "energy"];

export const TWISTS = [
  "It spat it out and tried to bite you instead.",
  "It cried while eating. Nobody knows why.",
  "It shared it with a stray pigeon.",
  "It ate the wrapper too.",
  "It buried half of it in the backyard like treasure.",
  "It stared at you the whole time without blinking.",
  "A strange glow surrounded it for a second.",
  "It laughed. A little too long.",
];

export const WORLD_EVENTS = [
  "Baron Gorge doubles the price of rice overnight; riots brew on Lantern Row.",
  "A food shipment vanishes from the Neon Docks — the Patrol blames the Rustfang gang.",
  "The Iron Arena announces a tournament: the prize is a key to the Spire's pantry.",
  "A blackout plunges the city into darkness; the Underbazaar comes out to play.",
  "Masked Chef Saffron hands out free meals in the Rust Quarter — and the Gilded Forks are coming.",
  "A meteor shower falls on Glowcap Forest; something glowing walks out of the crater.",
  "Mayor Blip disappears during a speech, leaving only one shoe.",
  "The Sky Gardens' harvest turns grey overnight.",
  "A wanted poster with a huge bounty goes up across the city — the face is blurred.",
  "Captain Brine declares a curfew; anyone out after dark will be arrested.",
  "The Monastery bell rings by itself for the first time in a hundred years.",
  "Doctor Umami opens a free tasting stall in the Underbazaar; the line is endless.",
  "An airship crashes into the Salt Wastes; scavengers race to it.",
  "Blocktide Academy's vault is broken into; the only thing stolen is a cookbook.",
  "The Hollow is seen in the city — someone has paid for a hunt.",
  "A storm floods the lower districts; the Docks are cut off.",
];

export const emptyPersonality = (): Personality =>
  Object.fromEntries(DIMS.map((d) => [d, 0])) as Personality;

/** Words for a personality, used to brief the story writer. */
export function describePersonality(p: Personality) {
  const sorted = DIMS.map((d) => [d, p[d]] as const).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const top = sorted.filter(([, v]) => Math.abs(v) >= 2).slice(0, 4);
  if (!top.length) return "a blank slate — no strong traits yet";
  return top
    .map(([d, v]) => `${Math.abs(v) > 10 ? "extremely" : Math.abs(v) > 5 ? "very" : "a little"} ${v > 0 ? d : "lacking " + d}`)
    .join(", ");
}

/** A colour for the Chog's aura, from its strongest trait (no labels shown). */
export function auraColor(p: Personality) {
  const colors: Record<Dim, string> = {
    courage: "#f97316",
    kindness: "#facc15",
    mischief: "#34d399",
    greed: "#eab308",
    chaos: "#e879f9",
    darkness: "#ef4444",
    wisdom: "#38bdf8",
    energy: "#a3e635",
  };
  const top = DIMS.reduce((a, b) => (Math.abs(p[b]) > Math.abs(p[a]) ? b : a), "courage");
  return Math.abs(p[top]) < 2 ? "#a78bfa" : colors[top];
}

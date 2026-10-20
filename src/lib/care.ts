import type { CareId, Dim } from "./types";

export interface CareAction {
  id: CareId;
  name: string;
  emoji: string;
  blurb: string; // what the player sees — never the effect
  pull: Partial<Record<Dim, number>>; // hidden, scaled by the Chog's NFT traits like food
  stats: { hygiene?: number; energy?: number; mood?: number };
  reactions: string[];
}

export const CARES: Record<CareId, CareAction> = {
  bath: {
    id: "bath",
    name: "Bath",
    emoji: "🛁",
    blurb: "Bubbles, warm water, a rubber duck.",
    pull: { kindness: 1, chaos: -1, wisdom: 1 },
    stats: { hygiene: 45, mood: 4 },
    reactions: ["It sulks in the tub, then refuses to get out.", "It blows bubbles at you. Squeaky clean.", "It shakes off the water all over you. Revenge."],
  },
  groom: {
    id: "groom",
    name: "Brush & Groom",
    emoji: "🪥",
    blurb: "Teeth, fur, the works. Looking sharp.",
    pull: { courage: 1, greed: 1, mischief: -1 },
    stats: { hygiene: 20, mood: 3 },
    reactions: ["It checks itself in the mirror. Twice.", "It flashes you a sparkling smile.", "It poses like it's on a poster."],
  },
  sleep: {
    id: "sleep",
    name: "Early Night",
    emoji: "😴",
    blurb: "Lights out, blanket up, no screens.",
    pull: { wisdom: 2, energy: 2, chaos: -1 },
    stats: { energy: 40, mood: 5 },
    reactions: ["It's asleep before you finish the story.", "It mumbles a name in its sleep. Not yours.", "It snores like a tiny engine."],
  },
  latenight: {
    id: "latenight",
    name: "Stay Up Late",
    emoji: "🌙",
    blurb: "Window open, city lights, one more hour.",
    pull: { chaos: 2, darkness: 1, mischief: 1, energy: -1 },
    stats: { energy: -20, mood: 6 },
    reactions: ["It watches the city lights without blinking.", "It saw something on a rooftop. It won't say what.", "It's wide awake and grinning."],
  },
  train: {
    id: "train",
    name: "Train",
    emoji: "🥋",
    blurb: "Push-ups, kicks, punching bag.",
    pull: { courage: 3, energy: 1, kindness: -1 },
    stats: { energy: -18, hygiene: -12, mood: 2 },
    reactions: ["It knocked the bag off the chain. Whoa.", "It tried a flying kick and landed on its face. Again!", "It's breathing hard, eyes burning."],
  },
  study: {
    id: "study",
    name: "Study",
    emoji: "📖",
    blurb: "Old maps, history books, a riddle or two.",
    pull: { wisdom: 3, energy: -1, mischief: -1 },
    stats: { energy: -8 },
    reactions: ["It circled something on a map of the city.", "It read the same page five times. It's onto something.", "It asked a question you couldn't answer."],
  },
  play: {
    id: "play",
    name: "Play",
    emoji: "🎾",
    blurb: "Ball, tag, hide and seek.",
    pull: { mischief: 2, kindness: 1, energy: 1 },
    stats: { energy: -10, hygiene: -8, mood: 14 },
    reactions: ["It hid so well you panicked.", "It brought back a ball that isn't yours.", "Zoomies. Pure joy."],
  },
  comfort: {
    id: "comfort",
    name: "Talk & Cuddle",
    emoji: "🫂",
    blurb: "Sit together. Ask how it's really doing.",
    pull: { kindness: 3, darkness: -2 },
    stats: { mood: 12 },
    reactions: ["It leaned in and stayed there.", "It told you about a dream. Then went quiet.", "It cried a little. Then smiled."],
  },
  scold: {
    id: "scold",
    name: "Scold",
    emoji: "✋",
    blurb: "Rules are rules. Someone has to say it.",
    pull: { mischief: -2, darkness: 2, courage: -1, kindness: -1 },
    stats: { mood: -12 },
    reactions: ["It looks at the floor and says nothing.", "It nodded. Its eyes didn't.", "It slammed the door. Hard."],
  },
  medicine: {
    id: "medicine",
    name: "Medicine",
    emoji: "💊",
    blurb: "Bitter, but it helps. Probably.",
    pull: { darkness: -1, chaos: -1, wisdom: 1 },
    stats: { mood: -2, energy: 10 },
    reactions: ["It made a face like the world ended.", "It feels better. It won't admit it.", "It spat it out. You tried again. It worked."],
  },
};

export const CARE_TWISTS = [
  "It wasn't in its bed in the morning. The window was open.",
  "It drew a symbol on the mirror and won't explain it.",
  "It flinched when you raised your hand — like someone hurt it before.",
  "It said a word in a language you've never heard.",
  "Its shadow moved a second late.",
  "It left a gift on your pillow: a gold Gilded Fork button.",
];

/** Care → concrete story seeds. One is planted secretly each time. */
export const CARE_SEEDS: Record<CareId | "filthy" | "exhausted", string[]> = {
  bath: [
    "freshly clean, the hero is mistaken for a noble and let into a place it shouldn't be",
    "washing off the city grime reveals a strange mark on the hero's skin",
    "the hero's scent is gone, so the bounty hunter tracking it loses the trail",
  ],
  groom: [
    "the hero looks sharp enough that a powerful figure takes it seriously for the first time",
    "a photographer snaps the well-groomed hero; the photo goes viral in the city",
    "the hero's polished look earns it a disguise job among the Spire elite",
  ],
  sleep: [
    "the well-rested hero reacts a split second faster in the chapter's big fight",
    "in a dream the hero sees a fragment of its past — a face, a place, a promise",
    "the hero wakes before dawn and sees something nobody else saw",
  ],
  latenight: [
    "staying up, the hero witnesses a secret meeting on a rooftop",
    "the sleepy hero makes a costly mistake at the worst moment",
    "a night-owl stranger befriends the hero and knows too much",
  ],
  train: [
    "the hero's training pays off: it pulls off a new signature move in a fight",
    "the hero over-trains and pulls a muscle at the worst moment",
    "an arena scout sees the hero training and makes an offer",
  ],
  study: [
    "the hero recognises a symbol or map from its studies and solves a clue",
    "the hero finds a book that mentions its own token number",
    "the hero out-talks an enemy with something it read",
  ],
  play: [
    "while playing, the hero befriends a lonely kid who turns out to matter",
    "a game of hide and seek leads the hero into a hidden passage",
    "the hero's playful prank backfires on someone dangerous",
  ],
  comfort: [
    "the hero trusts someone a little more — and opens up about what scares it",
    "feeling loved, the hero refuses an offer to betray a friend",
    "the hero remembers someone who used to comfort it — and that person is still alive",
  ],
  scold: [
    "the scolded hero obeys the rules and misses a chance it'll regret",
    "the hero rebels against being told what to do and does the opposite",
    "the hero takes its anger out on someone who didn't deserve it",
  ],
  medicine: [
    "the medicine cures a lingering wound or curse from an earlier chapter",
    "the medicine has a side effect: the hero briefly sees glowing trails behind liars",
    "the pharmacist who sold the medicine has been watching the hero",
  ],
  filthy: [
    "the filthy, smelly hero is turned away from a place it needed to enter",
    "the hero's stink lets a tracker follow it straight to its hideout",
    "the scruffy hero is mistaken for a stray and rounded up by the Patrol",
    "nobody takes the dirty hero seriously when it tells the truth",
  ],
  exhausted: [
    "the exhausted hero nods off on a stakeout and misses the culprit",
    "the hero, running on no sleep, snaps at a friend and damages the bond",
    "exhaustion makes the hero see things — or are they real?",
  ],
};

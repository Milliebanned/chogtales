import type { BeefKind, Dim } from "./types";

export interface BeefMove {
  id: BeefKind;
  name: string;
  emoji: string;
  blurb: string;
  pull: Partial<Record<Dim, number>>; // hidden, like food and care
  /** What happened, for the story writer: "<hero> <did this> <target>". */
  deed: string;
  reactions: string[];
}

export const BEEFS: Record<BeefKind, BeefMove> = {
  duel: {
    id: "duel",
    name: "Challenge to a duel",
    emoji: "⚔️",
    blurb: "Face to face. Winner takes the street.",
    pull: { courage: 3, darkness: 1, kindness: -1 },
    deed: "publicly challenged to a one-on-one duel",
    reactions: ["It's cracking its knuckles. Tiny knuckles. Still scary.", "It wrote the rival's name on the wall and circled it.", "It's practising a victory pose."],
  },
  insult: {
    id: "insult",
    name: "Trash-talk",
    emoji: "🗯️",
    blurb: "Say it loud, say it in front of everyone.",
    pull: { mischief: 2, kindness: -2, courage: 1 },
    deed: "humiliated with brutal trash-talk in front of a crowd",
    reactions: ["The whole street went 'OOOOH'.", "It's grinning. That one landed.", "It's already regretting it. A little."],
  },
  steal: {
    id: "steal",
    name: "Steal its food",
    emoji: "🍱",
    blurb: "Its lunch, its snacks, its dignity.",
    pull: { greed: 2, darkness: 2, mischief: 1 },
    deed: "stole the food from",
    reactions: ["It's eating the evidence.", "It's hiding a lunchbox that isn't yours.", "Crumbs on its face. Denies everything."],
  },
  rumor: {
    id: "rumor",
    name: "Spread a rumor",
    emoji: "🤫",
    blurb: "Whisper something. Let the city do the rest.",
    pull: { mischief: 2, darkness: 1, wisdom: 1 },
    deed: "spread a nasty rumor around the city about",
    reactions: ["Three people already repeated it.", "It's whistling innocently. Too innocently.", "It made the rumor worse on purpose."],
  },
  prank: {
    id: "prank",
    name: "Prank it",
    emoji: "🎭",
    blurb: "Glue, paint, a bucket over a door.",
    pull: { mischief: 3, chaos: 1 },
    deed: "pulled a humiliating prank on",
    reactions: ["It can't stop laughing.", "The prank went viral. Uh oh.", "It's planning a sequel."],
  },
};

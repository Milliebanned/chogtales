export type Dim =
  | "courage"
  | "kindness"
  | "mischief"
  | "greed"
  | "chaos"
  | "darkness"
  | "wisdom"
  | "energy";

export type Personality = Record<Dim, number>; // each roughly -20..20, hidden from players

export type FoodId =
  | "riceball"
  | "chili"
  | "mushroom"
  | "honey"
  | "fish"
  | "tea"
  | "candy"
  | "cake"
  | "bread"
  | "coffee"
  | "mystery";

export type CareId = "bath" | "groom" | "sleep" | "latenight" | "train" | "study" | "play" | "comfort" | "scold" | "medicine";

export interface Care {
  care: CareId;
  twist?: string; // an unexpected reaction that happened
  seed?: string; // hidden story consequence this care planted
}

export type BeefKind = "duel" | "insult" | "steal" | "rumor" | "prank";

/** A rivalry the keeper started with another player's Chog. */
export interface Beef {
  day: number;
  kind: BeefKind;
  target: CastMember;
}

/** Beef someone else's Chog started with this one (stored per token id). */
export interface IncomingBeef {
  kind: BeefKind;
  from: CastMember;
  at: number;
}

export interface Meal {
  food: FoodId;
  twist?: string; // an unexpected reaction that happened
  seed?: string; // hidden story consequence this meal planted
}

export interface Role {
  title: string; // decided by the story AI, e.g. "The Mushroom Prophet"
  alignment: number; // -100 villain .. +100 hero
}

export interface ChogMeta {
  tokenId: string;
  name: string;
  image: string;
  traits: { trait_type: string; value: string }[];
  demo?: boolean;
}

/** Someone in the Chog's life. */
export interface Bond {
  name: string;
  kind: string; // lover, best friend, mentor, nemesis, rival, family, partner, informant…
  status: string; // alive, dead, missing, betrayed, estranged, imprisoned…
  note: string; // the history between them
  look?: string; // fixed visual design for the artist
}

/** The Chog's evolving life story — read and updated by every chapter. */
export interface Life {
  identity: string; // who it is now, e.g. "Robin Hood of Lantern Row"
  motive: string; // what drives it now
  bonds: Bond[];
  wounds: string[]; // formative events that changed it
  threads: string[]; // open story threads the next chapters must pick up
  timeline: { day: number; event: string }[]; // turning points
}

/** A moral choice offered at the end of a chapter. */
export interface Choice {
  prompt: string;
  options: { id: string; label: string }[];
}

export interface Decision {
  day: number;
  prompt: string;
  picked: string; // the option label the keeper chose
}

export interface DayRecord {
  day: number;
  meals: Meal[];
  cares?: Care[];
  beef?: Beef;
  role: Role;
  event: string;
  seeds: string[]; // story consequences planted that day (from meals or neglect)
  decision?: Decision;
}

export interface ChogState {
  key: string;
  tokenId: string;
  owner: string;
  meta: ChogMeta;
  createdAt: number;
  day: number;
  dayDate: string;
  hunger: number; // 0 full .. 100 starving
  mood: number; // 0 .. 100
  personality: Personality;
  meals: Meal[]; // today's meals
  cares: Care[]; // today's care actions
  beef?: Beef; // beef started today (one per day)
  hygiene: number; // 0 filthy .. 100 spotless
  energy: number; // 0 exhausted .. 100 rested
  dirtyStreak: number; // days in a row with low hygiene
  neglectStreak: number;
  role: Role; // who the Chog is in today's chapter
  event: string; // today's world event
  yesterday?: DayRecord;
  history: DayRecord[];
  storySoFar: string[];
  saga: { arc: string; mystery: string; startDay: number };
  flags: string[]; // permanent story facts: abilities, items, allies, enemies, status
  usedTwists: string[];
  appliedDay?: number; // last chapter whose consequences were applied to this state
  tomorrow?: ChogState; // pre-computed next day (draw-ahead), swapped in at rollover
  life: Life;
  decision?: Decision; // the keeper's answer to today's chapter choice
  lastChapter?: { day: number; title: string; beats: string[]; hook: string; choice?: Choice };
}

export type PanelShot = "extreme-closeup" | "closeup" | "medium" | "wide" | "establishing" | "action";

/** A district id from the series bible (lore.ts). */
export type Setting = string;

export interface Bubble {
  speaker: string; // "hero", a cast name, or "narrator"
  text: string;
  style: "speech" | "thought" | "shout" | "whisper";
}

/** Page layouts — each slot has a shape so art is generated at the right aspect. */
export type SlotShape = "wide" | "tall" | "square";

export interface Panel {
  shot: PanelShot;
  setting: Setting;
  scene: string; // the environment
  action: string; // what the characters physically do (pose, expression)
  characters: ("hero" | "cast")[]; // which Chogs (from NFT pictures) are drawn in the panel
  others?: string[]; // names of any other characters in the panel
  castIndex?: number;
  mood: "calm" | "tense" | "action" | "comic" | "dark" | "sad" | "triumph";
  caption?: string;
  bubbles: Bubble[];
  sfx?: string;
  color?: boolean;
  impact?: boolean;
  image?: string; // URL of the drawn art (set once inked)
  shape?: SlotShape;
  attempts?: number; // failed drawing attempts, persisted so a bad panel can't block a chapter
}

export interface Page {
  template: number;
  panels: Panel[];
}

export interface CastMember {
  name: string;
  tokenId: string;
  image: string;
  role: string;
}

export interface Chapter {
  id: string;
  chogKey: string;
  day: number;
  role: Role;
  title: string;
  tagline: string;
  summary: string;
  heroName: string;
  heroImage: string;
  cast: CastMember[];
  pages: Page[];
  cover: { scene: string; action: string; image?: string; attempts?: number };
  createdAt: number;
  engine: string;
  status: "inking" | "ready";
  arc?: string; // e.g. "The Heist — beat 3: Assembling the crew"
  consequences?: { emoji: string; text: string }[]; // shown to the player: what their choices did
  newFlags?: string[];
  twistUsed?: string;
  offeredTwists?: string[];
  quotaHitAt?: number; // free drawing budget ran out mid-chapter
  choice?: Choice; // the decision the keeper makes at the end
  beats?: string[];
  hook?: string;
  nextTime?: string; // "Next time…" teaser shown on the last page
  lifeUpdate?: LifeUpdate;
  looks?: Record<string, string>; // visual design of every non-Chog character in this chapter
}

export interface LifeUpdate {
  identity?: string;
  motive?: string;
  bonds?: Bond[]; // upserted by name
  newWounds?: string[];
  openThreads?: string[];
  closedThreads?: string[];
  turningPoint?: string;
}

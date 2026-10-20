/**
 * The plot bank: storytelling patterns distilled from decades of serialized
 * manga (arc structures, roles, twists, set pieces, hooks). Patterns only —
 * every story built from them is original.
 */

import { MORE_ARCS } from "./craft";

/** A season-long story engine: 7 beats, one per chapter. */
export interface Arc {
  id: string;
  name: string;
  premise: string;
  beats: string[]; // index = chapter - 1 (chapter 8+ loops into a new arc)
}

export const ARCS: Arc[] = [
  {
    id: "heist",
    name: "The Heist",
    premise: "A crew forms to pull off an impossible theft from the most guarded place in the city.",
    beats: [
      "Awakening: the hero wakes with a clean slate and witnesses something they shouldn't have — a clue to the target.",
      "The offer: a mysterious figure recruits the hero for a job; the target and the stakes are revealed.",
      "Assembling the crew: the hero recruits specialists, each with a flaw; a test of trust.",
      "The plan and the inside man: casing the target; the midpoint twist — someone in the crew is not who they seem.",
      "The heist goes wrong: alarms, a chase, a shootout or brawl; the crew is split up.",
      "The double-cross revealed: the real prize was something else all along; the hero must choose a side.",
      "The final con: the hero turns the tables in a showdown; the cliffhanger opens a bigger mystery.",
    ],
  },
  {
    id: "tournament",
    name: "The Tournament",
    premise: "A legendary tournament decides who wins a prize that could change the city.",
    beats: [
      "Awakening: the hero wakes with a clean slate and sees the tournament poster — and someone who recognizes them.",
      "Qualifiers: a brutal entry round; the hero shows an unexpected talent and makes a rival.",
      "First round: a bizarre opponent with a strange technique; the hero wins by improvising.",
      "The rigged match: the hero discovers the tournament is fixed; a friend is forced to throw a fight.",
      "Rival rematch: an all-out fight with the rival; respect is earned; secrets about the prize leak.",
      "Semifinal sabotage: the hero is poisoned, injured or framed; an unlikely ally steps in.",
      "The final: the hero faces the champion — and the real enemy reveals themselves in the stands.",
    ],
  },
  {
    id: "detective",
    name: "The Case",
    premise: "A crime shakes the city, and the hero becomes the one person who can solve it.",
    beats: [
      "Awakening: the hero wakes with a clean slate at the scene of a crime — and is the prime suspect.",
      "The first clue: a strange object, a witness who lies, a pattern only the hero notices.",
      "Following the trail: undercover in a dangerous district; an informant is silenced.",
      "Red herring: the obvious culprit is caught — and is innocent; the real culprit is closer than anyone thinks.",
      "The trap: the hero sets a trap; it backfires; a chase across rooftops or a standoff.",
      "Unmasking: the truth is revealed with a shocking motive; someone trusted is involved.",
      "Justice or mercy: the hero confronts the culprit and must decide their fate; a new case begins.",
    ],
  },
  {
    id: "rebellion",
    name: "The Rebellion",
    premise: "The powerful are squeezing the city; the people need someone to rise up.",
    beats: [
      "Awakening: the hero wakes with a clean slate and sees the injustice firsthand.",
      "Spark: the hero accidentally defies the enforcers in public and becomes a symbol.",
      "Underground: the rebels recruit the hero; training, sabotage, first victory.",
      "Price of rebellion: a crackdown; someone close is arrested or hurt; the hero questions everything.",
      "Infiltration: the hero goes inside the enemy's stronghold disguised; the enemy has a human side.",
      "Betrayal from within: a rebel leader sells them out — or the hero is offered a seat at the enemy's table.",
      "Uprising: the city rises; the hero leads or betrays the uprising at the decisive moment.",
    ],
  },
  {
    id: "rescue",
    name: "The Rescue",
    premise: "Someone the hero cares about is taken; the hero will cross the whole city to get them back.",
    beats: [
      "Awakening: the hero wakes with a clean slate and meets someone who instantly becomes family.",
      "Taken: that someone is kidnapped in front of the hero; a ransom or a riddle is left behind.",
      "Into enemy territory: the hero enters a dangerous district; a guide with a hidden agenda helps.",
      "The captor's reason: the hero learns why they were taken — and it is almost sympathetic.",
      "The gauntlet: wave after wave of enemies; an ally sacrifices themselves to buy time.",
      "The captive refuses: the one being rescued doesn't want to come back — they have a reason.",
      "Breaking out: an explosive escape and a choice that costs the hero something forever.",
    ],
  },
  {
    id: "revenge",
    name: "The Debt",
    premise: "The hero was wronged, and someone will pay — but revenge has a price.",
    beats: [
      "Awakening: the hero wakes with a clean slate and finds proof they were wronged before they lost their memory.",
      "The list: the hero identifies who did it — three names.",
      "First name: the hero confronts the first one; it doesn't feel like victory.",
      "Mirror: the hero meets someone consumed by revenge — a vision of their own future.",
      "Second name: the target saves the hero's life before the confrontation.",
      "The truth: the hero learns they were not the victim — or not only the victim.",
      "Last name: a final confrontation where the hero chooses revenge or forgiveness.",
    ],
  },
  {
    id: "rise",
    name: "From Nothing",
    premise: "The hero starts with nothing and climbs the city's ladder — business, fame or power.",
    beats: [
      "Awakening: the hero wakes with a clean slate and nothing to their name.",
      "Hustle: a street-level scheme (food stall, delivery, busking) that actually works.",
      "Rival business: a powerful competitor notices and squeezes the hero.",
      "Big break: a risky deal with a shady partner pays off spectacularly.",
      "The cost: success changes the hero; old friends drift; a scandal brews.",
      "Fall: everything collapses — framed, robbed or betrayed.",
      "Comeback: the hero rebuilds with what truly matters and strikes back.",
    ],
  },
  {
    id: "chosen",
    name: "The Prophecy",
    premise: "Ancient signs point to the hero as the one who will save — or end — the city.",
    beats: [
      "Awakening: the hero wakes with a clean slate and a strange mark that glows when they're hungry.",
      "The sign: a mystic declares the hero is the Prophesied One; several factions start hunting them.",
      "The master: the hero is trained by an eccentric master with harsh methods.",
      "False prophet: the prophecy might be about someone else — a rival also bears the mark.",
      "Power awakens: the hero's power erupts in a crisis and hurts someone innocent.",
      "The real prophecy: the true words reveal the 'savior' is meant to be a sacrifice.",
      "Defying fate: the hero rewrites the prophecy in an epic battle.",
    ],
  },
  {
    id: "outlaw",
    name: "Wanted",
    premise: "The hero becomes the city's most wanted — innocent or not.",
    beats: [
      "Awakening: the hero wakes with a clean slate as sirens wail — their face is on every screen.",
      "On the run: a chase through the city; the hero finds a hideout with strange new friends.",
      "Bounty: a famous bounty hunter takes the contract.",
      "Clearing their name: a lead points to a cover-up in the Patrol.",
      "Cornered: a standoff with the Patrol; a cop who believes the hero switches sides.",
      "The frame-up exposed: the real culprit is someone the hero saved earlier.",
      "Outlaw hero: cleared or not, the hero chooses their own path in a final confrontation.",
    ],
  },
  {
    id: "survival",
    name: "The Long Night",
    premise: "A disaster cuts off the city; survival brings out the best and worst in everyone.",
    beats: [
      "Awakening: the hero wakes with a clean slate as the disaster begins.",
      "Scramble: food and shelter run out; the hero joins a group of strangers.",
      "Rules: a strong leader takes control and makes harsh rules.",
      "The hoard: someone is hiding food; paranoia spreads.",
      "Breakdown: the group splits; a fight over the last supplies.",
      "Truth of the disaster: it was caused deliberately.",
      "Dawn: the hero leads the survivors out and confronts the one who caused it.",
    ],
  },
];

ARCS.push(...MORE_ARCS);

/** Roles a Chog can play on a given day — not just hero or villain. */
export const ROLES = [
  "street detective", "rookie Chog Patrol officer", "rebel saboteur", "masked vigilante", "bounty hunter", "smuggler",
  "underground fighter", "tournament underdog", "noodle-shop chef", "food critic", "black-market dealer", "spy in the Baron's court",
  "double agent", "bodyguard", "getaway driver", "con artist", "info broker", "monastery disciple", "prophet", "exiled noble",
  "pop idol", "pirate of the Neon Docks", "inventor", "medic", "hacker", "thief with a code", "mercenary", "revolutionary leader",
  "reluctant mayor", "gang enforcer", "turncoat", "hostage negotiator", "treasure hunter", "street racer", "jailbreaker", "judge",
  "journalist", "mascot of a cult", "caretaker of orphans", "bomb defuser", "the Baron's taster", "wrongfully accused fugitive",
  "accidental celebrity", "corrupt cop", "ghost-hunter", "time-loop prisoner", "wandering ronin", "unwilling chosen one",
];

/** Twist library — the writer must use one, and never repeat one already used. */
export const TWISTS = [
  "the mentor is secretly working for the enemy",
  "the villain's cruelty hides a noble motive (protecting someone)",
  "the rival was protecting the hero all along",
  "the person being rescued doesn't want to be rescued",
  "the hero's 'clean slate' memory loss was done on purpose — by someone they trust",
  "the prize everyone is fighting over is fake; the real one is somewhere else",
  "two enemies are secretly siblings",
  "the informant was the culprit",
  "the hero is framed by someone wearing their exact face",
  "an ally dies — or seems to — to save the hero",
  "the 'monster' everyone fears is a frightened child",
  "the hero was the one who caused the disaster",
  "the police captain and the gang leader are working together",
  "the cheerful side character is the mastermind",
  "the tournament/case/heist was a test set up by a secret society",
  "the hero's keeper (the player's choices) is being watched by someone",
  "the food the hero ate yesterday was laced with something",
  "a defeated enemy returns with new power and a grudge",
  "the hero swaps sides mid-mission",
  "the map/recipe/key is tattooed on someone",
  "the Baron is trying to save the city, just in the worst way",
  "the enemy offers the hero exactly what they've been wanting",
  "the 'safe house' is a trap",
  "someone the hero saved earlier returns to repay the debt at the worst moment",
  "the hero discovers a second, hidden personality",
  "a prophecy turns out to be a forged document",
  "two cast Chogs from other players are revealed to be connected to the hero",
  "the real enemy has been narrating the story",
];

/** Set pieces — every chapter needs at least one clear, readable action scene. */
export const SET_PIECES = [
  "a rooftop chase that ends in a leap across a gap",
  "a standoff with blasters/slingshots drawn, then shots fired",
  "a one-on-one duel with a signature move and a counter",
  "a brawl in a crowded noodle shop",
  "an escape from a collapsing building",
  "a high-speed chase on hover-scooters through traffic",
  "a stealth infiltration past guards and lasers",
  "a fight on a moving train or airship",
  "a showdown in the rain with lightning flashes",
  "a bar fight in the Underbazaar fighting pits",
  "a ambush at the docks between shipping containers",
  "a desperate defense of a barricade",
  "a dramatic courtroom or interrogation confrontation",
  "a cooking battle with sabotage",
  "a jailbreak with a riot",
  "a heist vault cracking with seconds to spare",
  "a sniper duel across the city skyline",
  "a monastery sparring match that turns serious",
];

/** How each chapter ends (the hiki — the last page that forces the next read). */
export const HOOKS = [
  "a shocking reveal of someone's true identity on the last panel",
  "a character is shot/struck and the panel cuts to black",
  "a message arrives that changes everything",
  "the hero makes a choice the reader didn't expect",
  "a betrayal in the final line of dialogue",
  "a new, terrifying figure appears in silhouette",
  "the hero's own face appears on a wanted poster or screen",
  "a countdown begins",
  "someone thought dead walks in",
  "the hero wakes up somewhere they don't remember going",
];

/** Food → concrete story seeds. One is picked (secretly) each time the food is eaten. */
export const FOOD_SEEDS: Record<string, string[]> = {
  riceball: ["a grateful stranger remembers the hero's kindness and offers help", "the hero shares food with a starving orphan who becomes loyal", "the hero earns the trust of the Farmers' Union"],
  chili: ["the hero can now breathe a burst of fire when angry", "the hero accidentally burns down a stall and makes an enemy", "the hero becomes reckless and picks a fight they can't win", "the hero's fiery reputation earns a challenge from an arena fighter"],
  mushroom: ["the hero sees visions of a hidden door related to the season mystery", "the hero hears voices from Glowcap Forest calling them", "the hero glimpses a stranger's future", "the hero starts sleepwalking somewhere strange each night"],
  honey: ["the hero becomes greedy and hides a stash that someone finds", "the hero gets stuck — literally — at the worst possible moment", "a rich patron notices the hero's sweet charm and makes an offer"],
  fish: ["the hero's wild instincts let them sense danger before it happens", "a Neon Docks dockworker recognizes the hero from the fish and owes them a favor", "the hero becomes fiercely territorial"],
  tea: ["the hero gains uncanny calm and sees through a lie", "Old Monk Miso senses the hero and sends an invitation", "the hero remembers a fragment of their forgotten past"],
  candy: ["the hero gets super-speed for a few minutes when excited", "the hero pulls a prank that goes way too far", "the hero becomes an overnight internet meme in Chog City"],
  cake: ["the hero is invited to a fancy party in the Spire", "the hero starts acting like royalty and offends someone powerful", "a jealous rival targets the spoiled hero"],
  bread: ["the hero's face appears on a wanted poster for theft", "Masked Chef Saffron notices the hero's sticky fingers and recruits them", "the hero learns a sneaky skill that makes them a natural thief"],
  coffee: ["the hero stays up all night and witnesses a secret meeting", "the hero becomes jittery and paranoid — and is right about something", "the hero gains a night-owl ally in the Patrol night shift"],
  mystery: ["something unexplainable happens: the hero gains a strange new power", "a mysterious package arrives with the hero's name on it", "the hero briefly swaps bodies with another Chog", "the hero finds an object that belongs to the season mystery"],
  neglect: ["the starving hero is recruited by the Baron's enforcers with a promise of food", "the hungry hero steals from someone who didn't deserve it", "the hero collapses in the street and wakes up in a stranger's home", "hunger awakens a dark, dangerous instinct in the hero", "the hero joins a soup line and overhears a conspiracy"],
};

export function sample<T>(arr: T[], n: number, exclude: T[] = []): T[] {
  const pool = arr.filter((x) => !exclude.includes(x));
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

/**
 * The Chog Chronicles series bible: an original world with distinct places,
 * factions and recurring characters, so every chapter happens somewhere real.
 */

export interface District {
  id: string;
  name: string;
  look: string; // visual description for the illustrator
  vibe: string; // what happens here, for the writer
  library: "city" | "rooftop" | "market" | "kitchen" | "forest" | "night" | "lair" | "sky" | "home" | "street";
}

export const DISTRICTS: District[] = [
  { id: "spire", name: "The Monad Spire", library: "sky", look: "a colossal crystal tower piercing the clouds, glowing purple circuitry veins, sky bridges and hovering lanterns", vibe: "seat of power; the Council of Blocks meets at the top; whoever controls the Spire controls the city's food supply" },
  { id: "underbazaar", name: "The Underbazaar", library: "night", look: "a vast underground black market in old subway tunnels, neon stalls, hanging cages, steam vents and graffiti", vibe: "smugglers, information brokers, illegal food, fighting pits; no laws, only deals" },
  { id: "neondocks", name: "The Neon Docks", library: "night", look: "rain-soaked harbor with stacked shipping containers, cranes, fishing boats and flickering neon signs reflected in puddles", vibe: "where food shipments arrive; dockworkers' union vs the Food Baron's enforcers; midnight deals" },
  { id: "glowcap", name: "Glowcap Forest", library: "forest", look: "an ancient forest of giant bioluminescent mushrooms, floating spores, roots like bridges and a hidden shrine", vibe: "mystics, hermits, forbidden ingredients, visions; the forest remembers everything" },
  { id: "rust", name: "The Rust Quarter", library: "lair", look: "abandoned factories, rusted pipes, chain-link fences, smokestacks and scrap-metal shacks under an orange sky", vibe: "the Rustfang gang's turf; scavengers, inventors, underground racing, the poor and forgotten" },
  { id: "gardens", name: "The Sky Gardens", library: "sky", look: "floating terraced islands of farmland connected by rope bridges, waterfalls pouring into clouds, wind turbines", vibe: "where the city's food is grown; farmers, harvest festivals, and the Baron's guards watching every crop" },
  { id: "monastery", name: "Crater Monastery", library: "forest", look: "a mountaintop monastery inside a meteor crater, stone stairs, prayer flags, a giant bronze bell, training courtyards", vibe: "the Order of the Empty Bowl trains fighters in hunger-discipline; ancient secrets about the first Chog" },
  { id: "saltwastes", name: "The Salt Wastes", library: "sky", look: "a blinding white salt desert with cracked earth, wrecked airships half-buried, mirages and a distant sandstorm", vibe: "exiles, bounty hunters, ruins of the old world; where people go to disappear" },
  { id: "lanternrow", name: "Lantern Row", library: "street", look: "a narrow old-town street of wooden shops, paper lanterns, noodle bars, cherry trees and tangled power lines", vibe: "the heart of ordinary life; noodle shops, gossip, the Chog Patrol's police box, festivals" },
  { id: "arena", name: "The Iron Arena", library: "city", look: "a roaring colosseum with steel beams, giant screens, spotlights and a cage-ring in the center", vibe: "tournaments, champions, betting syndicates, glory and rigged fights" },
  { id: "patrolhq", name: "Chog Patrol HQ", library: "city", look: "a fortress-like police headquarters with searchlights, holding cells, an evidence room and a rooftop helipad", vibe: "the city's police; honest cops and corrupt captains; wanted posters, interrogations" },
  { id: "academy", name: "Blocktide Academy", library: "street", look: "a grand school campus with clock tower, courtyards, rooftop hangout, lockers and a forbidden library wing", vibe: "students, rivalries, clubs, secret societies; the next generation of Chog City" },
  { id: "home", name: "Keeper's House", library: "home", look: "a cozy small apartment with a round window over the city, a food bowl, cushions and photos on the wall", vibe: "the Chog's home with its keeper (the player); safety, guilt, comfort, and the empty bowl" },
];

export interface Character {
  name: string;
  role: string;
  secret: string; // the writer may reveal this as a twist at the right time
  look: string; // fixed visual design so the artist never draws them like the hero
}

/** Recurring cast. They appear across chapters and players' stories. */
export const NPCS: Character[] = [
  { name: "Baron Gorge", role: "the Food Baron who controls the city's food supply from the Spire; charming in public, ruthless in private", secret: "he is starving himself — he cannot taste anything, and is searching for a legendary recipe that will cure him", look: "a huge round walrus-like noble with tusks, a monocle, a golden crown-shaped helmet and a long fur-trimmed coat dripping with jewels" },
  { name: "Masked Chef Saffron", role: "a masked outlaw chef who feeds the poor with food stolen from the Baron", secret: "Saffron used to be the Baron's head chef, and the Baron's sibling", look: "a tall slender cat-like chef in a white chef coat and tall toque, face hidden behind a cracked fox mask, carrying two cleavers" },
  { name: "Captain Brine", role: "the stern captain of the Chog Patrol, obsessed with order", secret: "secretly on the Baron's payroll — but only to protect her missing son's whereabouts", look: "a stern stocky otter in a navy police captain uniform with a peaked cap, eyepatch and a badge, holding a baton" },
  { name: "Old Monk Miso", role: "the blind elder of Crater Monastery who teaches the art of hunger", secret: "he is the first Chog ever born, hundreds of years old", look: "a tiny ancient turtle-like monk with a long white beard, blindfolded eyes, orange robes and a wooden staff" },
  { name: "Vex", role: "leader of the Rustfang gang in the Rust Quarter; fast, funny, loyal to her crew", secret: "she was raised in the Spire and ran away", look: "a lanky red fox girl with welding goggles on her head, a red bandana, ripped jacket covered in patches and a wrench" },
  { name: "Doctor Umami", role: "a cheerful scientist who sells 'enhanced' food in the Underbazaar", secret: "her food slowly rewrites whoever eats it — she is experimenting on the city", look: "a cheerful round rabbit scientist in a stained lab coat, huge round glasses and rubber gloves holding a glowing test tube" },
  { name: "Pip", role: "a tiny orphan Chog who idolizes the hero and follows them everywhere", secret: "Pip is the lost heir to the Council of Blocks", look: "a small round chick-like creature with a leaf sprouting from its head, an oversized striped scarf and big shiny eyes" },
  { name: "The Hollow", role: "a silent bounty hunter in a cracked porcelain mask, never misses", secret: "The Hollow is a Chog whose keeper abandoned them — a mirror of what the hero could become", look: "a tall gaunt hooded figure in a tattered grey cloak wearing a cracked white porcelain mask, holding a long rifle" },
  { name: "Mayor Blip", role: "the clumsy, beloved mayor of Chog City", secret: "a puppet; the real decisions are made by whoever holds the Spire's Flame", look: "a plump clumsy pig in a sash and top hat that is too small, sweating, with a giant ceremonial key" },
];

export const FACTIONS = [
  "the Baron's Gilded Forks (enforcers in gold armor)",
  "the Chog Patrol (city police)",
  "the Rustfang gang (scrappy rebels)",
  "the Order of the Empty Bowl (monastery fighters)",
  "the Underbazaar Syndicate (smugglers and brokers)",
  "the Sky Gardens Farmers' Union",
  "the Council of Blocks (the city's secret rulers)",
];

/** One central mystery per player season, revealed piece by piece. */
export const SEASON_MYSTERIES = [
  "The Spire Flame — the light that keeps the Sky Gardens growing — is dying, and someone is stealing it piece by piece.",
  "Chogs across the city are vanishing at night, and each one leaves behind an empty food bowl.",
  "A recipe called 'The Last Meal' is said to grant any wish; four factions are hunting its four missing pages.",
  "Every keeper in the city had the same dream last night — of a door under the Monastery bell.",
  "The city's food is turning grey and tasteless, district by district, spreading from the Neon Docks.",
  "A masked Chog has been committing crimes while wearing the hero's exact face.",
  "The Council of Blocks has announced a 'Great Harvest' — but no one who attends ever comes back the same.",
  "An old airship crashed in the Salt Wastes carrying a sealed crate stamped with the hero's token number.",
];

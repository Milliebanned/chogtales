/**
 * Storycraft: the techniques serialized manga use to hook a reader on page one
 * and keep them coming back. Patterns and original prompts only — every story
 * built from them is new.
 */

/**
 * Chapter 1 never opens with "it wakes up with no memories". It opens IN the
 * middle of something, with a question about the hero only later chapters answer.
 */
export const COLD_OPENS = [
  "The hero is falling from the top of the Monad Spire, clutching a stolen glowing seed — and has no idea how it got up there.",
  "The hero is standing over an unconscious Gilded Fork enforcer, holding his golden badge, as Patrol sirens close in.",
  "A dying stranger presses a key into the hero's paw, whispers the hero's own name, and says 'Don't let Gorge find the door.'",
  "The hero wins a fight in the Iron Arena it doesn't remember entering — and the crowd chants a name that isn't its own.",
  "The hero is the only survivor of a food-truck crash on the Neon Docks; the cargo was crates of something that glows and breathes.",
  "Everyone on Lantern Row bows when the hero walks past. Nobody will say why. One old cook spits at its feet.",
  "The hero is handcuffed in a Patrol interrogation room; the detective slides over a photo of the hero committing a crime it doesn't remember.",
  "A wanted poster with the hero's face is being pasted on every wall — the reward is 'one lifetime of food'.",
  "The hero is the guest of honour at a Spire banquet, and the food in front of it has been poisoned. Only the hero notices.",
  "Pip, a tiny orphan, drags the hero out of a burning noodle shop and calls it 'big sibling' — the hero has never seen Pip before.",
  "The hero wakes mid-heist inside the Underbazaar vault, already wearing a crew's mask, alarm already ringing, crew already gone.",
  "A masked bounty hunter, The Hollow, aims at the hero across a rooftop — then lowers the rifle and says 'Not yet. Not until you remember.'",
  "The hero's reflection in a puddle moves a second after it does — and smiles when the hero doesn't.",
  "The Monastery bell rings by itself the moment the hero walks under it; every monk drops to their knees in fear.",
  "The hero is selling dumplings at a street stall it apparently owns; a gang arrives to collect a debt the hero apparently owes.",
  "A sealed letter in the hero's own handwriting says: 'If you're reading this, they erased you again. Trust nobody wearing gold.'",
  "The hero finds itself at the centre of a crowd that just watched it save Mayor Blip from an assassin — and the hero has the assassin's weapon.",
  "A crate stamped with the hero's token number washes up at the Docks; inside is a perfect copy of the hero, asleep.",
  "During a city-wide blackout, the hero is the only thing that glows — and the Gilded Forks are hunting whatever glows.",
  "The hero is racing a hover-scooter through traffic with a squawking chick-creature in the basket and Patrol cruisers behind.",
  "Masked Chef Saffron serves the hero a bowl of soup and says 'Eat. Last time you were this hungry, you burned down the Sky Gardens.'",
  "The hero is chosen at random for the 'Great Harvest' lottery — every past winner has vanished.",
  "Vex of the Rustfang gang pins the hero to a wall: 'Where's the money you stole from us?' The hero has never met her.",
  "A child points at the hero in the market and screams 'That's the monster from my dream!' — and the whole market goes silent.",
];

/** Extra season engines (added to the plot bank's arcs). */
export const MORE_ARCS = [
  {
    id: "doppel",
    name: "The Other Me",
    premise: "Someone with the hero's exact face is living the hero's life — and doing it better, or worse.",
    beats: [
      "Cold open: the hero sees itself across the street, waving.",
      "The double's crimes (or good deeds) start landing on the hero; friends pick sides.",
      "Tracking the double to its hideout; a clue that it was made, not born.",
      "Midpoint twist: the double has memories the hero lost.",
      "Swap: the hero is forced to live as the double for a day and sees why it exists.",
      "The maker revealed: someone close built the double to replace the hero.",
      "Mirror duel: only one of them walks away with the name.",
    ],
  },
  {
    id: "school",
    name: "Blocktide Days",
    premise: "The hero enrolls at Blocktide Academy, where clubs are gangs, exams are duels, and the forbidden wing hides a secret.",
    beats: [
      "Cold open: first day, the hero humiliates the school's top student by accident.",
      "Club wars: every club wants the hero; the losers want revenge.",
      "The exam duel: rules are rigged; the hero cheats or fails honestly.",
      "The forbidden wing: a midnight dare uncovers a classroom nobody graduated from.",
      "A friend is expelled for something the hero did.",
      "The headmaster's secret: the Academy trains the Council's future enforcers.",
      "Graduation day riot: the hero exposes the school in front of the whole city.",
    ],
  },
  {
    id: "romance",
    name: "Forbidden Bowl",
    premise: "The hero falls for someone on the other side of the city's war, and the city won't allow it.",
    beats: [
      "Cold open: the hero saves a stranger who turns out to be the enemy's heir.",
      "Secret meetings at the Sky Gardens; a promise neither can keep.",
      "Discovery: someone photographs them together.",
      "Choose: the hero's crew or the one it loves.",
      "Sacrifice: one of them gives up their place for the other.",
      "Betrayal or misunderstanding tears them apart at the worst moment.",
      "The run: the hero risks everything for one last chance.",
    ],
  },
  {
    id: "horror",
    name: "The Grey Hunger",
    premise: "A sickness spreads that turns Chogs grey, silent and endlessly hungry — and it is spreading through the food.",
    beats: [
      "Cold open: a friendly shopkeeper turns grey mid-sentence and keeps eating.",
      "Quarantine: the district is sealed; the hero is locked inside.",
      "Survivors' rules; one survivor is hiding a bite.",
      "The source: a shipment of 'enhanced' food from Doctor Umami.",
      "The hero shows the first grey spot.",
      "The cure exists — but there's only enough for one.",
      "Burning the source; the hero chooses who gets saved.",
    ],
  },
  {
    id: "throne",
    name: "Seat of the Spire",
    premise: "The Council of Blocks has an empty seat, and the hero is somehow a candidate.",
    beats: [
      "Cold open: the hero is crowned by accident during a riot.",
      "Every faction courts the hero with gifts and threats.",
      "The first decree: the hero's choice feeds one district and starves another.",
      "Assassination attempt from inside the court.",
      "The hero discovers the throne was offered to make it a scapegoat.",
      "Allies demand a price for their votes.",
      "The vote: the hero takes the seat, burns it, or hands it to someone unexpected.",
    ],
  },
  {
    id: "monster",
    name: "Kaiju Season",
    premise: "Something enormous is waking under Chog City, and only the hero can hear it.",
    beats: [
      "Cold open: an earthquake, a giant eye opens in the harbour, only the hero sees it.",
      "Nobody believes the hero; it's branded a liar.",
      "The beast surfaces and wrecks a district; the hero was right.",
      "The beast is protecting something — an egg, or a child.",
      "The Council plans to destroy it with a weapon that would also flatten the Rust Quarter.",
      "The hero rides the beast.",
      "Peace or war with the giant, decided on the Spire's peak.",
    ],
  },
  {
    id: "loop",
    name: "Same Day Again",
    premise: "The hero keeps reliving the same day, which always ends in a catastrophe.",
    beats: [
      "Cold open: the city explodes at midnight — and the hero wakes up that morning again.",
      "The hero tries to warn everyone; nobody listens.",
      "Patterns: the hero learns the day minute by minute and starts bending it.",
      "Someone else remembers the loops too.",
      "The loop is a trap built to keep the hero from one specific choice.",
      "The hero loses someone permanently even inside the loop.",
      "Breaking the loop costs something the hero can never get back.",
    ],
  },
  {
    id: "mentor",
    name: "The Last Student",
    premise: "A legendary, broken master agrees to train the hero — if it survives the training.",
    beats: [
      "Cold open: the hero gets crushed in a fight, and an old drunk finishes the job in one move.",
      "The hero begs to learn; the master refuses three times.",
      "Absurd training that secretly teaches everything.",
      "The master's old student, now a monster, comes back for revenge.",
      "The master is defeated protecting the hero.",
      "The hero learns the master's forbidden final technique — and its cost.",
      "Student versus former student; the master's legacy is decided.",
    ],
  },
  {
    id: "smuggler",
    name: "Contraband",
    premise: "The hero runs forbidden food into a starving district, and it becomes a legend, a criminal and a target.",
    beats: [
      "Cold open: the hero sprints through the Docks with a sack of stolen rice and a gang on its tail.",
      "First run succeeds; a district starts calling the hero a saint.",
      "A bigger smuggler offers a partnership.",
      "The cargo on the big run isn't food.",
      "The partner sells the hero to the Patrol.",
      "The hero's people get punished for its crimes.",
      "One last run, against everybody.",
    ],
  },
];

/** Cliffhanger types — the last panel must use one, and make the reader NEED the next chapter. */
export const CLIFFHANGERS = [
  "Identity reveal: the last panel shows who someone really is (a face behind a mask, a name on a file).",
  "Betrayal line: a trusted character says one sentence that flips everything.",
  "Arrival: someone thought dead, gone or imaginary walks in.",
  "Impossible proof: a photo, letter or recording that shows the hero did something it doesn't remember.",
  "Ticking clock: a countdown, a deadline, a fuse — with the hero on the wrong side of it.",
  "Point of no return: the hero does something that can't be undone, on panel.",
  "Silhouette: a terrifying new figure watching from above, with one line of dialogue.",
  "The question: a character asks the hero something the reader also wants answered — and the hero can't answer.",
  "Reversal: the victory of this chapter turns out to be exactly what the villain wanted.",
  "Target: the hero discovers it's next on someone's list.",
  "The hero's NFT trait (an item it wears) turns out to mean something to someone dangerous.",
];

/** Writing rules that separate a page-turner from filler. */
export const CRAFT = `CRAFT (what makes readers hooked):
- Page 1, panel 1 starts IN the middle of something happening. No weather, no waking up, no "a new day".
- Every chapter answers one old question and asks two new ones. The reader must always have a question they want answered.
- The hero WANTS something concrete in this chapter (a key, a person, food, revenge, escape) and something blocks it.
- Show the hero's personality through a decision under pressure, not a description.
- Give each named character one memorable detail (a catchphrase, a tic, an object) and keep it every time they appear.
- Comedy inside tension: one funny beat in a dark chapter, one dark beat in a funny one.
- The hero's NFT traits (its hat, eyewear, clothes, colours) are part of its legend: give one of them a meaning — a symbol, a clue, a reputation.
- Something must cost the hero: a friend, a secret, its reputation, a place. No free wins.`;

/** Dialogue and caption rules for the panel script. */
export const LETTERING = `LETTERING (dialogue and captions):
- Every bubble either reveals information, shows emotion, or raises the stakes. Cut anything else.
- Write how people talk under pressure: interrupted, sarcastic, desperate, specific. Use names and concrete nouns.
- Captions are the narrator's voice: wry, ominous or emotional. They add what the art can't show (a memory, a time jump, an inner thought). Never describe what's already drawn.
- BANNED (generic filler): "Chase begins.", "Hunger gnaws.", "Choice awaits.", "Standoff.", "A new day.", "Meanwhile…" alone, "What?!", "No way!", "Let's go!", "I must…", "Little did they know".
- BAD: caption "Wave crashes." / bubble "Aqua Ripple!"  GOOD: caption "Three years of training. One shot." / bubble "You taught me this move, Vex. Remember?"
- BAD: bubble "Help!"  GOOD: bubble "Pip's still inside — the gas line's about to blow!"
- BAD: caption "Choice awaits."  GOOD: caption "Open the crate, and the city learns what it is. Walk away, and Pip stays a prisoner."
- The BAD/GOOD lines above only show the style. Never reuse them; write new lines for this story.
- The last panel's text is the hook: one line that makes the reader say "WAIT, WHAT?"`;

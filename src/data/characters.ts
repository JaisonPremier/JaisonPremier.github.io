import type { CharacterId } from "../game/types";

export interface Character {
  id: CharacterId;
  number: string;
  hanzi: string;
  name: string;
  pinyin: string;
  maxHp: number;
  startingAmmo: number;
  accent: string;
  accentRgb: string;
  ability: {
    id: string;
    name: string;
    short: string;
    description: string;
    plain: string;
    example: string;
  };
  lore: string;
  artwork: {
    full: string;
    portrait: string;
    thumbnail: string;
  };
}

export const characters: Character[] = [
  {
    id: "ling",
    number: "01",
    hanzi: "凌",
    name: "LING",
    pinyin: "LÍNG",
    maxHp: 3,
    startingAmmo: 1,
    accent: "#c94c4c",
    accentRgb: "201 76 76",
    ability: {
      id: "initial-ammo",
      name: "INITIAL AMMO",
      short: "BEGIN WITH 1 AMMO",
      description: "Ready to shoot from the opening turn.",
      plain: "You start with 1 ammo. Everyone else starts with 0, so you can SHOOT immediately.",
      example: "Turn 1: choose SHOOT instead of charging first.",
    },
    lore: "A measured tactician who enters every conflict one decision ahead.",
    artwork: {
      full: "/characters/ling/full.png",
      portrait: "/characters/ling/full.png",
      thumbnail: "/characters/ling/full.png",
    },
  },
  {
    id: "lie",
    number: "02",
    hanzi: "烈",
    name: "LIE",
    pinyin: "LIÈ",
    maxHp: 3,
    startingAmmo: 0,
    accent: "#d7773e",
    accentRgb: "215 119 62",
    ability: {
      id: "feedback",
      name: "FEEDBACK",
      short: "A HIT REFUNDS 1 AMMO",
      description: "Successful aggression keeps the weapon loaded.",
      plain: "When SHOOT removes HP, regain exactly 1 ammo after paying the shot cost. Blocked or dodged shots give nothing. Maximum 3 ammo.",
      example: "1 ammo → SHOOT → hit → finish with 1 ammo.",
    },
    lore: "Aggression is a circuit. Every clean hit closes it.",
    artwork: {
      full: "/characters/lie/full.png",
      portrait: "/characters/lie/full.png",
      thumbnail: "/characters/lie/full.png",
    },
  },
  {
    id: "ying",
    number: "03",
    hanzi: "影",
    name: "YING",
    pinyin: "YǏNG",
    maxHp: 3,
    startingAmmo: 0,
    accent: "#7862a6",
    accentRgb: "120 98 166",
    ability: {
      id: "phase-dodge",
      name: "PHASE DODGE",
      short: "DODGE ALL SHOTS ONCE",
      description: "Escape one dangerous round without losing your action.",
      plain: "Once per match, activate PHASE with CHARGE or SHOOT. Every shot aimed at you misses, while your chosen action still happens.",
      example: "PHASE + CHARGE: avoid all shots and gain 1 ammo.",
    },
    lore: "No recording has ever captured her in the frame where impact occurs.",
    artwork: {
      full: "/characters/ying/full.png",
      portrait: "/characters/ying/full.png",
      thumbnail: "/characters/ying/full.png",
    },
  },
  {
    id: "gang",
    number: "04",
    hanzi: "钢",
    name: "GANG",
    pinyin: "GĀNG",
    maxHp: 4,
    startingAmmo: 0,
    accent: "#64866d",
    accentRgb: "100 134 109",
    ability: {
      id: "extra-core",
      name: "EXTRA CORE",
      short: "START WITH 4 HP",
      description: "One extra core provides simple, permanent durability.",
      plain: "You start with 4 HP instead of 3. The bonus is always active and needs no button or activation.",
      example: "You survive one more successful shot than other fighters.",
    },
    lore: "Built to absorb the mistake that would end anyone else.",
    artwork: {
      full: "/characters/gang/full.png",
      portrait: "/characters/gang/full.png",
      thumbnail: "/characters/gang/full.png",
    },
  },
];

export const characterById = Object.fromEntries(
  characters.map((character) => [character.id, character]),
) as Record<CharacterId, Character>;

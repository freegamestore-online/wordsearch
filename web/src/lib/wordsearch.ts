import type { Theme } from "../types";

export interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  dRow: number;
  dCol: number;
}

export interface Puzzle {
  grid: string[][];
  words: string[];
  placements: WordPlacement[];
}

const GRID_SIZE = 12;
const WORDS_PER_PUZZLE = 8;

const WORD_LISTS: Record<Theme, string[]> = {
  Animals: [
    "ELEPHANT", "GIRAFFE", "PENGUIN", "DOLPHIN", "CHEETAH", "GORILLA",
    "LEOPARD", "BUFFALO", "HAMSTER", "PARROT", "FALCON", "TURTLE",
    "JAGUAR", "RABBIT", "SALMON", "MONKEY", "IGUANA", "BEAVER",
    "BADGER", "CONDOR", "DONKEY", "FERRET", "HERON", "KOALA",
    "LEMUR", "MOOSE", "OTTER", "PANDA", "QUAIL", "RAVEN",
    "SHARK", "TIGER", "VIPER", "WHALE", "ZEBRA", "CRANE",
    "EAGLE", "FINCH", "GECKO", "HIPPO", "LLAMA", "MOUSE",
    "NEWT", "OCTOPUS", "PIGEON", "ROBIN", "SNAIL", "TROUT",
    "WOLF", "BISON", "COBRA", "DINGO",
  ],
  Colors: [
    "CRIMSON", "SCARLET", "MAGENTA", "FUCHSIA", "VIOLET", "INDIGO",
    "COBALT", "AZURE", "TEAL", "EMERALD", "JADE", "OLIVE",
    "LIME", "AMBER", "GOLD", "BRONZE", "COPPER", "CORAL",
    "SALMON", "PEACH", "IVORY", "CREAM", "PEARL", "SILVER",
    "PEWTER", "SLATE", "CHARCOAL", "ONYX", "EBONY", "MAROON",
    "BURGUNDY", "RUST", "SIENNA", "OCHRE", "SAFFRON", "LEMON",
    "CANARY", "KHAKI", "BEIGE", "TAN", "MAHOGANY", "PLUM",
    "MAUVE", "LILAC", "PERIWINKLE", "NAVY", "CYAN", "AQUA",
    "MINT", "SAGE", "FOREST", "HUNTER",
  ],
  Foods: [
    "SPAGHETTI", "PANCAKE", "LASAGNA", "BURRITO", "PRETZEL",
    "BROWNIE", "MUFFIN", "WAFFLE", "YOGURT", "CHEESE",
    "BUTTER", "ALMOND", "WALNUT", "CASHEW", "PISTACHIO",
    "AVOCADO", "BROCCOLI", "SPINACH", "CABBAGE", "LETTUCE",
    "TOMATO", "PEPPER", "CARROT", "CELERY", "TURNIP",
    "RADISH", "GARLIC", "ONION", "POTATO", "BANANA",
    "MANGO", "PAPAYA", "CHERRY", "GRAPE", "LEMON",
    "MELON", "PEACH", "OLIVE", "BREAD", "PASTA",
    "PIZZA", "TACO", "STEAK", "BACON", "SHRIMP",
    "SALMON", "COOKIE", "DONUT", "CANDY", "FUDGE",
    "SALAD", "CURRY",
  ],
  Countries: [
    "BRAZIL", "CANADA", "FRANCE", "GERMANY", "INDIA",
    "JAPAN", "MEXICO", "NORWAY", "POLAND", "SPAIN",
    "SWEDEN", "TURKEY", "EGYPT", "CHILE", "CUBA",
    "PERU", "IRAN", "IRAQ", "NEPAL", "OMAN",
    "QATAR", "FIJI", "KENYA", "GHANA", "MALI",
    "NIGER", "CHAD", "TOGO", "BENIN", "ITALY",
    "GREECE", "AUSTRIA", "BELGIUM", "DENMARK", "FINLAND",
    "ICELAND", "IRELAND", "PORTUGAL", "ROMANIA", "SERBIA",
    "CROATIA", "UKRAINE", "GEORGIA", "ARMENIA", "JORDAN",
    "LEBANON", "ISRAEL", "PANAMA", "BOLIVIA", "ECUADOR",
    "COLOMBIA", "MOROCCO",
  ],
  Sports: [
    "BASEBALL", "FOOTBALL", "BASKETBALL", "TENNIS", "SOCCER",
    "CRICKET", "HOCKEY", "BOXING", "FENCING", "ROWING",
    "SAILING", "SURFING", "CYCLING", "DIVING", "SKIING",
    "CURLING", "ARCHERY", "BOWLING", "KARATE", "JUDO",
    "SQUASH", "RUGBY", "POLO", "GOLF", "DARTS",
    "LACROSSE", "SWIMMING", "RUNNING", "JUMPING", "DISCUS",
    "JAVELIN", "SHOTPUT", "SPRINT", "HURDLE", "RELAY",
    "HAMMER", "VAULT", "SLALOM", "BIATHLON", "LUGE",
    "BOBSLED", "SKATING", "NETBALL", "SOFTBALL", "HANDBALL",
    "BADMINTON", "TRIATHLON", "MARATHON", "GYMNAST", "WRESTLE",
    "PADDLE", "CLIMBING",
  ],
};

// 8 directions: right, down-right, down, down-left, left, up-left, up, up-right
const DIRECTIONS: [number, number][] = [
  [0, 1], [1, 1], [1, 0], [1, -1],
  [0, -1], [-1, -1], [-1, 0], [-1, 1],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    const cell = grid[r]![c]!;
    if (cell !== "" && cell !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): void {
  for (let i = 0; i < word.length; i++) {
    grid[row + i * dRow]![col + i * dCol] = word[i]!;
  }
}

export function generatePuzzle(theme: Theme): Puzzle {
  const allWords = WORD_LISTS[theme];
  const shuffled = shuffle(allWords);

  // Filter words that fit in the grid
  const candidates = shuffled.filter((w) => w.length <= GRID_SIZE);

  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ""),
  );

  const placements: WordPlacement[] = [];
  const placedWords: string[] = [];

  for (const word of candidates) {
    if (placedWords.length >= WORDS_PER_PUZZLE) break;

    const dirs = shuffle(DIRECTIONS);
    let placed = false;

    for (const [dRow, dCol] of dirs) {
      if (placed) break;
      const positions = shuffle(
        Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => [
          Math.floor(i / GRID_SIZE),
          i % GRID_SIZE,
        ] as [number, number]),
      );

      for (const [row, col] of positions) {
        if (canPlace(grid, word, row, col, dRow!, dCol!)) {
          placeWord(grid, word, row, col, dRow!, dCol!);
          placements.push({ word, startRow: row, startCol: col, dRow: dRow!, dCol: dCol! });
          placedWords.push(word);
          placed = true;
          break;
        }
      }
    }
  }

  // Fill empty cells with random letters
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] === "") {
        grid[r]![c] = LETTERS[Math.floor(Math.random() * LETTERS.length)]!;
      }
    }
  }

  return { grid, words: placedWords.sort(), placements };
}

/** Get the set of cells (as "row,col" strings) for a placed word */
export function getWordCells(placement: WordPlacement): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < placement.word.length; i++) {
    cells.add(`${placement.startRow + i * placement.dRow},${placement.startCol + i * placement.dCol}`);
  }
  return cells;
}

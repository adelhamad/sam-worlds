// Chess Camp player-facing strings. Rules: ≤ 8 simple words per line, warm
// tone, and the words "wrong" / "fail" never appear. Each section is owned by
// one part of the feature — add keys to your own section only.
import { persona } from "../persona.config";

const guide = persona.guide;

/** "the rook" when a piece is named, otherwise the fallback ("a piece"). */
function named(piece: string | null, fallback: string, article = "the"): string {
  return piece ? `${article} ${piece}` : fallback;
}

export const CHESS = {
  title: "Chess Camp",
  tagline: `Learn chess with ${guide}!`,

  /** Piece names (singular), shared by every section. */
  piece: { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" },

  /** Puzzle prompts and hints written by the lesson planner (engine). */
  engine: {
    spotMoves: (piece: string) => `Where can the ${piece} go?`,
    spotCaptures: (piece: string) => `What can the ${piece} capture?`,
    spotAttackers: "Who is attacking your king?",
    spotSafe: "Where is the king safe?",
    stars: (stars: number, moves: number) =>
      `Collect the ${stars === 1 ? "star" : "stars"} in ${moves} ${moves === 1 ? "move" : "moves"}`,
    captureOne: (piece: string, moves: number) => `Capture the ${piece} in ${moves} ${moves === 1 ? "move" : "moves"}`,
    captureAll: (moves: number) => `Capture every piece in ${moves} moves`,
    captureBest: "Capture the best piece!",
    promote: (moves: number) => `Reach the top in ${moves} moves`,
    check: "Check the king in 1 move",
    escape: "Save your king!",
    mate: "Checkmate in 1 move",
    count: "How many points?",
    placeOne: (piece: string) => `Put the ${piece} at home`,
    placeTwo: (piece: string) => `Put the ${piece}s at home`,
    placeRoyals: "Put the king and queen at home",
    placeGroup: "Put the pieces at home",
    placeRow: "Set up the back row",
    hintMove: {
      K: "The king takes one step, any way.",
      Q: "The queen slides straight or diagonally.",
      R: "The rook slides in straight lines.",
      B: "The bishop slides along diagonals.",
      N: "The knight jumps in an L shape.",
      P: "Pawns step forward and capture diagonally.",
    },
    hintCapture: {
      K: "The king cannot take a guarded piece.",
      Q: "The queen captures along her lines.",
      R: "The rook captures along straight lines.",
      B: "The bishop captures along diagonals.",
      N: "The knight captures where it lands.",
      P: "Pawns capture one step diagonally forward.",
    },
    hintAttackers: "Follow each piece's path to your king.",
    hintSafe: "A safe square is one nobody attacks.",
    hintCheck: "Check means your piece attacks the king.",
    hintEscape: "Step to a square nobody attacks.",
    hintMate: "Attack the king and block every escape.",
    /** "Rook 5, knight 3, pawn 1." from ["rook 5", "knight 3", "pawn 1"]. */
    hintCount: (parts: string[]) => {
      const line = parts.join(", ");
      return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
    },
    hintPlace: {
      K: "The king stands beside his queen.",
      Q: "The queen starts on her own colour.",
      R: "Rooks live in the corners.",
      B: "Bishops stand beside the king and queen.",
      N: "Knights stand next to the rooks.",
      P: "Pawns line up in front.",
    },
    hintRow: "Rooks, knights, bishops, then queen and king.",
  },

  /** Board, widgets and teach cards. */
  exercise: {
    // Board labels for screen readers.
    side: { w: "white", b: "black" },
    squarePiece: (square: string, side: string, piece: string) => `${square}, ${side} ${piece}`,
    squareStar: (square: string) => `${square}, star`,
    // The one instruction line above each widget.
    spotHelp: {
      moves: "Tap every square it can reach.",
      captures: "Tap every piece it can capture.",
      attackers: "Tap every piece that attacks it.",
      safe: "Tap every safe square.",
    },
    picked: (n: number) => `${n} picked`,
    /** `piece` is the only piece that can move, or null when the child must choose. */
    missionHelp: {
      stars: (piece: string | null) => `Drag ${named(piece, "a piece")} to a star.`,
      capture: (piece: string | null) => `Drag ${named(piece, "a piece")} to capture.`,
      promote: (piece: string | null) => `Drag ${named(piece, "a pawn")} to the top.`,
      check: (piece: string | null) => `Drag ${named(piece, "a piece")} to give check.`,
      mate: (piece: string | null) => `Drag ${named(piece, "a piece")} to trap the king.`,
      escape: (piece: string | null) => `Drag ${named(piece, "a piece", "your")} to a safe square.`,
    },
    movesLeft: (n: number) => (n === 1 ? "1 move left" : `${n} moves left`),
    starsGot: (got: number, all: number) => `${got} of ${all} stars`,
    capturesGot: (got: number, all: number) => `${got} of ${all} captured`,
    goal: {
      stars: "Collect the stars",
      capture: "Capture the pieces",
      promote: "Reach the top row",
      check: "Give check",
      mate: "Checkmate",
      escape: "Save the king",
    },
    won: "You did it!",
    outOfMoves: "Out of moves!",
    stillDanger: "Still in danger!",
    countHelp: "Add up the points.",
    countDisplay: "Your number",
    erase: "Erase",
    placeHelp: "Drag each piece to its home.",
    placeBack: "Drag a piece back to change it.",
    homeSquare: (square: string, piece: string | null) => (piece ? `${square}, ${piece}` : `${square}, empty`),
    trayPiece: (piece: string) => `${piece} to place`,
    // Teach cards ("Almost — look at this.").
    rule: {
      K: "The king takes one step, any way.",
      Q: "The queen slides straight or diagonally.",
      R: "The rook slides in straight lines.",
      B: "The bishop slides along diagonals.",
      N: "The knight jumps in an L shape.",
      P: "Pawns step forward and capture diagonally.",
    },
    teachAttackers: "These pieces can reach it.",
    teachSafe: "A safe square is one nobody attacks.",
    teachGoal: {
      promote: "At the top, a pawn becomes a queen!",
      check: "Check! Your piece attacks the king.",
      mate: "Checkmate! The king has no way out.",
      escape: "The king steps out of danger.",
    },
    legendGood: "You found it",
    legendMissed: {
      moves: "It can go here too",
      captures: "It can capture this too",
      attackers: "This one attacks too",
      safe: "This square is safe too",
    },
    legendExtra: "Not this one",
    worth: (piece: string, points: number) => `${piece} ${points}`,
    home: {
      K: "The king stands beside his queen.",
      Q: "The queen starts on her own colour.",
      R: "Rooks live in the corners.",
      B: "Bishops stand beside the king and queen.",
      N: "Knights stand next to the rooks.",
      P: "Pawns line up in front.",
    },
    homeRow: "Rooks, knights, bishops, then queen and king.",
  },

  /** Lesson opening demos ("Meet the Rook"). */
  meet: {
    letsGo: "Let's go!",
    tryIt: "Drag it to any dot!",
    again: "Again",
    priceless: "Priceless!",
    points: (n: number) => (n === 1 ? "1 point" : `${n} points`),
    intro: {
      R: { title: "Meet the rook!", lines: ["It slides in straight lines.", "As far as it likes!"] },
      B: { title: "Meet the bishop!", lines: ["It slides along diagonals.", "It always stays on one colour."] },
      Q: { title: "Meet the queen!", lines: ["She slides straight or diagonally.", "She is the strongest piece!"] },
      K: { title: "Meet the king!", lines: ["He takes one step, any way.", "Always keep him safe!"] },
      N: { title: "Meet the knight!", lines: ["It jumps in an L shape.", "Two squares, then one sideways.", "It can jump over pieces!"] },
      P: { title: "Meet the pawn!", lines: ["It steps straight ahead.", "Its first step can be two.", "It captures diagonally."] },
      values: { title: "Every piece has points!", lines: ["More points means more power.", "The king is priceless!"] },
      home: { title: "Every piece has a home!", lines: ["Rooks live in the corners.", "Knights next, then bishops.", "Queen on her colour, king beside."] },
      check: { title: "This is check!", lines: ["Check! The king is in danger.", "He must get safe right away."] },
      mate: { title: "This is checkmate!", lines: ["Checkmate! The king is trapped.", "No safe square is left.", "That wins the game!"] },
    },
  },

  /** Path screen bits that are chess-only (chess set shelf). */
  path: {
    title: `${guide}'s Chess Camp`,
    set: "Chess set",
    setTitle: `${persona.name}'s Chess Set`,
    setCount: (owned: number, total: number) => `${owned} / ${total} keepsakes`,
    setHow: "Open treasure chests to fill it!",
    setFull: "Your chess set is full!",
    setHidden: "Open a chest to find me!",
    setMystery: "???",
    // Lesson card
    puzzles: (count: number) => `${count} puzzles`,
    // End of the course
    finished: `You are a chess champion, ${persona.name}!`,
    finishedSub: "Play any lesson again!",
  },
};

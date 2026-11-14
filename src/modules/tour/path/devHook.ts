// DEV only: lets the screenshot bench seed mid-game states from the console,
// e.g. `__game.getState().setWorldProgress("tour", 7)`. Stripped from builds.
import { useGame } from "../../../state/store";

if (import.meta.env.DEV) {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}

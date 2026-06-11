import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  sonarjs.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Growth guardrails (requested): keep files and functions tame.
      "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 25],
      "sonarjs/cognitive-complexity": ["error", 25],
      // Pixi scene builders chain many magic coordinates; these Sonar rules
      // produce noise rather than safety in a game codebase.
      "sonarjs/no-nested-functions": "off",
      "sonarjs/pseudo-random": "off", // gameplay randomness is not security-sensitive
      // Autosave is deliberately fire-and-forget: `void db.x.put(...)`.
      "sonarjs/void-use": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ["scripts/**", "*.config.{js,ts}", "vite.config.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);

// @ts-check
import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import tanstackRouter from "@tanstack/eslint-plugin-router";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

import { paddingAroundHooks } from "./eslint-rules/padding-around-hooks.mjs";
import { paddingBetweenExpressionKinds } from "./eslint-rules/padding-between-expression-kinds.mjs";

// A conditional call is a branch, and the branch is an `if` (see the code-conventions skill). It is a
// constant because the configuration module's override has to list it again.
const OPTIONAL_CALL = {
  selector: "CallExpression[optional=true]",
  message: "Write the `if`, then the call: an optional call hides the branch at the end of the line.",
};

export default tseslint.config(
  {
    // Generated files: `api:types` writes the API schema and the router plugin writes the route tree.
    ignores: ["eslint.config.mjs", "commitlint.config.mjs", "dist/**", "coverage/**", "src/**/*.gen.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  jsxA11y.flatConfigs.recommended,
  ...tanstackQuery.configs["flat/recommended"],
  ...tanstackRouter.configs["flat/recommended"],
  {
    plugins: {
      "@stylistic": stylistic,
      "better-tailwindcss": betterTailwindcss,
      "import-x": importX,
      // The project's own rules, in eslint-rules/.
      local: {
        rules: {
          "padding-around-hooks": paddingAroundHooks,
          "padding-between-expression-kinds": paddingBetweenExpressionKinds,
        },
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: "./tsconfig.app.json",
        }),
      ],
      "better-tailwindcss": {
        entryPoint: "src/styles.css",
      },
    },
  },
  {
    files: ["*.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      // `any` is forbidden by the code-conventions skill. The rule has to be on here too:
      // that skill says the linter wins when they disagree, so a linter that permits `any`
      // would quietly turn the convention into a suggestion.
      "@typescript-eslint/no-explicit-any": "error",

      // Every guard takes braces, a bare `return;` included (see the code-conventions skill): one
      // shape for every guard, and a statement added under an unbraced one cannot slip outside it.
      curly: ["error", "all"],
      "@typescript-eslint/no-floating-promises": "error",

      // The code-conventions skill forbids console.*; errors reach the user through the toast and the
      // error reporter (the observability skill's port), never the devtools of whoever is looking.
      "no-console": "error",

      // The UI primitives are Base UI. A Radix import is a second headless library with a different
      // API for the same components — the one the shadcn registry used to default to.
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "radix-ui", message: "The UI primitives are Base UI (@base-ui/react)." }],
          patterns: [{ group: ["@radix-ui/*"], message: "The UI primitives are Base UI (@base-ui/react)." }],
        },
      ],

      // Left off deliberately, as in the backend: these fire on values coming out of third-party
      // types the project does not control (a chart library's payloads, a JSON body before its
      // schema parses it), not on `any` written here — which the rule above already rejects.
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/unbound-method": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
        },
      ],
      // Deliberately off. A type is written where it adds information — an exported signature, a
      // value whose inferred type is wrong or unreadable — and inference covers the rest.
      "@typescript-eslint/typedef": "off",

      // A type-only import says so, in a statement of its own (see the code-conventions skill): with
      // verbatimModuleSyntax the bundler keeps every import it is not told is a type, so a type
      // reference mixed into a value import becomes a runtime import of a module that may not exist.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],

      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@test/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import-x/newline-after-import": ["error", { count: 1 }],
      "import-x/no-duplicates": "error",
      "import-x/first": "error",

      "@stylistic/indent": ["error", 2],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/arrow-spacing": "error",
      "@stylistic/block-spacing": "error",
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "@stylistic/comma-spacing": "error",
      "@stylistic/key-spacing": "error",
      "@stylistic/keyword-spacing": "error",
      "@stylistic/no-multi-spaces": "error",
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
      "@stylistic/space-before-blocks": "error",
      "@stylistic/space-infix-ops": "error",
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/linebreak-style": ["error", "unix"],
      // Anything spanning more than one line gets a blank line on each side, and a declaration is
      // apart from the bare statement beside it (code-conventions).
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: ["multiline-const", "multiline-let", "multiline-expression", "multiline-block-like", "multiline-return", "multiline-export", "multiline-type"], next: "*" },
        { blankLine: "always", prev: "*", next: ["multiline-const", "multiline-let", "multiline-expression", "multiline-block-like", "multiline-return", "multiline-export", "multiline-type"] },
        { blankLine: "always", prev: ["const", "let"], next: "expression" },
        { blankLine: "always", prev: "expression", next: ["const", "let"] },
      ],

      // One-line statements that do different kinds of work are apart: an assignment and a call, a
      // function call and a method call, and an awaited step and one that is not (code-conventions).
      "local/padding-between-expression-kinds": "error",

      // The paragraph rule for hooks (code-conventions): a blank line between a statement that reads
      // a hook and one that does not, and between two hooks unless they read the same thing — the
      // same hook, or the same object's hooks.
      "local/padding-around-hooks": "error",

      // The same height rule between JSX siblings: a multi-line element gets a blank line on each
      // side, and a run of single-line siblings stays packed.
      "@stylistic/jsx-newline": ["error", { prevent: true, allowMultilines: true }],
      "@stylistic/jsx-quotes": ["error", "prefer-double"],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/jsx-closing-bracket-location": "error",
      "@stylistic/jsx-closing-tag-location": "error",
      "@stylistic/jsx-curly-spacing": ["error", "never"],
      "@stylistic/jsx-equals-spacing": ["error", "never"],
      "@stylistic/jsx-tag-spacing": ["error", { beforeSelfClosing: "always" }],
      "@stylistic/jsx-self-closing-comp": "error",
      "@stylistic/jsx-wrap-multilines": [
        "error",
        { declaration: "parens-new-line", assignment: "parens-new-line", return: "parens-new-line", arrow: "parens-new-line" },
      ],

      // Tailwind: classes the theme does not define, conflicting and duplicated classes, and the order.
      ...betterTailwindcss.configs["recommended-error"].rules,
      // Marker classes the shadcn components put on their roots for a stylesheet to hook into. They
      // generate no utility, and that is what they are for.
      "better-tailwindcss/no-unknown-classes": ["error", { ignore: ["^cn-"] }],

      // Configuration is read once, validated, from the module that owns it (see the configuration
      // skill). A raw read elsewhere skips the validation and scatters the variable names.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
          message: "Read configuration from @/common/config/env, which validates it.",
        },
        OPTIONAL_CALL,
      ],
    },
  },
  {
    // The end-to-end suite is Node driving a browser, not React: a Playwright fixture hands its value
    // over by calling `use`, which the hooks rules would read as React's.
    files: ["e2e/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // The module that validates the configuration is the one place that reads it raw. An override
    // replaces the rule's whole option list, so the selectors that still apply are listed again.
    files: ["src/common/config/env.ts"],
    rules: {
      "no-restricted-syntax": ["error", OPTIONAL_CALL],
    },
  },
  {
    // A route file exports its `Route`, which the router plugin reads; the component it names lives
    // in the feature and is split into its own chunk.
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": ["error", { allowExportNames: ["Route"] }],
    },
  },
  {
    // shadcn ships a component's variants and hooks in the component's own file, and splitting them
    // out would turn every catalog update into a hand merge. What the rule protects is state kept
    // across a hot reload, which a primitive nobody is editing never needs. The names are listed
    // rather than the rule switched off, so a new non-component export still has to be looked at.
    files: ["src/common/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowExportNames: [
            "badgeVariants",
            "buttonGroupVariants",
            "buttonVariants",
            "createToastManager",
            "markerVariants",
            "navigationMenuTriggerStyle",
            "tabsListVariants",
            "toast",
            "toggleVariants",
            "useCarousel",
            "useComboboxAnchor",
            "useDirection",
            "useMessageScroller",
            "useMessageScrollerScrollable",
            "useMessageScrollerVisibility",
            "useSidebar",
            "useToastManager",
          ],
        },
      ],
    },
  },
);

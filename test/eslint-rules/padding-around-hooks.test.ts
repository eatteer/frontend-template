import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { paddingAroundHooks } from "../../eslint-rules/padding-around-hooks.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("padding-around-hooks", paddingAroundHooks, {
  valid: [
    {
      name: "calls to the same hook or the same object packed together, and a blank line before the work",
      code: [
        "function UserPage() {",
        "  const { id } = route.useParams();",
        "  const navigate = route.useNavigate();",
        "",
        "  const nameId = useId();",
        "  const emailId = useId();",
        "",
        "  const title = navigate(id);",
        "  return title;",
        "}",
      ].join("\n"),
    },
    {
      name: "a blank line after the work, before a hook",
      code: "function useThing() {\n  const x = 1;\n\n  const y = useMemo(x);\n}",
    },
    {
      name: "a function that is neither a component nor a hook",
      code: "function submit() {\n  const client = useClient();\n  client.send();\n}",
    },
    {
      name: "a comment above the work, after the blank line",
      code: "const Page = () => {\n  const t = useT();\n\n  // why\n  return t;\n};",
    },
  ],
  invalid: [
    {
      name: "two hooks that read different things",
      code: "function UserDetails() {\n  const { t } = useTranslation();\n  const format = useFormatters();\n}",
      output: "function UserDetails() {\n  const { t } = useTranslation();\n\n  const format = useFormatters();\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a route hook after a hook on another object",
      code: "function Page() {\n  const search = route.useSearch();\n  const other = otherRoute.useSearch();\n}",
      output: "function Page() {\n  const search = route.useSearch();\n\n  const other = otherRoute.useSearch();\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "two different hooks written through the React namespace",
      code: "function Chart() {\n  const id = React.useId();\n  const context = React.useContext(Context);\n}",
      output: "function Chart() {\n  const id = React.useId();\n\n  const context = React.useContext(Context);\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "the work butted against the hooks",
      code: "function UserPage() {\n  const { t } = useTranslation();\n  const title = t(\"x\");\n}",
      output: "function UserPage() {\n  const { t } = useTranslation();\n\n  const title = t(\"x\");\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a hook after the work, through a member call",
      code: "const Page = () => {\n  const x = 1;\n  const params = route.useParams();\n};",
      output: "const Page = () => {\n  const x = 1;\n\n  const params = route.useParams();\n};",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a trailing comment stays on the hook's line",
      code: "function useThing() {\n  const ref = useRef(false); // latch\n  return ref;\n}",
      output: "function useThing() {\n  const ref = useRef(false); // latch\n\n  return ref;\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
  ],
});

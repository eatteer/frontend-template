import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { paddingBetweenExpressionKinds } from "../../eslint-rules/padding-between-expression-kinds.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
  },
});

ruleTester.run("padding-between-expression-kinds", paddingBetweenExpressionKinds, {
  valid: [
    {
      name: "a run of calls packed together",
      code: "setDraft(value);\nsetCommitted(value);\nonChange(value);",
    },
    {
      name: "a run of assignments packed together",
      code: "user.name = name;\nuser.email = email;\ncount++;",
    },
    {
      name: "a run of awaited steps packed together",
      code: "async function run() {\n  await user.click(next);\n  await user.click(previous);\n}",
    },
    {
      name: "an assignment and a call already apart",
      code: "isSubmitting.current = true;\n\ncreateUser.mutate(values);",
    },
    {
      name: "an awaited step and a call already apart",
      code: "async function run() {\n  await user.click(submit);\n\n  expect(screen).toBeDefined();\n}",
    },
    {
      name: "a declaration beside a call, which padding-line-between-statements owns",
      code: "const user = build();\nsave(user);",
    },
    {
      name: "a statement taller than a line, which padding-line-between-statements owns",
      code: "user.name = name;\nsave(\n  user,\n);",
    },
    {
      name: "a comment between the two statements after the blank line",
      code: "user.name = name;\n\n// why\nsave(user);",
    },
    {
      name: "the consequent of a switch case",
      code: "switch (kind) {\n  case \"a\":\n    first();\n    second();\n    break;\n}",
    },
  ],
  invalid: [
    {
      name: "an assignment before a call",
      code: "isSubmitting.current = true;\ncreateUser.mutate(values);",
      output: "isSubmitting.current = true;\n\ncreateUser.mutate(values);",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a call before an assignment",
      code: "function reset() {\n  save(user);\n  user.name = name;\n}",
      output: "function reset() {\n  save(user);\n\n  user.name = name;\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "an awaited step before one that is not",
      code: "async function run() {\n  await expect(query).rejects.toThrow(error);\n  expect(checker).not.toHaveBeenCalled();\n}",
      output: "async function run() {\n  await expect(query).rejects.toThrow(error);\n\n  expect(checker).not.toHaveBeenCalled();\n}",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a trailing comment stays on the statement's line",
      code: "count++; // latch\nsave(count);",
      output: "count++; // latch\n\nsave(count);",
      errors: [{ messageId: "missingBlankLine" }],
    },
    {
      name: "a comment between the two statements with no blank line",
      code: "user.name = name;\n// why\nsave(user);",
      output: "user.name = name;\n\n// why\nsave(user);",
      errors: [{ messageId: "missingBlankLine" }],
    },
  ],
});

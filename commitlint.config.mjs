// Conventional Commits, as the git-workflow skill states them. The preset already rejects a subject
// in sentence, start or upper case and a trailing period; what it does not know is this project's
// list of types, which is narrower than its own.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "refactor", "perf", "docs", "test", "build", "ci", "chore", "revert"]],
    // A warning, not an error: the scope names the feature, but a change that spans the whole
    // repository has no feature to name.
    "scope-empty": [1, "never"],
  },
};

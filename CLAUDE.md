# frontend-template

React + TypeScript + Vite, against backend-template.

## Source of truth

Patterns and conventions live in the `frontend-architecture` plugin's skills, installed from the
marketplace declared in `.claude/settings.json`. Each skill's `description` and `when_to_use` carry
its own triggers, so there is no index to maintain here. Invoke every matching skill before
implementing: a change that spans the API client, a screen and its tests — the common case — needs
all of them, not the first one that matched.

Nothing in this file restates a convention. When the code and a skill disagree, the skill is the
authority and the code is the bug.

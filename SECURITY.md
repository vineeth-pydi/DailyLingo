# Security policy

Supported release: the current `main` branch and v0.1.x alpha.

FreeLingo is a static app. It stores learner data locally and does not use app API keys or server accounts. Imported progress is validated before it replaces device data. This does not make browser storage a secure place for secrets; never store credentials there.

Do not publish sensitive reproduction data or credentials in public issues. Use GitHub's private vulnerability reporting on the repository's Security tab if it is enabled. Maintainers should enable that channel before inviting a broader public cohort.

For non-sensitive robustness problems, open an issue with browser version, expected behavior, and minimal reproduction steps. Remove identifying history from any example backup.

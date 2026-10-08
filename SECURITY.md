# Security policy

Supported release: the current `main` branch and v0.2.x alpha.

FreeLingo is a static app. It stores learner data locally and does not use app API keys or server accounts. Imported progress is validated before it replaces device data. This does not make browser storage a secure place for secrets; never store credentials there.

Do not publish sensitive reproduction data or credentials in public issues. Private vulnerability reporting is enabled for `vineeth-pydi/FreeLingo`: use the repository's Security tab to report a vulnerability privately. Fork maintainers should enable their own private reporting channel before inviting a broader public cohort.

For non-sensitive robustness problems, open an issue with browser version, expected behavior, and minimal reproduction steps. Remove identifying history from any example backup.

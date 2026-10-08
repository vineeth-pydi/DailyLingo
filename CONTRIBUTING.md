# Contributing to FreeLingo

Help learners connect through better content and a more usable app.

## Start here

1. Open an issue describing a focused problem or improvement. For small corrections, a pull request with an explanation is enough.
2. Fork the repository and create a branch for your change.
3. Use Node.js 22+ and run `npm run dev`. No dependency installation is needed.
4. Make the smallest coherent change. Keep all asset paths relative for GitHub Pages.
5. Run `npm run check`, `npm test`, and `npm run build`.
6. For interface changes, check a narrow phone layout, keyboard navigation, and Arabic RTL text. Include a screenshot or concise validation notes in the pull request.
7. Submit a pull request describing the learner problem, the behavior change, and checks performed.

## Content corrections

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md). Include the language/variety, phrase ID, suggested correction, why it is natural, and whether the change affects the reading aid or accepted forms. Explain your familiarity with the language without sharing private information. Content changes need an independent qualified reviewer before they are labeled reviewed.

## Project boundaries

- Preserve the dependency-free static application unless a feature justifies a documented architecture change.
- Avoid introducing tracking, mandatory accounts, paid services, or third-party assets without discussing the learner benefit and privacy impact.
- Never commit credentials, personal progress exports, or identifying learner data.
- Use DOM text escaping for any value read from files, storage, user input, or imported content.
- Add tests for substantive scheduling, persistence, or normalization changes.

## Licensing and conduct

By contributing, you agree to release your contribution under this repository's MIT license. Contribute only work you can license. Follow the [code of conduct](CODE_OF_CONDUCT.md); be kind, specific, and open to corrections.

[![pages-build-deployment](https://github.com/HenrySwanson/HenrySwanson.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/HenrySwanson/HenrySwanson.github.io/actions/workflows/pages/pages-build-deployment)

This'll become a personal site eventually.

For now, I'm just using it to stash some experiments in learning web development.

Structure:
- `asset-gen/`: The asset generation pipeline. A nasty kludge of npm things that I don't quite understand.
- `content/`: The Markdown/HTML sources for the site
- `docs/`: The generated website data. Zola outputs to this file, and Github Pages reads from it.
- `sass/`: SCSS files that Zola compiles into CSS files
- `static/`: Zola thinks these are static assets, but they actually come from the asset generation
- `templates/`: Templates for Zola to create HTML with

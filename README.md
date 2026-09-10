# Rupinder Kaur Birthday Film

A self-contained, one-page birthday website designed as an interactive Indian retro film. It includes the opening countdown, photographic archives, birthday broadcast, clickable Easter eggs, all 20 team greetings, rolling credits, and the Make A Wish finale.

## Preview locally

From the extracted project folder, run:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080` in a browser.

You can also use any ordinary static-file server and point it at the `dist` folder.

## Production build

The website is already built. No package installation, compilation, API key, database, or backend is required. The complete production site lives in `dist`.

All page links and media paths are relative, so the same files work at a GitHub repository subpath as well as at a root domain.

## Deploy to GitHub Pages

1. Create a GitHub repository with `main` as its default branch.
2. Upload the complete contents of this project, including the hidden `.github` folder.
3. In the repository, open **Settings > Pages** and select **GitHub Actions** as the source.
4. Push to `main`, or open the **Actions** tab and run **Deploy Rupinder Birthday Website**.

The included workflow publishes the contents of `dist` automatically.

For Netlify, Vercel, Cloudflare Pages, or another static host, choose `dist` as the publish directory.

## Where everything lives

- Rupinder's optimized website photographs: `dist/assets/images/`
- Untouched source copies of all supplied photographs: `dist/assets/images/originals/`
- All birthday messages: `dist/assets/js/greetings.js`
- Interactions and scroll behavior: `dist/assets/js/app.js`
- Art direction and responsive layouts: `dist/assets/css/styles.css`
- Texture and favicon assets: `dist/assets/textures/` and `dist/assets/icons/`

## Technology

The site uses semantic HTML, modern CSS, and dependency-free vanilla JavaScript. Interactive features use native browser APIs including Web Audio, Intersection Observer, dialogs, and requestAnimationFrame. No external runtime libraries, remote fonts, CDNs, cookies, analytics, or network requests are used.

## Photo note

The photographs are supplied for this personal birthday website. Keep their use within the permission granted by the people who provided them.

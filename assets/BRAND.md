# Brand

The name is the concept. A *swarm* of agents, given a *ville* to live in — the
work is not a log, it is a place. The banner is not an illustration of the
product, it is a frame of it: one screenshot of the village at full zoom, every
agent standing at its own desk, nothing staged.

The background (`artwork.jpg`) comes from the game; the type is drawn over it in
HTML, never baked into the image. That split is deliberate — it is what keeps the
wordmark pixel-identical across languages and crisp at any size, instead of
hoping an image model spells three languages correctly.

## Palette

Taken from the tiles, not invented next to them.

| Token | Hex | Use |
|---|---|---|
| Night | `#16140f` | Background. Near-black, warm, never pure `#000`. |
| Paper | `#f4ece0` | Wordmark and primary text. Warm off-white. |
| Clay | `#e0a86b` | The accent block, panel borders, the busy ring on an agent. |
| Grass | `#7fa86a` | The village floor. Cool counterweight. |
| Muted | `#b6a894` | Tagline. |
| Faint | `#7e7365` | Monospace footnote. |

No gradients beyond the scrim. No drop shadows — depth comes from the 1px
translucent rule at the baseline and a 1px inner highlight on panels.

## Wordmark

`SwarmVille` set in Helvetica Neue Semibold at `-0.045em` tracking, followed by a
**drawn square block**, never a typed period.

That block is a rule, not a preference. A `.` glyph is square in one face and
round in the next, so the logo reshaped itself between the English and Chinese
banners until it was drawn as an element. The block is also the game's own unit:
one pixel, square, sharp-edged. The wordmark pins its own font stack and never
inherits the CJK stack used for body copy, for the same reason.

## Regenerating

The artwork is a real screenshot. Take one at zoom 1 with the UI hidden:

```js
// in the browser console, on the running app
document.querySelectorAll('#root>div>*:not(canvas)').forEach(n => (n.style.display = 'none'))
```

Crop the band you want, upscale it with **nearest neighbour** — never bilinear,
it is pixel art — and save it as `assets/artwork.jpg`.

```bash
node assets/banner.mjs build
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1200,400 --screenshot=build/banner-en.png "file://$PWD/build/banner-en.html"
```

Banners are 1200×400 (shipped at 2×). The social card is 1280×640.

Adding a language means one entry in the `V` map — tagline and footnote — and one
render. Keep the tagline to a single line at 1200px; it is the only string that
has to fit.

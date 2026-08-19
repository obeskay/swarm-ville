import fs from 'node:fs'

const OUT = process.argv[2]

// Background is the game itself (assets/artwork.jpg): one frame of the village
// at full zoom, every agent at its desk. Type is drawn over it rather than baked
// into the image, so the wordmark stays identical and crisp in every language.
const V = {
  en: { tag: 'An agentic loop you can walk around in', foot: 'plant an idea, watch the swarm grow it' },
  es: { tag: 'Un bucle de agentes por el que puedes caminar', foot: 'planta una idea y mira crecer al enjambre' },
  zh: { tag: '一个可以走进去的智能体工作流', foot: '种下一个想法，看着蜂群把它养大' },
}

const page = (lang, w, h) => {
  const v = V[lang]
  const cjk = lang === 'zh'
  const big = cjk ? 92 : 100
  return `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{background:#16140f url("artwork.jpg") center right/cover no-repeat;
       font-family:${cjk ? '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC",' : ''}-apple-system,"Helvetica Neue",Arial,sans-serif;
       color:#f4ece0;display:flex;align-items:center;position:relative}
  /* Scrim: the artwork must never decide whether the type is readable. */
  body::before{content:"";position:absolute;inset:0;z-index:1;
    background:linear-gradient(90deg,#16140f 0%,rgba(22,20,15,.96) 34%,rgba(22,20,15,.6) 54%,rgba(22,20,15,.14) 76%,rgba(22,20,15,.34) 100%)}
  body::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;z-index:3;background:rgba(224,168,107,.16)}
  .wrap{position:relative;z-index:2;padding:0 ${Math.round(w * 0.066)}px;width:100%}
  /* The wordmark never inherits the CJK stack: font fallback would reshape the
     logo per language, and a logo that changes shape is not a logo. */
  h1{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:${big}px;font-weight:600;
     letter-spacing:-.045em;line-height:.95;display:flex;align-items:flex-end;gap:${Math.round(big * 0.1)}px}
  /* Drawn, not typed: a period glyph is square in one face and round in the next.
     It is also the game's own pixel — square is the whole point. */
  .dot{width:${Math.round(big * 0.19)}px;height:${Math.round(big * 0.19)}px;background:#e0a86b;
       margin-bottom:${Math.round(big * 0.045)}px}
  .tag{margin-top:${Math.round(h * 0.055)}px;font-size:${cjk ? 25 : 26}px;font-weight:400;color:#b6a894;letter-spacing:${cjk ? '.005em' : '-.011em'}}
  .foot{margin-top:${Math.round(h * 0.075)}px;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:15px;
        color:#7e7365;letter-spacing:.04em}
</style>
<div class="wrap">
  <h1><span>SwarmVille</span><span class="dot"></span></h1>
  <div class="tag">${v.tag}</div>
  <div class="foot">${v.foot}</div>
</div>`
}

fs.mkdirSync(OUT, { recursive: true })
fs.copyFileSync(new URL('artwork.jpg', import.meta.url), `${OUT}/artwork.jpg`)
for (const lang of ['en', 'es', 'zh']) {
  fs.writeFileSync(`${OUT}/banner-${lang}.html`, page(lang, 1200, 400))
}
fs.writeFileSync(`${OUT}/social.html`, page('en', 1280, 640))
console.log('html listo')

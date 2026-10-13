// Last step of `npm run build`: fills each built page in dist/ with its pre-rendered HTML and
// search-engine data, using the Node bundle of src/prerender.tsx in dist-ssr/ (then removed).
import { readFile, rm, writeFile } from 'node:fs/promises'

const ssrDir = new URL('../dist-ssr/', import.meta.url)
const { files, render } = await import(new URL('prerender.js', ssrDir).href)
const EMPTY_ROOT = '<div id="root"></div>'
// Inside <script>, "<" is escaped so text such as "</script>" can't end the tag early.
const toJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

for (const file of files) {
  const path = new URL(`../dist/${file}`, import.meta.url)
  const template = await readFile(path, 'utf8')
  if (!template.includes(EMPTY_ROOT)) throw new Error(`dist/${file} has no empty ${EMPTY_ROOT} to fill`)
  const { html, data } = render(file)
  // Replacer functions, so "$" in the content (prices) is never read as a replacement pattern.
  let page = template.replace(EMPTY_ROOT, () => `<div id="root">${html}</div>`)
  if (data) {
    page = page.replace('</head>', () => `  <script type="application/ld+json">${toJsonLd(data)}</script>\n  </head>`)
  }
  await writeFile(path, page)
  console.log(`pre-rendered dist/${file} (${Math.round(html.length / 1024)} kB)`)
}

await rm(ssrDir, { recursive: true, force: true })

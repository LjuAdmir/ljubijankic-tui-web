# Implementation: Terminal-style Portfolio

Companion to [PROPOSAL.md](PROPOSAL.md). This describes how the site is built. The proposal describes what it does.

## 0. Code principles

These apply to all code in this project.

- **Simple over clever.** No abstraction until there's a second real use for it. No custom tooling where a well-known community package already does the job.
- **Minimal comments.** Names explain the code; comment only a non-obvious *why*. No banner comments, no JSDoc on obvious functions.
- **Vue conventions.** `create-vue` project layout, `<script setup lang="ts">` single-file components, Composition API, Pinia for state, PascalCase multi-word component names, `useX` composables. Follow the official [Vue style guide](https://vuejs.org/style-guide/) (priority A and B rules).
- **Small files.** One command per file, one component per concern, no god-store.

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3 + Vite + TypeScript, scaffolded with `create-vue` (Router, Pinia, Vitest) |
| Prerendering | `vite-ssg` |
| Markdown | `unplugin-vue-markdown` (each `.md` becomes a Vue component and exports its `frontmatter`) |
| CSS | `@webtui/css` + `@webtui/theme-catppuccin` |
| Head/meta | `@unhead/vue` (comes with vite-ssg) |
| Tests | Vitest |
| Lint/format | ESLint (`eslint-plugin-vue`, `@vue/eslint-config-typescript`) + Prettier |
| Hosting | GitHub Pages, custom domain, GitHub Actions deploy |

Exact versions are pinned when the project is scaffolded.

## 2. Project structure

The `create-vue` defaults, plus `content/`, `src/commands/` and `src/lib/`.

```
.github/workflows/
  deploy.yml              # GitHub Pages deploy
content/                  # the virtual filesystem (md + frontmatter, colocated images)
public/                   # favicon, og images
src/
  assets/
    main.css              # WebTUI layer order + imports + theme
  components/
    TerminalView.vue      # scrollback + prompt + bottom bar layout
    OutputLine.vue        # renders one output entry (segments or component)
    PromptLine.vue        # the input line
    PromptBreadcrumb.vue  # clickable cwd
    BottomBar.vue
    FilePager.vue
    ScrollArea.vue        # scroll container with a text scrollbar (pager, scrollback)
    LifeFetch.vue
    HistorySearch.vue     # Ctrl+R overlay
    OutputAnnouncer.vue   # visually hidden live region: the last command's output as text
    CowSay.vue            # cowsay output, bubble fits the screen width
    SlTrain.vue           # sl program: the D51 from sl, text frames every 40ms
    MatrixRain.vue        # matrix program: canvas, theme green, katakana
  composables/
    useKeyboard.ts
    useHistory.ts
    useTheme.ts
  stores/
    terminal.ts           # Pinia: cwd, output, mode, openFile
  router/
    index.ts
  views/
    HomeView.vue          # the only view
  commands/
    index.ts              # registry: list, lookup by name/alias
    ls.ts, cd.ts, cat.ts, help.ts, …
    fun/                  # sudo.ts, cowsay.ts, matrix.ts, …
  lib/                    # plain TS, no Vue, unit-tested
    fs.ts                 # build tree, resolve paths, list
    parse.ts              # split input into command + args
    complete.ts           # tab completion
    fuzzy.ts              # typo distance, Ctrl+R matching
    storage.ts            # safe localStorage get/set
    site.ts               # site name and URL, for meta tags
    cowsay.ts             # speech bubble + cow
    motion.ts             # prefers-reduced-motion check
    sleep.ts              # promise timeout, for paced output and effects
  App.vue
  main.ts
```

## 3. Content and the virtual filesystem

### Authoring

Pages live under `content/`. Their path is their place in the filesystem: `content/articles/hello-world.md` is `~/articles/hello-world.md`.

```md
---
title: Hello World
description: My first article on the new site
date: 2026-10-12
tags: [vue, meta]
image: /og/hello-world.png
hidden: false
---

# Hello World

Text, code, and images: ![screenshot](./hello-world/screenshot.png)
```

| Field | Required | Use |
|---|---|---|
| `description` | yes | `ls` column, link previews. Short and written for non-technical visitors |
| `date` | yes | Date of creation. `ls` column and pager header |
| `title` | no | Browser tab and link previews. Falls back to the file name |
| `image` | no | `og:image`. A file in `public/`, because preview URLs must be absolute |
| `tags` | no | Pager header |
| `hidden` | no | Hide without a dot prefix (drafts) |
| `name` | no | Display name in the filesystem instead of the file name. Paths, `cd`/`cat` and completion all use it |

- **Directories**: date and description come from a frontmatter-only `index.md` inside the directory (`content/projects/index.md`). `index.md` is not listed. If a directory has no `index.md`, the columns show `—`.
- **Other formats**: any non-Markdown file (e.g. `content/.ssh/id_rsa`) is a plain text file. It's shown with its real name, rendered as preformatted text with `https://` links made clickable, and has no metadata.
- **Images**: they live next to the page (e.g. in a folder of the same name) and are referenced relatively. Vite bundles them. Image files are excluded from the filesystem, so image folders never show up in `ls`.
- **Hidden entries**: names starting with `.` (`.secrets.md`, `.ssh/`) are hidden.
- **The `.ssh` joke**: `content/.ssh/id_rsa.md` and `id_rsa.pub.md` set `name: id_rsa` / `name: id_rsa.pub` and both embed `content/.ssh/norton.jpg`, a local copy of the "I got Norton" meme taken from `https://i.kym-cdn.com/photos/images/original/000/012/663/752px-Igotsnorton.jpg`. `known_hosts` is a real plain text file.

### Loading

No custom Vite plugin. Three `import.meta.glob` calls in `lib/fs.ts`:

```ts
const meta = import.meta.glob<Meta>(['/content/**/{*,.*}.md', '/content/.*/**/{*,.*}.md'], {
  eager: true,
  import: 'frontmatter',
})
const pages = import.meta.glob(['/content/**/{*,.*}.md', '/content/.*/**/{*,.*}.md'], {
  query: '?page',
  import: 'default',
})
const texts = import.meta.glob(
  [
    '/content/**/{*,.*}',
    '/content/.*/**/{*,.*}',
    '!/content/**/{*,.*}.{md,png,jpg,jpeg,webp,gif,svg,avif}',
    '!/content/.*/**/{*,.*}.{md,png,jpg,jpeg,webp,gif,svg,avif}',
  ],
  { query: '?raw', import: 'default' },
)
```

- Vite only accepts literal glob arguments, so patterns can't be shared through variables.

- `meta` is bundled upfront and is small: it builds the tree used by `ls`, `tree`, `cd`, and completion.
- `pages` and `texts` are lazy: content is only loaded when a file is opened. `pages` imports with `?page` (also added to the Markdown plugin's `include`), so it is a separate module from the eager `meta` import. Without it, the eager import pulls every page into the main bundle and the lazy chunks are never split off. The keys of `texts` are known upfront, so plain text files still appear in the tree.
- Directory entries are derived from file paths, with metadata from their `index.md`.
- Vite's globs skip dot paths by default, and the production build (Rolldown's native glob) ignores dot patterns like `{*,.*}` that work in dev. The globs use `exhaustive: true` instead, which includes dotfiles and dot directories (`.secrets.md`, `.ssh/`) at any depth in both dev and build. It also includes `node_modules`, which `content/` never has.
- `unplugin-vue-markdown` exports each frontmatter field separately. A `frontmatterPreprocess` hook in `vite.config.ts` also exports them as one `frontmatter` object.
- External links (`http(s)://`) open in a new tab everywhere: a small `markdownSetup` rule in `vite.config.ts` adds `target="_blank" rel="noopener"` to Markdown links, and hand-written links (lifefetch, plain text files) set it themselves. Internal links stay in the same tab.
- Pages link to each other by file path, like images: `[reach out](./contact.md)`. The same rule rewrites the href to the page's URL (with the deploy base), so prerendered HTML and middle-click get a real link; `FilePager` catches a plain click and runs `open` (or `cd` + `ls` for a folder's `index.md`) instead of reloading.
- YAML turns `date` into a `Date`, which arrives as an ISO string.

### `lib/fs.ts` API

```ts
type Entry = DirEntry | FileEntry
buildTree(meta, texts): DirEntry                   // pure, so tests can pass their own tree
resolve(path: string, cwd: string, from = root): Entry | null   // handles ~, $HOME, .., ., absolute/relative
list(dir: DirEntry, opts: { all: boolean }): Entry[]
loadPage(file: FileEntry): Promise<Component | string>   // md component or raw text
files(dir = root): FileEntry[]                     // every file in the tree, for the prerendered routes
urlFor(file: FileEntry): string                    // ~/articles/hello-world.md → /articles/hello-world
fromUrl(path: string): Entry | null
```

`cd -` (previous directory) lives in the store, not in `resolve`.

- `list` order: directories first (A–Z), then files newest first. Files without a date go last (A–Z).
- Dot entries only show with `all`. `hidden: true` entries never show in `list`, but `resolve` still finds them.
- Paths starting with `/` don't resolve. The root is `~`.

## 4. Commands

### Shape

```ts
interface Command {
  name: string
  aliases?: string[]
  summary: string
  usage?: string
  hidden?: boolean
  gag?: boolean                                          // only listed by `help -a`
  complete?: (word: string, cwd: string) => string[]   // Tab candidates, paths by default
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
```

`ctx` gives commands what they need and nothing else:

```ts
interface CommandContext {
  cwd: string
  cd(path: string): void
  print(...lines: Line[]): void
  printComponent(name: OutputComponent, props?: object): void   // lifefetch, themes, cowsay, …
  open(file: FileEntry): void                                  // pager
  startProgram(name: Program): void                            // full-screen programs: sl, matrix
  clear(): void
  effect(name: Effect): Promise<void>                          // short screen effects: 'glitch' (rm -rf), 'party' (Konami)
  disconnect(): void                                           // exit: hides the prompt until the next command
}
```

### Output

Commands never touch the DOM. They print **lines made of segments**, and `OutputLine.vue` renders them:

```ts
type Style = 'dir' | 'file' | 'error' | 'muted' | 'accent'
type Segment =
  | { text: string; style?: Style; hang?: boolean; decorative?: boolean }   // hang: wrapped lines continue under it; decorative: aria-hidden (tree lines)
  | { text: string; command: string | string[]; style?: Style }   // clickable, runs the command(s) in order
  | { text: string; href: string }      // real link (files)
  | { text: string; fill: string; style?: Style }    // clickable, puts the text in the prompt (Tab candidates)
type Line = Segment[]
```

`hang` marks where wrapped lines continue: `OutputLine` sums the text before it and sets `padding-left` plus a negative `text-indent` of that many `ch`, so `ls`, `tree` and `help` descriptions wrap inside their column. Output wraps at spaces (`word-break: normal; overflow-wrap: anywhere`), overriding WebTUI's `break-all`. On touch screens (`pointer: coarse`), a line with exactly one link or command stretches it over the whole line with an `::after`; lines with several stay as they are, so no target covers another.

So `ls` returns file names as `href` segments (real links, see §7) and directories as `command` segments (`cd projects`).

### Registry

`commands/index.ts` imports each command file and exports `findCommand(name)`, `allCommands()` and `suggestCommand(name)`. Unknown names get a "did you mean" suggestion: the closest visible command name or alias by edit distance (`fuzzy.ts`), main names winning ties over aliases (`lss` → `ls`, not `less`), then alphabetical. Hidden commands and gags are never suggested or completed. The suggestion keeps the typed arguments and is clickable: `lss -a` → "Did you mean `ls -a`?".

Aliases: `cat`/`open`/`less` are one command; `neofetch` is an alias of `lifefetch`.

### LifeFetch

- Static values (name, location, hardware, …) are a plain object in `LifeFetch.vue`. Agiledrop is a link to `https://agiledrop.com`.
- The logo uses no box drawing or block glyphs, because Android's only monospace font (Droid Sans Mono) has neither: the frame is a CSS border and the letters are runs of spaces with a solid background, so any monospace font lines it up. The colour swatches are plain `3ch` boxes.
- Uptime = full years since `1997-03-03`, with 🎂 appended on 3 March. It's computed in `onMounted`, so the prerendered HTML (built on a different day) doesn't cause a hydration mismatch.
- `lifefetch`, `cd`, `cd ~` and `cd $HOME` all share one `goHome(ctx)` in `commands/lifefetch.ts`: `clear()`, set `cwd` to `~`, then `printComponent('lifefetch')`. Typed commands stay in history even though the screen is cleared. Paths that merely resolve to home (`cd ..`, `cd ~/`) are a plain `cd`.
- Components go into the output by name (`OutputComponent`), and `OutputLine` maps the name to the component. That keeps the scrollback serialisable for the prerendered state handover.
- First visit: `HomeView` runs `lifefetch` before anything else when the scrollback is empty, so a deep link shows lifefetch, then the `cd`/`open` lines behind the pager. Prerendered pages already contain it in their state.
- Logo: big framed "AL" block letters, A in mauve, L in blue, frame muted; keys in mauve; colour row red, peach, yellow, green, teal, blue, mauve, pink. Below 48rem the logo stacks above the info. The `help` in the tip is clickable.

## 5. State and input

### Store (`stores/terminal.ts`)

```ts
cwd: string
previousCwd: string
output: OutputEntry[]                       // scrollback
mode: 'shell' | 'pager' | 'program'
openFile: FileEntry | null                  // set by open(file), cleared by closeFile()
program: Program | null                     // 'sl' | 'matrix', by name like output components
input: string                               // the prompt's text, so output lines can fill it
execute(input: string): Promise<void>       // parse → echo prompt+input → find → run
echo(input: string): void                   // a prompt line without running anything
```

Clicking anything calls `execute(command)`. That way typed and clicked commands go through the same path and both show up in the scrollback.

### Keyboard (`composables/useKeyboard.ts`)

One `keydown` listener on `window`, switching on `store.mode`:

- `shell`: printable keys focus the prompt input (desktop only). `Ctrl+R` (history search), `Ctrl+L` (clear the screen, the typed line stays) and `Ctrl+C` work wherever focus is, so the browser never reloads or jumps to the address bar. `Ctrl+C` echoes the line with `^C` and clears the prompt (or closes the history search), except when text is selected, so copying still works. `↑`/`↓`, `Tab` and `Ctrl+A`/`Ctrl+E`/`Ctrl+U` (start, end, clear line) are handled on the input itself in `PromptLine`, since they only matter while typing; elsewhere `Ctrl+A` still selects the page and `Ctrl+U` still shows the source.
- `pager`: `q`/`Esc` close, `j`/`k`/`↑`/`↓` one line, `Space`/`PgDn`/`PgUp` one page (minus a line), `g`/`G`/`Home`/`End` top and bottom, `s` share. Scrolling is instant. Keys are ignored with Ctrl/Alt/Meta held, and `Space`/`Enter` on a focused button or link keep their normal behaviour. `FilePager` exposes its scroll container and `TerminalView` passes it to `useKeyboard`. The key hints on the pager's bottom border are hidden on touch devices. The pager body is a normal scroll container (`overflow-y: auto`) and the keys just call `scrollBy`/`scrollTo` on it. Mouse wheel, trackpad and touch therefore work natively; nothing intercepts `wheel` or touch events.

**Scrollbars.** `ScrollArea.vue` wraps the pager body and the scrollback. It hides the native scrollbar and draws a text one instead: a `│` track and a `█` thumb one column wide, sized to the visible part in whole lines, and shown only when the content overflows. The thumb can be dragged, and clicking the track jumps there. Sizes come from the `scroll` event and a `ResizeObserver` on the viewport and its content (images loading, new output). In the pager the track sits on the box's right border, and the bottom border shows the scroll percentage.
- Konami code (`↑↑↓↓←→←→BA`): tracked on every key in every mode, also while typing (the arrows still walk history on the way). On the final `A` it isn't typed, the prompt is cleared, an accent line "Konami code accepted. +30 lives." is printed and the terminal plays the `party` effect: colours cycle through the rainbow (`hue-rotate`) three times in 3s. With reduce motion on, only the line.
- `program`: any key (except a lone modifier) or `Ctrl+C` stops it, and so does a click or tap on it. Any command (from the bottom bar) stops it too. The program takes the scrollback's place, the prompt is hidden, the bottom bar stays; the prompt gets focus back on desktop when it ends. `sl` ends by itself once the train has left. With reduce motion on, `sl` and `matrix` print a line instead (`lib/motion.ts`, also used by the `rm -rf` log).

The prompt is a real `<input>` styled to look like a terminal line. That keeps IME, paste, mobile keyboards and screen readers working.

Touch devices (`matchMedia('(pointer: coarse)')`) never auto-focus the input.

If interactive input is ever needed, it's another `mode`.

### History (`composables/useHistory.ts`)

- Only typed commands are recorded (`PromptLine` adds them on submit); clicks and URL routing aren't.
- Array capped at 50, newest last, trimmed, no empty entries or consecutive duplicates. The list is module-level state, shared by the prompt and the `history` command; the `↑`/`↓` position is per caller.
- Saved to `localStorage` key `tui.history` through `lib/storage.ts`, which wraps every access in `try/catch` so private mode or blocked storage doesn't break the site, and skips storage while prerendering.
- `↑`/`↓` are a prefix search (zsh/fish style): the text typed before the first `↑` filters the entries, each command shows once (its newest use), and `↓` past the newest entry restores the typed text. Typing or submitting starts over.
- `history` prints a numbered list (bash style), each entry clickable to run it again. `history -c` clears memory and storage.
- `Ctrl+R` opens `HistorySearch.vue`, an fzf-style box above the prompt (owned by `PromptLine`). `useKeyboard` catches `Ctrl+R` in shell mode wherever focus is, so the browser never reloads. The search starts with what's in the prompt and ranks each command once with `fuzzy.match`, equal scores newest first. Up to 8 results, best at the bottom next to the `search:` line, matched letters in mauve, `x/y` count on the top border. `↑`/`Ctrl+R` move to older/worse results, `↓` back. `Enter` (or a click) puts the selection in the prompt to edit or run; `Esc` or clicking away closes it and leaves the prompt as it was.

### Completion (`lib/complete.ts`)

- `lib/complete.ts` has the pure parts: `matching` (options starting with the word), `paths` (directories get a trailing `/`, dotfiles only once the name starts with `.`, drafts never) and `commonPrefix`. `completeInput` in `commands/index.ts` decides what to complete.
- First word: command names and aliases (excluding hidden).
- Later words: the command's own `complete()` if it has one, otherwise paths. `cd` and `tree` complete directories only, `help` completes command names.
- `Tab` is handled on the prompt input in `PromptLine`. An empty prompt leaves `Tab` alone, so keyboard users can still move focus through the page.
- One match: fill it in, with a trailing space for files and commands. Several (zsh style): the first `Tab` fills the common prefix, echoes the prompt line and prints the candidates in one row (last path part only, directories coloured); further `Tab`s cycle through them in the prompt. Typing anything starts over. Clicking a candidate fills the prompt with it.

### Fuzzy (`lib/fuzzy.ts`)

Two small functions, no dependency:

- `distance` / `closest` for "did you mean": edit distance where swapping two neighbouring letters counts as one edit (`claer` → `clear`). A suggestion has to be within one edit for words up to four letters, two for longer ones.
- `match` for `Ctrl+R`: the query's letters in order, ignoring case, returning a score and the matched positions (for highlighting). Each letter scores 1, plus 3 when it follows the previous match and 2 at a word start (after a space, `/`, `.`, `_`, `-`). It tries every occurrence of the first letter, so `proj` lands on `projects`, not the `p` in `open`.

## 6. Theming

- `src/assets/main.css`:

  ```css
  @layer base, utils, components;
  @import '@webtui/css/base.css';
  @import '@webtui/css/utils/box.css';
  @import '@webtui/css/components/button.css';
  /* …only the components actually used… */
  @import '@webtui/theme-catppuccin';
  ```

  The theme must be imported after all other WebTUI CSS.
- `useTheme.ts` sets `data-webtui-theme` on `<html>` (`catppuccin-mocha` default for everyone, plus `-macchiato`, `-frappe`, `-latte`) and stores the choice in `tui.theme`. An unknown stored value falls back to mocha.
- `main.css` overrides latte's `--foreground2` with `--subtext1`: catppuccin's `overlay2` is 3.5:1 on latte's base, under WCAG AA's 4.5:1. The other flavours pass as they are.
- `main.css` replaces WebTUI's plain `monospace` with a stack of system fonts that have box drawing glyphs (SF Mono/Menlo, Cascadia Mono/Consolas, DejaVu Sans Mono, Noto Sans Mono, then Liberation Mono, which lacks `╭╮╰╯`), with `monospace` last. iOS maps plain `monospace` to Courier, which has none of them. No webfont is shipped.
- A tiny inline script in `index.html` applies the stored theme before the first paint, so the page never flashes the wrong theme. It repeats the theme list, since it can't import from `src/`.
- `theme` prints `ThemeList.vue`: each theme (full name, clickable, runs `theme <name>`), the current one marked `*`, and a swatch of that theme's own colours. The swatch carries `data-webtui-theme` itself, so the theme's variables apply inside it without switching the page. The list gets the current theme as a prop, so older lists in the scrollback keep their marker. `theme <name>` switches and confirms with `theme: <name>`; Tab completes the names. The bottom bar's `theme` button (right, before ©) runs `theme` for visitors who don't type: it closes the pager but, unlike the page buttons, keeps the scrollback.
- Components in the scrollback can take props (`printComponent(name, props)`), stored with the output entry as plain data.

## 7. Routing, prerendering and sharing

### Routes

```ts
routes: [
  { path: '/', component: HomeView },
  ...pages.map((file) => ({ path: urlFor(file), component: HomeView })),
  { path: '/:path(.*)*', component: HomeView },
]
```

`pages` is every non-hidden Markdown file from `fs.files()`, dotfiles included. vite-ssg creates the router (web history in the browser, memory history while prerendering), so `router/index.ts` only exports `routes`.

`HomeView` watches the route:

- `/`: no file open.
- Matches a file (`fs.fromUrl`): run `cd <file's dir>` (skipped if already there) and `open <file>`, so the scrollback shows how you got there.
- Matches a directory: run `cd <dir>` and `ls`, replace the URL with `/`.
- Anything else: print `open: /foo: no such file` and replace the URL with `/`.

Opening a file pushes its URL. Closing the pager goes back in history when the previous entry is `/`, otherwise it pushes `/`. Back/forward work through the same watcher.

File entries in `ls`/`tree` output and the bottom bar's `about me`/`contact` are real `<a href>` links. A plain click runs the command; ctrl/middle-click opens the URL in a new tab.

### Prerendering

- vite-ssg prerenders every static route: `/` plus one per file in `pages`. `includedRoutes` can't be used for this, because it runs in `vite.config.ts` where `import.meta.glob` isn't available.
- Each prerendered page renders the terminal with that file already open in the pager, so crawlers see the real content. `HomeView` returns the watcher's `execute` promise from `onServerPrefetch`, and `FilePager` awaits its page inside `<Suspense>`, so both finish before the HTML is written.
- The Pinia state is serialised into the page (`initialState.pinia`), so the client hydrates from exactly what was rendered. Output ids are derived from the last entry instead of a counter for the same reason.
- Meta tags use `@unhead/vue` (`useSeoMeta` + a canonical `link`). `App.vue` sets the home defaults: title = site name, a placeholder description, `og:*`, `twitter:card` and canonical `https://ljubijankic.si/`. `FilePager.vue` overrides them while a file is open: title `<title> · Admir Ljubijankić` (also `og:title`), `description`, `og:type` article, `og:url` and canonical from `urlFor`, `og:image` from `image` (with `twitter:card` `summary_large_image`). Closing the pager drops the overrides. Absolute URLs come from `siteUrl` in `lib/site.ts`.
- Output style: flat (`articles/hello-world.html`). GitHub Pages serves it at `/articles/hello-world` without a trailing-slash redirect.

### 404 and directory URLs

GitHub Pages serves `404.html` for any path without a file, including directory URLs like `/articles`. After build, `index.html` is copied to `dist/404.html`. Those paths boot the app, and the route watcher either `cd`s into the directory or prints the "no such file" error.

### `share`

`lib/share.ts` takes `location.origin + urlFor(file)`. On touch devices with the Web Share API it opens the native share sheet (closing the sheet counts as done); everywhere else it uses `navigator.clipboard.writeText`.

- `share <file>` prints `copied: <url>`, or just the URL as a link if copying fails. A bare `share` prints its usage, and directories give "is a directory".
- In the pager, `[share]` and `s` share the open file without touching the scrollback. The button reads `[copied]` (or `[copy failed]`) for 2 seconds.

## 8. Testing

Vitest, on `src/lib/`, `useHistory`, `useTheme`, the command registry and `date` formatting:

- `share.ts`: clipboard on desktop, share sheet on touch, cancelled sheet, blocked clipboard.
- `fs.ts`: `resolve` with `~`, `$HOME`, `..` past root, `.`, trailing slashes, relative vs absolute, hidden entries, files vs dirs, `index.md` not listed, plain text files present, `name` override resolves by display name; `urlFor` / `fromUrl` round trip.
- `parse.ts`: whitespace, quoted args, flags.
- `complete.ts`: matching, paths (nested, `~/`, `..`, dotfiles only after `.`, drafts, directories only), common prefix.
- `commands/index.ts`: `completeInput` for command names, paths, and commands' own completion.
- `cowsay.ts`: one-line and multi-line bubbles, narrower widths, words longer than the bubble.
- `commands/date.ts`: `formatDate` matches GNU date's default format (space-padded day, zero-padded time).
- `fuzzy.ts`: edit distance (including swaps), `closest` thresholds and ties; `match` positions, empty query, runs and word starts ranking.
- `commands/index.ts`: `suggestCommand` prefers names over aliases, skips unrelated input, never suggests gags.
- `storage.ts`: JSON round trip, missing key, invalid JSON, blocked storage.
- `useHistory`: cap of 50, de-duplication, persistence and loading, clear, prefix walk with draft restore, each command once.
- `useTheme`: mocha default, apply and save, unknown saved theme ignored.

No component tests in v1; UI is checked by hand in the browser.

## 9. Build and deploy

- `npm run build` type-checks, runs `vite-ssg build`, then copies `index.html` → `404.html`.
- `.github/workflows/deploy.yml`: checkout → setup node 24 → `configure-pages` → `npm ci` → oxlint and ESLint (no `--fix`) → `vitest run` → build → `upload-pages-artifact` → `deploy-pages`. It runs on every push to `main`, and by hand from the Actions tab.
- `upload-pages-artifact` skips dotfiles unless `include-hidden-files: true`, which is needed for dotfile pages like `.secrets.html`.
- **Base path.** Until the domain moves, GitHub serves the site at `<user>.github.io/<repo>/`. The workflow passes `configure-pages`' `base_path` as `BASE_PATH`, which becomes Vite's `base` and the router's base. Routes and `urlFor` never include it; `withBase` in `lib/site.ts` adds it for real `href`s and shared links. With the custom domain `base_path` is empty and everything sits at `/`. Meta tags always use `https://ljubijankic.si`.
- **One-time setup on GitHub:** Settings → Pages → Source: "GitHub Actions". At the switch-over: remove `ljubijankic.si` from the old site's Pages settings, add it here under Settings → Pages → Custom domain, and tick "Enforce HTTPS". No `CNAME` file is needed, because GitHub ignores it for Actions deploys.

## 10. Milestones

Each milestone ends with something runnable. Each milestone is split into small steps, and each step is one reviewable change.

### Workflow

- We work one step at a time. Claude implements the step, runs type-check, lint and tests (once they exist), then stops and summarises what changed.
- Admir reviews the diff and commits it. Claude never stages, commits or pushes.
- Admir says "next" to continue, or asks for changes first. A ticked box means the step has been reviewed and committed.
- Package manager: npm. Default branch: `main`. The repo is local first and gets pushed to a new GitHub repo later.

### 0. Repository

- [x] **0.1** `git init -b main` and a `.gitignore`. The first commit holds the docs.

### 1. Shell layout

- [x] **1.1** Scaffold with `create-vue` (TS, Router, Pinia, Vitest, ESLint + Prettier). Remove the demo content (HelloWorld, AboutView, icons, demo store).
- [x] **1.2** Install `@webtui/css` and `@webtui/theme-catppuccin`, set up `main.css` with the layer order, and put `data-webtui-theme="catppuccin-mocha"` on `<html>`.
- [x] **1.3** `lib/parse.ts` with tests.
- [x] **1.4** Terminal store skeleton (`cwd`, `output`, `mode`, `execute`), the command registry, and "command not found".
- [x] **1.5** `TerminalView`, `OutputLine`, `PromptLine` and a static `BottomBar`: scrollback on top, prompt pinned at the bottom, Enter runs the input. On desktop, typing focuses the prompt; touch devices don't auto-focus.
- [x] **1.6** `echo`, `clear`, `help` (with clickable command names).

### 2. Filesystem

- [x] **2.1** `unplugin-vue-markdown` setup plus sample content (`about.md`, `contact.md`, `projects/` and `articles/` with `index.md` and one file each). Check that the globs pick up dot paths.
- [x] **2.2** `lib/fs.ts`: tree building, `resolve`, `list`, `name` override, plain text files, with tests.
- [x] **2.3** `cd` (including `cd -` via `previousCwd`) and `pwd`. The prompt shows the cwd.
- [x] **2.4** `ls` and `ls -a`, always detailed, with clickable directories.
- [x] **2.5** `tree`.
- [x] **2.6** `PromptBreadcrumb` with clickable path segments.

### 3. Pager

- [x] **3.1** `fs.loadPage`, plus `openFile` and the `pager` mode in the store; `cat`/`open`/`less` with the "is a directory" error.
- [x] **3.2** `FilePager`: header (path, date, tags), rendered Markdown with images, plain text with clickable links, and a `[close]` button.
- [x] **3.3** Pager keys in `useKeyboard` (`q`/`Esc`, `j`/`k`, `g`/`G`, `Space`, `PgUp`/`PgDn`) on a native scroll container.
- [x] **3.4** Files in `ls` output are clickable. The bottom bar is wired up (`home` runs `cd ~` then `ls` until 5.1). Bottom bar clicks close the pager and silently clear the screen first, so visitors only see the result of what they clicked.

### 4. URLs

- [x] **4.1** Routes and the `HomeView` watcher (file, directory, unknown). Opening a file pushes its URL and closing the pager goes back (or pushes `/`). Files in `ls` and the bar's `about me`/`contact` become real `href` links.
- [x] **4.2** Switch to vite-ssg: `main.ts` uses `ViteSSG`, a route per Markdown file, Pinia state handover, flat output, and the build copies `index.html` → `404.html`.
- [x] **4.3** Meta tags: home defaults in `App.vue`, per-file title, description, `og:*`, `twitter:card` and canonical in `FilePager`.
- [x] **4.4** The `share` command, the `s` key and the `[share]` button.
- [x] **4.5** The GitHub Actions Pages workflow (manual trigger for now) and base path support for the github.io preview.
  Domain: `ljubijankic.si`, which currently points at the old site. Switch it over once this site is ready.

### 5. Terminal comfort

- [x] **5.1** `LifeFetch` and the `lifefetch`/`neofetch` command. `goHome` is shared by `cd`, `cd ~` and `cd $HOME`, and runs on first visit.
  - Every click that leads home (breadcrumb `~`, `ls`/`tree` entries pointing at `~`, bottom bar `home`) runs just `cd ~`, which clears the screen and shows lifefetch. Until then they run `cd ~` then `ls`.
- [x] **5.2** `lib/storage.ts` and `useHistory` (cap 50, no consecutive duplicates) with tests; `↑`/`↓` and the `history` command.
- [x] **5.3** `lib/fuzzy.ts` with tests; "did you mean" for unknown commands.
- [x] **5.4** `HistorySearch` (`Ctrl+R`).
- [x] **5.5** `lib/complete.ts` with tests, wired to `Tab`.
- [x] **5.6** Shortcuts: `Ctrl+L`, `Ctrl+C`, `Ctrl+U`, `Ctrl+A`, `Ctrl+E`.
- [x] **5.7** `useTheme`, the `theme` command, and the inline no-flash script in `index.html`.
- [x] **5.8** `whoami` and `date`.

### 6. Fun and polish

- [x] **6.1** Gags: `sudo`, `rm -rf /`, `exit`, `vim`/`emacs`.
- [x] **6.2** Toys: `cowsay`, `fortune`.
- [x] **6.3** Programs: `program` mode, `sl` and `matrix` (any key or `Ctrl+C` stops them; reduced motion respected).
- [x] **6.4** Hidden commands (`hello`/`hi`, `ping`, `hack`) and the Konami code (party mode).
- [x] **6.5** `.secrets.md` (an easter egg checklist with hints) and `.ssh/` (`norton.jpg`, `id_rsa`, `id_rsa.pub`, `known_hosts` as a commented list of friends' sites). The `rm -rf /` log lists them too.
- [x] **6.6** Mobile click-first pass: wrapping at spaces, hanging indents for column output, two-row bottom bar without ©, full-width tap targets on touch, `interactive-widget=resizes-content`.
- [x] **6.7** Accessibility pass: `OutputAnnouncer` reads each command's output (not the echoed prompt), pager focus in and back out, directories and bottom-bar pages as real links, `main` landmark, link focus outline, darker muted text in latte, tree lines hidden and cowsay described for screen readers.

## 11. Command → file map

| Proposal command | File | Milestone |
|---|---|---|
| `echo`, `clear`, `help` | `commands/echo.ts`, `clear.ts`, `help.ts` | 1 |
| `ls`, `cd`, `pwd`, `tree` | `commands/ls.ts`, `cd.ts`, `pwd.ts`, `tree.ts` | 2 |
| `cat` / `open` / `less` | `commands/cat.ts` | 3 |
| `share` | `commands/share.ts` | 4 |
| `lifefetch` / `neofetch` | `commands/lifefetch.ts` | 5 |
| `history`, `theme` | `commands/history.ts`, `theme.ts` | 5 |
| `whoami`, `date` | `commands/whoami.ts`, `date.ts` | 5 |
| Fun commands | `commands/fun/*.ts` | 6 |
| `.secrets.md`, `.ssh/` | `content/` (no code, just files) | 6 |

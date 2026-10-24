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
content/                  # the virtual filesystem (md + frontmatter, colocated images)
public/
  CNAME
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
    fuzzy.ts              # Ctrl+R matching
    storage.ts            # safe localStorage get/set
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
- Vite's globs skip dot paths by default. `{*,.*}` adds dotfiles, and the `/content/.*/**` patterns add top-level dot directories like `.ssh/`. Negations need the same forms. Dot directories nested deeper (`projects/.drafts/`) are not picked up.
- `unplugin-vue-markdown` exports each frontmatter field separately. A `frontmatterPreprocess` hook in `vite.config.ts` also exports them as one `frontmatter` object.
- YAML turns `date` into a `Date`, which arrives as an ISO string.

### `lib/fs.ts` API

```ts
type Entry = DirEntry | FileEntry
buildTree(meta, texts): DirEntry                   // pure, so tests can pass their own tree
resolve(path: string, cwd: string, from = root): Entry | null   // handles ~, $HOME, .., ., absolute/relative
list(dir: DirEntry, opts: { all: boolean }): Entry[]
loadPage(file: FileEntry): Promise<Component | string>   // md component or raw text
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
  complete?: (args: string[], ctx: CommandContext) => string[]
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
```

`ctx` gives commands what they need and nothing else:

```ts
interface CommandContext {
  cwd: string
  cd(path: string): void
  print(...lines: Line[]): void
  printComponent(component: Component, props?: object): void   // lifefetch, cowsay, …
  open(file: FileEntry): void                                  // pager
  run(component: Component): void                              // full-screen programs: matrix, sl
  clear(): void
}
```

### Output

Commands never touch the DOM. They print **lines made of segments**, and `OutputLine.vue` renders them:

```ts
type Style = 'dir' | 'file' | 'error' | 'muted' | 'accent'
type Segment =
  | { text: string; style?: Style }
  | { text: string; command: string | string[]; style?: Style }   // clickable, runs the command(s) in order
  | { text: string; href: string }      // real link (files)
type Line = Segment[]
```

So `ls` returns file names as `href` segments (real links, see §7) and directories as `command` segments (`cd projects`).

### Registry

`commands/index.ts` imports each command file and exports `findCommand(name)` and `allCommands()`. Unknown names get a "did you mean" suggestion from the closest match by `fuzzy.ts`.

Aliases: `cat`/`open`/`less` are one command; `neofetch` is an alias of `lifefetch`.

### LifeFetch

- Static values (name, location, hardware, …) are a plain object in `LifeFetch.vue`. Agiledrop is a link to `https://agiledrop.com`.
- Uptime = full years since `1997-03-03`, with 🎂 appended on 3 March. It's computed in `onMounted`, so the prerendered HTML (built on a different day) doesn't cause a hydration mismatch.
- `lifefetch`, `cd`, `cd ~` and `cd $HOME` all share one `goHome(ctx)`: `clear()`, set `cwd` to `~`, then `printComponent(LifeFetch)`. Typed commands stay in history even though the screen is cleared.

## 5. State and input

### Store (`stores/terminal.ts`)

```ts
cwd: string
previousCwd: string
output: OutputEntry[]                       // scrollback
mode: 'shell' | 'pager' | 'program'
openFile: FileEntry | null                  // set by open(file), cleared by closeFile()
program: Component | null
execute(input: string): Promise<void>       // parse → echo prompt+input → find → run
```

Clicking anything calls `execute(command)`. That way typed and clicked commands go through the same path and both show up in the scrollback.

### Keyboard (`composables/useKeyboard.ts`)

One `keydown` listener on `window`, switching on `store.mode`:

- `shell`: printable keys focus the prompt input (desktop only); handles `Tab`, `↑`/`↓`, `Ctrl+R/L/C/U/A/E`.
- `pager`: `q`/`Esc` close, `j`/`k`/`↑`/`↓` one line, `Space`/`PgDn`/`PgUp` one page (minus a line), `g`/`G`/`Home`/`End` top and bottom, and later `s` (share). Scrolling is instant. Keys are ignored with Ctrl/Alt/Meta held, and `Space`/`Enter` on a focused button or link keep their normal behaviour. `FilePager` exposes its scroll container and `TerminalView` passes it to `useKeyboard`. The key hints on the pager's bottom border are hidden on touch devices. The pager body is a normal scroll container (`overflow-y: auto`) and the keys just call `scrollBy`/`scrollTo` on it. Mouse wheel, trackpad and touch therefore work natively; nothing intercepts `wheel` or touch events.

**Scrollbars.** `ScrollArea.vue` wraps the pager body and the scrollback. It hides the native scrollbar and draws a text one instead: a `│` track and a `█` thumb one column wide, sized to the visible part in whole lines, and shown only when the content overflows. The thumb can be dragged, and clicking the track jumps there. Sizes come from the `scroll` event and a `ResizeObserver` on the viewport and its content (images loading, new output). In the pager the track sits on the box's right border, and the bottom border shows the scroll percentage.
- `program`: any key / `Ctrl+C` stops it.

The prompt is a real `<input>` styled to look like a terminal line. That keeps IME, paste, mobile keyboards and screen readers working. `Ctrl+C` is only taken over when no text is selected.

Touch devices (`matchMedia('(pointer: coarse)')`) never auto-focus the input.

If interactive input is ever needed, it's another `mode`.

### History (`composables/useHistory.ts`)

- Array capped at 50, newest last, no consecutive duplicates.
- Saved to `localStorage` key `tui.history` through `lib/storage.ts`, which wraps every access in `try/catch` so private mode or blocked storage doesn't break the site.
- `↑`/`↓` walk an index. `Ctrl+R` opens `HistorySearch.vue`, which ranks entries with `fuzzy.ts`.

### Completion (`lib/complete.ts`)

- First word: complete against command names and aliases (excluding hidden).
- Later words: the command's own `complete()` if it has one, otherwise path completion against `fs.ts` (directories get a trailing `/`).
- One match: fill it in. Several: fill the common prefix and print the candidates.

### Fuzzy (`lib/fuzzy.ts`)

A small subsequence matcher with a simple score (consecutive and word-start matches rank higher). It's used by `Ctrl+R` and "did you mean". It's small enough that a dependency isn't worth it.

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
- `useTheme.ts` sets `data-webtui-theme` on `<html>` (`catppuccin-mocha` default, plus `-macchiato`, `-frappe`, `-latte`) and stores the choice in `tui.theme`.
- A tiny inline script in `index.html` applies the stored theme before the app mounts, so the page never flashes the wrong theme.

## 7. Routing, prerendering and sharing

### Routes

```ts
routes: [
  { path: '/', component: HomeView },
  { path: '/:path(.*)*', component: HomeView },
]
```

`createWebHistory` (no hash), which vite-ssg needs.

`HomeView` watches the route:

- `/`: no file open.
- Matches a file (`fs.fromUrl`): run `cd <file's dir>` (skipped if already there) and `open <file>`, so the scrollback shows how you got there.
- Matches a directory: run `cd <dir>` and `ls`, replace the URL with `/`.
- Anything else: print `open: /foo: no such file` and replace the URL with `/`.

Opening a file pushes its URL. Closing the pager goes back in history when the previous entry is `/`, otherwise it pushes `/`. Back/forward work through the same watcher.

File entries in `ls`/`tree` output and the bottom bar's `about me`/`contact` are real `<a href>` links. A plain click runs the command; ctrl/middle-click opens the URL in a new tab.

### Prerendering

- `vite-ssg`'s `includedRoutes` returns `/` plus `urlFor(file)` for every non-hidden Markdown file.
- Each prerendered page renders the terminal with that file already open in the pager, so crawlers see the real content.
- `FilePager.vue` calls `useHead` with the file's `title`, `description` and `og:image`.
- Output style: flat (`articles/hello-world.html`). GitHub Pages serves it at `/articles/hello-world` without a trailing-slash redirect.

### 404 and directory URLs

GitHub Pages serves `404.html` for any path without a file, including directory URLs like `/articles`. After build, `index.html` is copied to `dist/404.html`. Those paths boot the app, and the route watcher either `cd`s into the directory or prints the "no such file" error.

### `share`

`navigator.clipboard.writeText(location.origin + urlFor(file))`, then print `copied: <url>`. If the clipboard API fails, just print the URL as a clickable link.

## 8. Testing

Vitest, on `src/lib/` only:

- `fs.ts`: `resolve` with `~`, `$HOME`, `..` past root, `.`, trailing slashes, relative vs absolute, hidden entries, files vs dirs, `index.md` not listed, plain text files present, `name` override resolves by display name; `urlFor` / `fromUrl` round trip.
- `parse.ts`: whitespace, quoted args, flags.
- `complete.ts`: single match, common prefix, no match, directories get `/`.
- `fuzzy.ts`: ranking order for typical queries.
- History cap of 50 and de-duplication.

No component tests in v1; UI is checked by hand in the browser.

## 9. Build and deploy

- `npm run test`, then `npm run build` (`vite-ssg build`, then copy `index.html` → `404.html`).
- `public/CNAME` contains the custom domain.
- GitHub Actions workflow on push to `main`: checkout → setup node → install → test → build → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- Pages source set to "GitHub Actions" in the repo settings.

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

- [ ] **4.1** Routes and the `HomeView` watcher (file, directory, unknown). Opening a file pushes its URL and closing the pager goes back (or pushes `/`). Files in `ls` and the bar's `about me`/`contact` become real `href` links.
- [ ] **4.2** Switch to vite-ssg: `main.ts` uses `ViteSSG`, `includedRoutes`, flat output, and the build copies `index.html` → `404.html`.
- [ ] **4.3** `useHead` in `FilePager` (title, description, `og:image`).
- [ ] **4.4** The `share` command, the `s` key and the `[share]` button.
- [ ] **4.5** `public/CNAME` and the GitHub Actions Pages workflow.
  > **Decision needed:** the custom domain.

### 5. Terminal comfort

- [ ] **5.1** `LifeFetch` and the `lifefetch`/`neofetch` command. `goHome` is shared by `cd`, `cd ~` and `cd $HOME`, and runs on first visit.
  - Every click that leads home (breadcrumb `~`, `ls`/`tree` entries pointing at `~`, bottom bar `home`) runs just `cd ~`, which clears the screen and shows lifefetch. Until then they run `cd ~` then `ls`.
- [ ] **5.2** `lib/storage.ts` and `useHistory` (cap 50, no consecutive duplicates) with tests; `↑`/`↓` and the `history` command.
- [ ] **5.3** `lib/fuzzy.ts` with tests; "did you mean" for unknown commands.
- [ ] **5.4** `HistorySearch` (`Ctrl+R`).
- [ ] **5.5** `lib/complete.ts` with tests, wired to `Tab`.
- [ ] **5.6** Shortcuts: `Ctrl+L`, `Ctrl+C`, `Ctrl+U`, `Ctrl+A`, `Ctrl+E`.
- [ ] **5.7** `useTheme`, the `theme` command, and the inline no-flash script in `index.html`.
- [ ] **5.8** `whoami` and `date`.

### 6. Fun and polish

- [ ] **6.1** Gags: `sudo`, `rm -rf /`, `exit`, `vim`/`emacs`.
- [ ] **6.2** Toys: `cowsay`, `fortune`.
- [ ] **6.3** Programs: `program` mode, `sl` and `matrix` (any key or `Ctrl+C` stops them; reduced motion respected).
- [ ] **6.4** Hidden commands and the Konami code.
  > **Decision needed:** which hidden commands, and what the Konami code does.
- [ ] **6.5** `.secrets.md` and `.ssh/` (`norton.jpg`, `id_rsa`, `id_rsa.pub`, `known_hosts`).
  > **Decision needed:** the contents of `.secrets.md` and the friends' links for `known_hosts`.
- [ ] **6.6** Mobile click-first pass.
- [ ] **6.7** Accessibility pass (`aria-live`, focus handling, real links, reduced motion).

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

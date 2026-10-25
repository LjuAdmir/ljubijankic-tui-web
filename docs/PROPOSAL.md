# Proposal: Terminal-style Portfolio

## 1. Overview

A personal portfolio website that looks and behaves like a terminal. Visitors interact by typing commands at a prompt pinned to the bottom of the screen, and can browse "directories" and open "files" that are the site's pages (about, projects, articles).

Because not every visitor is comfortable with a terminal, everything important can also be done by clicking. Clicking runs the matching command and shows it in the output, so mouse users learn the commands as they go.

### Goals

- Feels like a real terminal: prompt at the bottom, keyboard taken over by the page, tab completion, history.
- Fully usable without typing (click fallback) and on mobile.
- Every content page has a real, shareable URL that search engines and link previews can read.
- Room for fun: small toy commands, gags and easter eggs.

### Non-goals (v1)

- Real shell semantics: no pipes, redirects, scripting, or environment variables beyond `$HOME`.
- Mini games.
- Commands that ask the user for input (interactive prompts).
- A CMS. Content is Markdown files in the repo.

## 2. Screen layout

The screen has three fixed regions:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  (scrollback: output of previous commands, scrolls)                  │
│                                                                      │
│  visitor@ljubijankic ~ > ls                                          │
│  d  2026-09-01  projects/   Things I've built                        │
│  d  2026-10-12  articles/   Things I've written                      │
│  -  2026-08-20  about.md    Who I am                                 │
│  -  2026-08-20  contact.md  How to reach me                          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  visitor@ljubijankic ~/projects > ▌                                  │  ← prompt (always here)
├──────────────────────────────────────────────────────────────────────┤
│  [home] [about me] [projects] [articles] [contact]   [theme] © 2026  │  ← bottom bar
└──────────────────────────────────────────────────────────────────────┘
```

- **Scrollback**: output of every command run so far, auto-scrolls to the newest line (also when the pager closes).
- **Prompt**: `visitor@ljubijankic <path> >`, always at the bottom, above the bottom bar. The path part (`~/projects`) is a clickable breadcrumb.
- **Bottom bar**: shortcuts to the main pages on the left; a `[theme]` button and `© Ljubijankic 2026` on the right.

## 3. Lifefetch (home screen)

The first thing a visitor sees, modelled on fastfetch/neofetch: ASCII art on the left, quick facts on the right, a colour-block row, and a tip.

```
╭────────────────╮     visitor@ljubijankic
│                │     ───────────────────
│   ▄▀▀▄  █      │     Name        Admir Ljubijankić
│   █▄▄█  █      │     Uptime      29 years
│   █  █  █▄▄▄   │     Location    Slovenia
│                │     Occupation  Web Developer
╰────────────────╯     Employment  Employed @ Agiledrop
                       OS          Arch Linux
                       CPU         AMD Ryzen 7 9800X3D (16) @ 5.27 GHz
                       GPU         AMD Radeon RX 9070XT
                       RAM         64 GB

                       ███ ███ ███ ███ ███ ███ ███ ███

  Tip: type 'help' to see available commands.
```

- Shown on first visit, also behind the pager when someone lands directly on a file URL.
- Going home: `lifefetch`, `cd` with no argument, `cd ~` and `cd $HOME` all do the same thing. They clear the screen, move to the home directory, and show the lifefetch output.
- **Uptime** is age in years, calculated from the birth date (3 March 1997) on every visit. On 3 March a cake icon is shown next to it (`29 years 🎂`).
- **Agiledrop** links to [agiledrop.com](https://agiledrop.com).
- **Logo**: a framed "AL" monogram (Admir Ljubijankić), coloured with the theme's accent colours like fastfetch logos.

## 4. Virtual filesystem

The site's content is a small filesystem. Home (`~`) is the root. Example:

```
~
├── about.md
├── contact.md
├── .secrets.md         (hidden, easter egg)
├── .ssh/               (hidden, joke)
│   ├── id_rsa          (opens the "I got Norton" meme)
│   ├── id_rsa.pub      (opens the same meme)
│   └── known_hosts     (plain text, links to friends' websites)
├── projects/
│   ├── tui-portfolio.md
│   └── some-project.md
└── articles/
    ├── hello-world.md
    └── another-post.md
```

- **Directories** group pages (projects, articles). Nested directories are allowed.
- **Files** are pages and show with their real extension. Markdown (`.md`) is the standard. Other formats are allowed and shown as plain text, with clickable links. `known_hosts` uses this to link to friends' websites.
- **Display name override**: a Markdown file can set a different name to show in `ls`. `id_rsa` and `id_rsa.pub` are Markdown pages showing the [I got Norton](https://i.kym-cdn.com/photos/images/original/000/012/663/752px-Igotsnorton.jpg) meme, but they're listed under their real key names. The image is copied into the repo, not hotlinked.
- **Hidden files and directories** start with `.` and only show with `ls -a`.

### Metadata

Every entry has:

| Field | Shown in | Notes |
|---|---|---|
| Type | `ls` | `d` directory, `-` file. Derived, not written by hand |
| Date | `ls`, pager | Date of creation |
| Description | `ls` | One short line written for non-technical visitors |
| Title | Browser tab, link previews | Falls back to the file name |
| Image | Link previews | Preview image when the page is shared |
| Tags | Pager header | Optional |
| Hidden | — | Hide an entry without a dot prefix, e.g. drafts |
| Name | `ls`, prompt paths | Optional display name override (e.g. `id_rsa`) |

Directories get their date and description from an `index.md` inside them, which itself isn't listed. Plain text files (like `known_hosts`) have no metadata and show `—` in those columns.

`ls` is always detailed: type, date, name, and description. Directories are styled differently from files, and every name is clickable.

```
d  2026-09-01  projects/   Things I've built
-  2026-08-20  about.md    Who I am
```

## 5. Commands

Every clickable element maps to one of these commands.

### Navigation

| Command | Behaviour | Click equivalent |
|---|---|---|
| `ls [path]` | Detailed listing of a directory (default: current) | Bottom bar / breadcrumb, then the listing |
| `ls -a [path]` | Same, including hidden files | — |
| `cd [path]` | Change directory. Supports `..`, `~`, `$HOME`, `-` (previous dir), absolute (`~/articles`) and relative paths. No argument = `cd ~` (shows lifefetch) | Clicking a directory in output, breadcrumb segments |
| `pwd` | Print current path | — |
| `tree [path]` | Tree view of a directory | — |

### Files

| Command | Behaviour | Click equivalent |
|---|---|---|
| `cat <file>`, `open <file>`, `less <file>` | Open the file in the pager view | Clicking a file name in output, bottom bar entries |
| `share [file]` | Copy the file's URL to the clipboard (current pager file if no argument) | `[share]` in pager |

### Session

| Command | Behaviour |
|---|---|
| `help [command]` | List commands (each clickable), or show usage for one |
| `clear` | Clear the scrollback |
| `history [-c]` | Show the commands you typed (numbered, click to rerun); `-c` clears them |
| `lifefetch` | Home screen (see §3) |
| `theme [name]` | List themes, or switch theme |
| `whoami`, `date`, `echo <text>` | What you'd expect |

### Fun

| Kind | Commands |
|---|---|
| Classic gags | `sudo …` ("nice try"), `rm -rf /` (fake meltdown), `exit`, `vim` / `emacs` ("how do I quit?"), `whoami` |
| Toys | `cowsay <text>`, `fortune`, `sl` (steam locomotive), `matrix` (rain animation, any key stops it), `neofetch` (alias of `lifefetch`) |
| Easter eggs | Hidden commands not listed in `help`, `.secrets.md` hidden file, `.ssh/` hidden directory with joke files, Konami code |

### Errors

- Unknown command: `command not found: lss. Did you mean ls?`
- Bad path: `cd: no such directory: foo`
- Opening a directory: `cat: projects: is a directory`

## 6. Pager view

Opening a file switches the output area into a full-screen reader, like `less`:

```
┌─ ~/articles/hello-world.md ──────────────────── 2026-10-12 · #vue ─┐
│                                                                    │
│  # Hello World                                                     │
│                                                                    │
│  Rendered markdown text, code blocks, lists…                       │
│                                                                    │
│  [ image ]                                                         │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  q close · j/k scroll · s share                [close] [share]     │
└────────────────────────────────────────────────────────────────────┘
```

- Header: file path plus date and tags.
- Body: rendered Markdown, including images.
- Keys: `q` / `Esc` close, `j` `k` `↑` `↓` scroll, `Space` / `PgDn` / `PgUp` page, `g` / `G` top/bottom, `s` share.
- Mouse/touch: scrolling works the way it does on any website (mouse wheel, trackpad, touch swipe, dragging the scrollbar), so non-technical visitors never need the keys. `[close]` and `[share]` buttons are always visible.
- Closing returns to the terminal with the scrollback intact.

## 7. Click fallback

| Surface | Runs |
|---|---|
| Directory name in any output | `cd <dir>` then `ls` |
| File name in any output | `open <file>` |
| Command name in `help` | `help <command>` |
| Breadcrumb segment in the prompt | `cd <that path>` (`~` shows lifefetch) |
| `help` in the lifefetch tip | `help` |
| Bottom bar `[home]` | `cd ~` (shows lifefetch) |
| Bottom bar `[about me]` | `open ~/about.md` |
| Bottom bar `[projects]` | `cd ~/projects` then `ls` |
| Bottom bar `[articles]` | `cd ~/articles` then `ls` |
| Bottom bar `[contact]` | `open ~/contact.md` |
| Bottom bar `[theme]` | `theme` (keeps the scrollback, closes the pager) |
| Pager `[close]` / `[share]` | `q` / `share` |

Clicking always echoes the command into the scrollback as if it had been typed.

## 8. URLs and sharing

- Only **files** get shareable URLs: `~/articles/hello-world.md` → `https://ljubijankic.si/articles/hello-world`.
- `cd` does not change the URL.
- Opening a file updates the URL; closing the pager resets it to `/`. Browser back/forward follow this.
- Visiting a file URL directly boots the terminal, sets the current directory to the file's directory (`~/articles`), and opens the file in the pager.
- Visiting a directory URL like `/articles` boots the terminal, runs `cd ~/articles` and `ls`, and resets the URL to `/`.
- Each file URL is a real, pre-generated page, so search engines and link previews (title, description, image) work.
- `share` copies the current file's URL to the clipboard. If the clipboard isn't available, it prints the URL.
- Unknown URLs land on the terminal with an error line such as `open: /foo: no such file`.

## 9. Keyboard and input

On desktop the page captures the keyboard: typing anywhere goes to the prompt.

| Key | Action |
|---|---|
| `Enter` | Run command |
| `Tab` | Complete command or path; on ambiguity, list candidates (clickable), further `Tab`s cycle through them |
| `↑` / `↓` | Walk through history; with text typed, only commands starting with it |
| `Ctrl+R` | Fuzzy search through history |
| `Ctrl+L` | Clear the screen (the typed line stays) |
| `Ctrl+C` | Cancel the current line, shown as `^C` in the scrollback (or stop `matrix` / `sl`, or close the search). Plain copy still works when text is selected |
| `Ctrl+U` | Clear the line |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line (in the prompt; elsewhere the browser's own shortcuts) |
| `Esc` | Close pager / search |

- **History**: the last 50 commands, kept in the browser between visits.
- **Fuzzy search (`Ctrl+R`)**: a small fzf-style box above the prompt, starting with what's already typed; typing filters history by fuzzy match (matched letters highlighted), `↑`/`↓` move, `Enter` puts the pick in the prompt to edit or run, `Esc` cancels.
- Some browser shortcuts can't be overridden (e.g. `Ctrl+W`, `Ctrl+T`); those keep their browser behaviour.

## 10. Mobile

- Same UI, but click-first.
- The prompt does not auto-focus on touch devices, so the keyboard doesn't pop up by itself.
- Tapping the prompt opens the keyboard for typing.
- The bottom bar and clickable output are the main way to navigate.

## 11. Themes

- Default: Catppuccin (Mocha).
- `theme` lists the available themes with a colour swatch each (click one to switch); `theme <name>` switches, using the full name (`theme catppuccin-latte`). The choice is saved in the browser (localStorage) and remembered between visits. Everyone starts on mocha.
- Available in v1: Catppuccin flavours `mocha`, `macchiato`, `frappe`, `latte`. More themes may come later.

## 12. Accessibility and SEO

- File pages are pre-generated with a proper title, description, and preview image from their metadata.
- Clickable entries are real links where they lead to a file, so they work with screen readers, middle-click and "copy link".
- New output is announced to screen readers.
- Animations (`matrix`, `sl`, `rm -rf /`) respect the "reduce motion" system setting.

## 13. Open items

1. Friends' links in `known_hosts` (§4)
2. Contact details: Admir fills these in directly in `contact.md`
3. Additional themes: later, not v1 (§11)

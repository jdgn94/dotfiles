# Neovim / NvChad

NvChad v2.5 with **neo-tree** as the file explorer (nvim-tree is disabled) and
LSP/Treesitter support for common languages.

## Requirements

- Neovim 0.11+ (0.12.x installed)
- `git`, `rg`, `fd`, `fzf`, `node`, `npm`, `python`, `gcc`, `tree-sitter`
- A Nerd Font (JetBrainsMono Nerd Font is installed) for devicons, neo-tree and
  lazygit icons.

## Explorer

| Key | Action |
| --- | --- |
| `<leader>e` | Toggle neo-tree |
| `<leader>E` | Focus neo-tree |
| `<leader>o` | Reveal current file in neo-tree |

`nvim-tree` is disabled explicitly; neo-tree hijacks netrw and follows the
current file.

## Languages

LSP servers installed by Mason:

`lua_ls`, `pyright`, `ts_ls`, `jsonls`, `yamlls`, `bashls`, `html`, `cssls`,
`gopls`, `rust_analyzer`, `clangd`, `marksman`, `taplo`, `dockerls`.

Treesitter parsers: bash, c, cpp, css, dockerfile, go, html, java, javascript,
json, lua, luadoc, markdown, markdown_inline, python, rust, toml, tsx,
typescript, vim, vimdoc, yaml.

On the first launch Mason installs the LSP servers and NvChad installs the
Treesitter parsers in the background. Open `:Mason` to inspect progress.

## LazyGit

`lazygit` uses the same Nerd Font; its config sets `nerdFontsVersion: "3"` and
`showFileIcons: true`.

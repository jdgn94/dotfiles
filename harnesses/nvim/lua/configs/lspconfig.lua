require("nvchad.configs.lspconfig").defaults()

local servers = {
  "lua_ls",
  "pyright",
  "ts_ls",
  "jsonls",
  "yamlls",
  "bashls",
  "html",
  "cssls",
  "gopls",
  "rust_analyzer",
  "clangd",
  "marksman",
  "taplo",
  "dockerls",
}

vim.lsp.enable(servers)

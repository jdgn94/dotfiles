return {
  {
    "stevearc/conform.nvim",
    opts = require "configs.conform",
  },

  {
    "neovim/nvim-lspconfig",
    lazy = false,
    config = function()
      require "configs.lspconfig"
    end,
  },

  -- NvChad ships nvim-tree; neon-tree replaces it.
  { "nvim-tree/nvim-tree.lua", enabled = false },

  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "MunifTanjim/nui.nvim",
      "nvim-tree/nvim-web-devicons",
    },
    cmd = "Neotree",
    opts = {
      close_if_last_window = true,
      popup_border_style = "rounded",
      enable_git_status = true,
      enable_diagnostics = true,
      filesystem = {
        follow_current_file = { enabled = true },
        use_libuv_file_watcher = true,
        hijack_netrw_behavior = "open_default",
        filtered_items = {
          hide_dotfiles = false,
          hide_gitignored = false,
        },
      },
      window = {
        width = 32,
        mappings = {
          ["<space>"] = "none",
        },
      },
      default_component_configs = {
        indent = { with_expanders = true },
      },
    },
  },

  -- Install the LSP servers used by configs/lspconfig.lua.
  {
    "mason-org/mason.nvim",
    lazy = false,
    opts = function()
      local opts = require "nvchad.configs.mason"
      -- Mason binaries must be on PATH for vim.lsp.enable to find them.
      opts.PATH = "prepend"
      return opts
    end,
    config = function(_, opts)
      require("mason").setup(opts)

      local ensure = {
        "lua-language-server",
        "pyright",
        "typescript-language-server",
        "json-lsp",
        "yaml-language-server",
        "bash-language-server",
        "html-lsp",
        "css-lsp",
        "gopls",
        "rust-analyzer",
        "clangd",
        "marksman",
        "taplo",
        "dockerfile-language-server",
      }

      local registry = require "mason-registry"
      registry.refresh(function()
        for _, name in ipairs(ensure) do
          local ok, package = pcall(registry.get_package, name)
          if ok and not package:is_installed() then
            package:install()
          end
        end
      end)
    end,
  },

  {
    "nvim-treesitter/nvim-treesitter",
    opts = function()
      local opts = require "nvchad.configs.treesitter"
      opts.ensure_installed = {
        "bash",
        "c",
        "cpp",
        "css",
        "dockerfile",
        "go",
        "html",
        "java",
        "javascript",
        "json",
        "lua",
        "luadoc",
        "markdown",
        "markdown_inline",
        "python",
        "rust",
        "toml",
        "tsx",
        "typescript",
        "vim",
        "vimdoc",
        "yaml",
      }
      return opts
    end,
  },
}

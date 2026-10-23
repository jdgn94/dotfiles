require "nvchad.mappings"

-- add yours here

local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")

-- Neo-tree replaces NvChad's nvim-tree keymaps.
map("n", "<leader>e", "<cmd>Neotree toggle<CR>", { desc = "Neo-tree toggle" })
map("n", "<leader>E", "<cmd>Neotree focus<CR>", { desc = "Neo-tree focus" })
map("n", "<leader>o", "<cmd>Neotree reveal<CR>", { desc = "Neo-tree reveal current file" })

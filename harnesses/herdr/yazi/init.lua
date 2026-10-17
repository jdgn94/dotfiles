-- Yazi Init Config
-- Git plugin setup
require("git"):setup {
	order = 1500,
}

-- fg (fuzzy find & grep) setup
require("fg"):setup({
    default_action = "jump", -- jump directly to file in yazi
})

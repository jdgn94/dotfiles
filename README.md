# 🌌 Dotsfiles - Multi-Agent Harnesses & Configurations

Configuración centralizada y unificada de dotfiles para harness de agentes de IA:
- **Pi Coding Agent (`pi`)**
- **Claude Code (`claude`)**
- **OpenCode (`opencode`)**
- **Hermes Agent (`hermes`)**
- **Antigravity CLI / Desktop (`agy` / `antigravity`)**
- **Herdr (`herdr`)** (Gestor de sesiones y terminales de agentes)

---

## 📁 Arquitectura del Repositorio

```text
dotsfiles/
├── install.sh                  # Instalador universal nativo para Linux / macOS
├── install.ps1                 # Instalador universal nativo para Windows (PowerShell 7+)
├── tsconfig.json               # Configuración TypeScript
├── secrets/                    # Plantillas de credenciales y tokens centralizados
│   ├── tokens.env.example      # Variables de entorno para tokens MCP y APIs
│   ├── tokens.json.example     # Formato JSON para secrets centralizados
│   └── load-secrets.ts         # Módulo utilitario para cargar tokens en harness/plugins
├── shared/                     # Configuraciones compartidas entre todos los harnesses
│   ├── rules/                  # Reglas globales (AGENTS.md, COMMON_RULES.md)
│   └── skills/                 # Skills compartidas canónicas (enlazadas a ~/.agents/skills)
└── harnesses/                  # Configuraciones específicas por harness
    ├── pi/                     # Configuración de Pi (.pi/agent)
    │   ├── agent/              # settings.json, agents, extensions, npm packages
    │   └── skills/             # Skills exclusivas de Pi
    ├── claude/                 # Configuración de Claude Code (.claude)
    │   ├── settings.json       # Configuración global
    │   ├── hooks/              # Hooks de Claude
    │   └── skills/             # Skills exclusivas de Claude
    ├── opencode/               # Configuración de OpenCode (.config/opencode)
    │   ├── opencode.jsonc      # Configuración de modelos, mcp, plugins
    │   ├── tui.jsonc           # Configuración TUI
    │   ├── plugins/            # Plugins de OpenCode
    │   └── skills/             # Skills exclusivas de OpenCode
    ├── hermes/                 # Configuración de Hermes Agent (.hermes)
    │   ├── config.yaml         # Configuración global y toolsets
    │   └── skills/             # Skills exclusivas de Hermes
    ├── antigravity/            # Configuración de Antigravity (.gemini)
    │   ├── config.json         # Plugins y configuración
    │   ├── mcp_config.json     # Servidores MCP
    │   ├── agy-settings.json   # Configuración de la CLI `agy`
    │   └── skills/             # Skills exclusivas de Antigravity
    └── herdr/                  # Configuración de Herdr (.config/herdr)
        ├── config.toml         # Configuración del servidor/cliente y keybindings
        ├── plugins.json        # Plugins activos (Projects, herdr-files, etc.)
        ├── bin/                # Scripts de control (toggle-explorer.sh)
        ├── plugins/herdr-files # Plugin de explorador de archivos split a la derecha
        └── yazi/               # Configuración de Yazi (iconos, git, fzf, ripgrep)
```

---

## 🗂️ Herdr: Explorador de Archivos (Panel Derecho)

Herdr incluye el plugin de explorador de archivos **`herdr-files`**, impulsado por **Yazi** y configurado con:
- **Panel lateral a la derecha**: Se abre como un panel split del 35% del ancho a la derecha del workspace.
- **Git status en vivo**: Indicadores visuales de estado de git (`M` modificado, `?` no rastreado, `✔` limpio) en cada archivo y carpeta.
- **Iconos de archivo**: Iconografía nativa según extensiones y tipos de archivo.
- **Buscador por nombre de archivo**: Presiona `ff` o `Ctrl+P` dentro del explorador para buscar archivos rápidamente con `fzf`.
- **Buscador por contenido (Grep)**: Presiona `fg` (fuzzy) o `fG` (ripgrep) o `Ctrl+F` para buscar texto dentro de cualquier archivo con preview instantáneo.

### Atajos de teclado en Herdr:
- **`Prefix + e`** (`Ctrl+b` luego `e`) o **`Alt + e`**: Alterna (abre/cierra) el explorador en el split derecho.
- **`Prefix + E`** (`Ctrl+b` luego `Shift+e`): Abre el explorador en una ventana modal flotante (popup) al 85%.

---

## 🔑 Gestión Centralizada de Tokens y MCPs

Para no duplicar credenciales ni exponer tokens en el repositorio:
1. El instalador crea copias seguras en `~/.config/dotsfiles/`:
   - `~/.config/dotsfiles/tokens.env` (para shells y variables de entorno `{env:VAR}`)
   - `~/.config/dotsfiles/tokens.json` (para integraciones JSON/TS)
2. Modifica esos archivos con tus claves personales (`CONTEXT7_API_KEY`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, etc.).
3. Las configuraciones de los harness apuntan a estas variables (por ejemplo, en `opencode.jsonc`: `"Authorization": "Bearer {env:CONTEXT7_API_KEY}"`).

---

## 🚀 Instalación y Despliegue

### En Linux y macOS
Ejecuta con cualquier terminal:
```bash
./install.sh
# o
bash install.sh
```

### En Windows (PowerShell 7+)
Abre PowerShell 7 (`pwsh`) y ejecuta:
```powershell
pwsh -ExecutionPolicy Bypass -File .\install.ps1
```

### ¿Qué hace el instalador?
1. **Detección e instalación nativa**: Comprueba si los binarios (`pi`, `claude`, `opencode`, `hermes`, `agy`, `herdr`) están instalados; si falta alguno, los instala mediante los gestores nativos de paquetes (`npm`, `brew`, `yay`, `winget`, `scoop` o scripts oficiales).
2. **Secretos seguros**: Crea `~/.config/dotsfiles/tokens.env` y `tokens.json` con permisos restringidos.
3. **Fuente única de verdad compartida**: Enlaza `~/.agents` a `shared/`.
4. **Despliegue de cada harness**:
   - Copia configuraciones, extensiones, agentes y reglas base.
   - Instala paquetes y dependencias npm necesarias.
   - Configura instrucciones compartidas (`AGENTS.md`) en cada harness.
   - Activa hooks e integraciones con Herdr.
5. **Sincronización de Skills**:
   - Enlaza todas las **skills compartidas** (`shared/skills/*`) a los directorios de skills de cada harness.
   - Enlaza las **skills individuales** de cada harness (`harnesses/<nombre>/skills/*`) a su respectiva carpeta.

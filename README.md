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
        ├── plugins.json        # Registro de plugins instalados (Projects, herdr-sidebar)
        └── state/              # Estado persistente preconfigurado (dock right, preview pane, nvim)
```

---

## 🗂️ Herdr: Barra Lateral Tipo VS Code (`herdr-sidebar`)

Herdr cuenta con el plugin oficial **`herdr-sidebar`**, que ofrece una experiencia idéntica a la barra lateral de VS Code en la terminal:

- **Dock a la derecha**: Anclado en el lado derecho de la pantalla.
- **División Consola vs Archivos (50/50 o adaptable)**:
  - Lado izquierdo: Espacio dedicado a terminales y agentes (`pi`, `claude`, `opencode`). Si no hay previsualización abierta, ocupan el espacio completo.
  - Lado derecho: Árbol de archivos y panel de previsualización en split.
- **Confinado a la raíz del proyecto**: Explora desde el root del workspace activo sin subir a carpetas padre.
- **Visualizador de imágenes en terminal**: Previsualización gráfica nativa con protocolo Kitty/Ghostty para formatos `.png`, `.jpg`, `.webp`, `.svg`, `.gif`.
- **Markdown formateado + Edición inmediata**:
  - Los archivos `.md` muestran renderizado estilizado con tablas, listas y syntax highlighting.
  - Presiona **`e`** dentro del visor o configura clic directo para saltar a editar con **Neovim (`nvim`)**.
- **Source Control (Git) integrado**: Panel de GitLens con diffs interactivos, staging y mensajes de commit.
- **Búsqueda instantánea**:
  - `Ctrl + P`: Búsqueda difusa rápida de archivos por nombre.
  - `Ctrl + F`: Búsqueda global de contenido por texto/regex en todo el proyecto.

### Atajos de teclado en Herdr:
- **`Alt + e`** o **`Prefix + e`** (`Ctrl+b` luego `e`): Alterna (abre/cierra) la barra lateral a la derecha.
- **`Prefix + p`** (`Ctrl+b` luego `p`): Selector de archivos estilo `Ctrl+P`.
- **`Prefix + g`** (`Ctrl+b` luego `g`): Acceso directo al panel de Source Control (Git).
- **`Prefix + f`** (`Ctrl+b` luego `f`): Acceso directo a la búsqueda global de contenido.
- **`1`, `2`, `3`**: Conmuta entre Explorer, Búsqueda y Source Control.
- **`s`**: Abre el menú interactivo de ajustes del sidebar.

---

## ⏱️ Herdr: Monitor de Cuotas y Límites de Agentes (`usagebar`)

Integración idéntica al monitor de cuotas de Orca (`senna-lang/herdr-agent-usage`):
- **Ventana emergente de límites (Limits Pane)**:
  - Muestra el consumo y tiempo restante de reinicio para **Claude Code** (5h / 7d), **OpenCode Go** (5h / 7d / 30d) y **Antigravity / Gemini** (5h / semanal), además de backends API pay-as-you-go y medidores de contexto de la sesión.
- **Métricas integradas en la barra lateral**:
  - Filas de estado automáticas en el sidebar con `$provider`, `$limit`, estado del prompt-cache y ventana de contexto `$context`.
- **Alertas preventivas (Toasts)**: Notificaciones en terminal cuando un límite baja del 50%, 20%, 10% o 5%.

### Atajos para monitorear cuotas en Herdr:
- **`Alt + u`** o **`Prefix + u`** (`Ctrl+b` luego `u`): Abre el panel emergente detallado de cuotas y uso de todos los agentes.
- **`Prefix + m`** (`Ctrl+b` luego `m`): Refresca manualmente los medidores y límites de los agentes.

---

## 🏷️ Herdr: Autonombrado Contextual de Pestañas (`herdr.auto-title`)

Gestión inteligente de títulos para pestañas y paneles en Herdr:
- **Agentes de IA**: Extrae y muestra la tarea y tema exacto que está ejecutando el agente activo (Claude Code, Pi, OpenCode), ej. `1 · dotsfiles › herdr auto-title`.
- **Editores de código**: Al abrir Neovim, renombra la pestaña con el archivo en edición (`nvim › install.sh`).
- **Ramas Git**: Refleja la rama activa de desarrollo.
- **Respeto a nombres manuales**: Si renombras una pestaña con `Prefix + Shift + t`, el plugin lo detecta y deja intacto tu nombre personalizado.

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

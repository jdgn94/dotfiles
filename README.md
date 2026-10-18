# π+ Pi-TUI-Plus

Interfaz de terminal avanzada para **Pi Coding Agent** con arquitectura **Split-View**, monitor de **métricas de tokens en tiempo real**, **contexto de Git** y **visor detallado de herramientas y logs**.

Desarrollada sobre `@earendil-works/pi-tui` y el SDK de `@earendil-works/pi-coding-agent`.

---

## ✨ Características Principales

### 1. 📊 Métricas y Tokens en Vivo (Tab 1: Métricas)
- **Barra de Ventana de Contexto**: Visualización del % de uso respecto al límite del modelo (ej. 128k, 200k, 1M).
- **Desglose de Tokens**: Tokens de Entrada, Salida, Lectura de Caché (Cache Read), Escritura de Caché (Cache Write) y Total.
- **Rendimiento**: Velocidad de generación en tiempo real (`tok/s`) y latencia al primer token (`ms`).
- **Coste Estimado**: Cálculo dinámico en USD basado en los precios del modelo activo.
- **Contador de Turnos**: Seguimiento del historial de la conversación.

### 2. 🔀 Paneles / Split-View
- **Layout dividido**: Panel principal para el chat/transcripción y panel lateral persistente (Sidebar).
- **Sidebar multi-pestaña**: Alterna fácilmente entre Métricas, Git y Tool Logs.
- **Auto-scroll y desplazamiento**: Sigue la generación en vivo o navega hacia arriba con PageUp/PageDown.

### 3. 🌿 Contexto Git y Entorno (Tab 2: Git & Env)
- **Rama activa**: Detección de rama actual (ej. ` master`).
- **Estado de cambios**: Conteo de archivos modificados, en stage (staged) y sin seguimiento (untracked).
- **Último Commit**: Hash, mensaje descriptivo y tiempo relativo del último commit.
- **Tools del Agente**: Lista de herramientas activas disponibles para el modelo.

### 4. ⚡ Visor de Herramientas y Logs (Tab 3: Tool Logs)
- Registro cronológico de todas las tools ejecutadas (`read`, `bash`, `write`, `edit`, `web_search`, etc.).
- Indicador de estado visual (`[✓]` éxito, `[✗]` error, `[⟳]` en ejecución).
- Duración exacta de ejecución en milisegundos (`durationMs`).
- Previsualización de argumentos y extracto de resultados.

---

## ⌨️ Atajos de Teclado (Shortcuts)

| Tecla | Acción |
|---|---|
| `Tab` | Cambiar a la siguiente pestaña del panel lateral (`Métricas` → `Git & Env` → `Tool Logs`) |
| `Shift + Tab` | Ocultar o mostrar el panel lateral (pantalla completa para el chat) |
| `Alt + 1` | Ir directo a la pestaña de **Métricas** |
| `Alt + 2` | Ir directo a la pestaña de **Git & Entorno** |
| `Alt + 3` | Ir directo a la pestaña de **Tool Logs** |
| `PageUp` | Subir en el historial del chat |
| `PageDown` | Bajar en el historial del chat (vuelve al auto-scroll si llega al final) |
| `Flecha Arriba/Abajo` | Navegar historial de prompts anteriores |
| `Ctrl + C` | Cancelar generación en curso o salir limpiamente |

---

## 🚀 Instalación y Uso

El ejecutable `pi-plus` ya se encuentra enlazado globalmente en tu entorno:

```bash
# Ejecutar directamente desde cualquier proyecto o directorio:
pi-plus
```

O desde el directorio del proyecto:

```bash
cd /home/juan/Projects/pi-tui-plus
npm start
```

### Compilación y Desarrollo

```bash
npm run build    # Compila TypeScript a ./dist
npm run dev      # Compila y ejecuta en modo desarrollo
npm run watch    # Compilación en modo watch continuo
```

---

## 🏗️ Arquitectura

```
/home/juan/Projects/pi-tui-plus/
├── src/
│   ├── cli.ts                    # Punto de entrada ejecutable
│   ├── state/
│   │   ├── agent-manager.ts      # Enlace con el SDK de Pi y flujo de eventos
│   │   ├── metrics-tracker.ts    # Calculador de tokens, velocidad y coste
│   │   ├── git-watcher.ts        # Monitor de git en tiempo real
│   │   └── tool-logger.ts        # Registro y tracking de llamadas a herramientas
│   └── ui/
│       ├── theme.ts              # Paleta Catppuccin/Tokyo Night y helpers ANSI
│       ├── app-layout.ts         # Orquestador del layout y Split-View
│       └── components/
│           ├── header.ts         # Barra superior (branding, modelo, rama)
│           ├── chat-view.ts      # Viewport del chat con streaming y cajas
│           ├── sidebar.ts        # Sidebar tabbed (Métricas, Git, Tool Logs)
│           ├── input-box.ts      # Editor de entrada con historial y cursor
│           └── status-bar.ts     # Barra inferior con estado y resumen
├── package.json
└── tsconfig.json
```

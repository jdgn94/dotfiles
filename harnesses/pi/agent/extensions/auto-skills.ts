import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StringEnum, Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const HOME_DIR = os.homedir();
const AGENTS_SKILLS_DIR = path.join(HOME_DIR, ".agents", "skills");
const PI_SKILLS_DIR = path.join(HOME_DIR, ".pi", "agent", "skills");
const ARCHIVE_DIR = path.join(AGENTS_SKILLS_DIR, ".archive");

interface SkillMetadata {
  name: string;
  description: string;
  path: string;
  isSymlinked: boolean;
  updatedAt?: string;
}

function parseFrontmatter(fileContent: string): { name?: string; description?: string; body: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { body: fileContent };
  }

  const rawFrontmatter = match[1];
  const body = match[2];

  let name: string | undefined;
  let description: string | undefined;

  for (const line of rawFrontmatter.split(/\r?\n/)) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
    }
    const descMatch = line.match(/^description:\s*(.+)$/);
    if (descMatch) {
      description = descMatch[1].trim().replace(/^["']|["']$/g, "");
    }
  }

  return { name, description, body };
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureSkillSymlink(skillName: string): boolean {
  try {
    ensureDirectoryExists(PI_SKILLS_DIR);
    const symlinkTarget = path.join(PI_SKILLS_DIR, skillName);
    const relativeTarget = path.join("..", "..", "..", ".agents", "skills", skillName);

    if (fs.existsSync(symlinkTarget)) {
      try {
        const stat = fs.lstatSync(symlinkTarget);
        if (stat.isSymbolicLink()) {
          return true;
        }
      } catch {}
      return false;
    }

    fs.symlinkSync(relativeTarget, symlinkTarget);
    return true;
  } catch (err) {
    console.error("[auto-skills] Failed to create symlink:", err);
    return false;
  }
}

function notifySkillSaved(skillName: string, action: string): void {
  const args = [
    "-a",
    "Pi Agent",
    "-u",
    "normal",
    "-i",
    "dialog-information",
    `✨ Skill ${action}: ${skillName}`,
    `Skill registrada exitosamente en ~/.agents/skills/${skillName}/SKILL.md`,
  ];
  execFile("notify-send", args, () => {});
}

export default function (pi: ExtensionAPI) {
  // Tool: save_skill
  pi.registerTool({
    name: "save_skill",
    label: "Save Skill",
    description:
      "Save, update (patch), or archive an agent skill following the Hermes continuous-learning standard. Saves to ~/.agents/skills/<name>/SKILL.md and creates the Pi symlink.",
    promptSnippet: "Save or update a reusable skill in the global skills library",
    promptGuidelines: [
      "Use save_skill to persist reusable workflows, tricky bug fixes, or non-obvious patterns discovered during task execution.",
      "Skill names must be lowercase-hyphenated (e.g., condition-based-waiting). Descriptions must start with 'Use when...'.",
      "Always check existing skills with list_skills first to patch rather than duplicate.",
    ],
    parameters: Type.Object({
      name: Type.String({
        description:
          "Lowercase-hyphenated identifier (e.g. 'condition-based-waiting', 'astal-gtk4-styling'). Regex: ^[a-z0-9]+(-[a-z0-9]+)*$",
      }),
      description: Type.String({
        description:
          "Trigger description starting with 'Use when [specific conditions]'. Keep concise and focused on routing.",
      }),
      content: Type.String({
        description:
          "Markdown content of the skill. Standard Hermes sections: ## Overview, ## When to Use, ## Procedure / Key Patterns, ## Pitfalls & Gotchas, ## Verification. Frontmatter will be normalized automatically.",
      }),
      mode: Type.Optional(
        StringEnum(["create", "patch", "archive"])
      ),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const { name, description, content } = params;
      const mode = params.mode || "create";

      // 1. Validate name format
      const validNameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!validNameRegex.test(name)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Skill name '${name}' is invalid. It must be lowercase alphanumeric with hyphens (e.g. 'condition-based-waiting').`,
            },
          ],
          details: { error: "invalid_name" },
        };
      }

      ensureDirectoryExists(AGENTS_SKILLS_DIR);
      const skillDir = path.join(AGENTS_SKILLS_DIR, name);
      const skillFile = path.join(skillDir, "SKILL.md");

      // 2. Handle archive mode
      if (mode === "archive") {
        if (!fs.existsSync(skillDir)) {
          return {
            content: [{ type: "text", text: `Skill '${name}' does not exist to be archived.` }],
            details: { status: "not_found" },
          };
        }
        ensureDirectoryExists(ARCHIVE_DIR);
        const targetArchive = path.join(ARCHIVE_DIR, name);
        if (fs.existsSync(targetArchive)) {
          fs.rmSync(targetArchive, { recursive: true, force: true });
        }
        fs.renameSync(skillDir, targetArchive);

        // Remove symlink if exists
        const piSymlink = path.join(PI_SKILLS_DIR, name);
        if (fs.existsSync(piSymlink)) {
          try {
            fs.unlinkSync(piSymlink);
          } catch {}
        }

        ctx.ui?.notify(`Skill '${name}' archived to ~/.agents/skills/.archive/${name}`, "info");
        notifySkillSaved(name, "archivada");
        return {
          content: [{ type: "text", text: `Skill '${name}' successfully moved to .archive/${name}.` }],
          details: { status: "archived", name },
        };
      }

      // 3. Handle create mode collision check
      if (mode === "create" && fs.existsSync(skillFile)) {
        return {
          content: [
            {
              type: "text",
              text: `Skill '${name}' already exists at ${skillFile}. Use mode: 'patch' to update it, or choose a different name.`,
            },
          ],
          details: { status: "collision_detected" },
        };
      }

      // 4. Clean content & assemble valid frontmatter
      const parsed = parseFrontmatter(content);
      const bodyContent = parsed.body.trim();

      let cleanDesc = description.trim();
      if (!cleanDesc.startsWith("Use when")) {
        cleanDesc = `Use when ${cleanDesc}`;
      }

      const fullSkillDocument = [
        "---",
        `name: ${name}`,
        `description: ${cleanDesc}`,
        "---",
        "",
        bodyContent,
        "",
      ].join("\n");

      // 5. Write file
      ensureDirectoryExists(skillDir);
      fs.writeFileSync(skillFile, fullSkillDocument, "utf8");

      // 6. Ensure symlink in ~/.pi/agent/skills/
      const symlinked = ensureSkillSymlink(name);

      const actionText = mode === "patch" ? "actualizada" : "creada";
      ctx.ui?.notify(`Skill '${name}' ${actionText} con éxito.`, "info");
      notifySkillSaved(name, actionText);

      return {
        content: [
          {
            type: "text",
            text: `Skill '${name}' successfully saved!\n- Path: ${skillFile}\n- Symlinked in Pi: ${symlinked ? "Yes" : "No"}\n- Mode: ${mode}\n- Trigger: ${cleanDesc}`,
          },
        ],
        details: {
          name,
          path: skillFile,
          symlinked,
          mode,
          description: cleanDesc,
        },
      };
    },
  });

  // Tool: list_skills
  pi.registerTool({
    name: "list_skills",
    label: "List Skills",
    description: "List all existing skills in ~/.agents/skills with their trigger descriptions.",
    promptSnippet: "Inspect installed skills to patch rather than duplicate",
    parameters: Type.Object({
      query: Type.Optional(Type.String({ description: "Filter skills by keyword in name or description" })),
    }),
    async execute(_id, params) {
      if (!fs.existsSync(AGENTS_SKILLS_DIR)) {
        return {
          content: [{ type: "text", text: "No skills directory found at ~/.agents/skills" }],
          details: { skills: [] },
        };
      }

      const query = (params.query || "").toLowerCase().trim();
      const entries = fs.readdirSync(AGENTS_SKILLS_DIR, { withFileTypes: true });
      const skills: SkillMetadata[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

        const skillPath = path.join(AGENTS_SKILLS_DIR, entry.name, "SKILL.md");
        if (fs.existsSync(skillPath)) {
          try {
            const raw = fs.readFileSync(skillPath, "utf8");
            const parsed = parseFrontmatter(raw);
            const stat = fs.statSync(skillPath);

            const piSymlink = path.join(PI_SKILLS_DIR, entry.name);
            const isSymlinked = fs.existsSync(piSymlink);

            const item: SkillMetadata = {
              name: parsed.name || entry.name,
              description: parsed.description || "No description provided",
              path: skillPath,
              isSymlinked,
              updatedAt: stat.mtime.toISOString(),
            };

            if (
              !query ||
              item.name.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query)
            ) {
              skills.push(item);
            }
          } catch {}
        }
      }

      skills.sort((a, b) => a.name.localeCompare(b.name));

      const formatted = skills
        .map((s) => `• **${s.name}**: ${s.description} ${s.isSymlinked ? "🔗" : ""}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: skills.length > 0 ? `Found ${skills.length} skills:\n\n${formatted}` : "No matching skills found.",
          },
        ],
        details: { skills },
      };
    },
  });

  // Command: /learn
  pi.registerCommand("learn", {
    description:
      "Analizar la tarea reciente y autogenerar una skill de mejora continua (/learn [enfoque opcional])",
    handler: async (args, ctx) => {
      const focus = String(args || "").trim();
      const prompt = [
        "Protocolo Hermes Auto-Skills de Aprendizaje Continuo:",
        "Reflexiona de forma crítica sobre esta sesión, los errores enfrentados, diagnósticos y soluciones implementadas.",
        "1. Identifica técnicas reutilizables, patrones no triviales, soluciones a bugs complejos o trampas (gotchas).",
        "2. Usa la herramienta `list_skills` para verificar si ya existe una skill relacionada que deba ser actualizada ('Patch, don't duplicate').",
        "3. Si es una técnica nueva o mejora sustancial, llama a `save_skill` para guardar la skill con la estructura estándar de Hermes (Overview, When to Use, Procedure, Pitfalls, Verification) en inglés técnico.",
        focus ? `Enfoque solicitado: ${focus}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      ctx.ui.notify("Iniciando auto-reflexión y extracción de skills...", "info");
      pi.sendUserMessage(prompt);
    },
  });

  // Command: /skills
  pi.registerCommand("skills", {
    description: "Listar todas las skills globales instaladas",
    handler: async (_args, ctx) => {
      if (!fs.existsSync(AGENTS_SKILLS_DIR)) {
        ctx.ui.notify("No se encontró el directorio ~/.agents/skills", "warning");
        return;
      }
      const entries = fs.readdirSync(AGENTS_SKILLS_DIR, { withFileTypes: true });
      const names = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
      ctx.ui.notify(`Skills instaladas (${names.length}):\n${names.join(", ")}`, "info");
    },
  });
}

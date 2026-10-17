import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface DotsfilesTokens {
  [key: string]: string | undefined;
}

/**
 * Carga tokens desde ~/.config/dotsfiles/tokens.json o variables de entorno.
 * Permite a cualquier harness o extensión de pi / script acceder a los tokens centralizados.
 */
export function getTokens(): DotsfilesTokens {
  const home = os.homedir();
  const configPath = process.env.DOTSFILES_SECRETS_FILE || path.join(home, ".config", "dotsfiles", "tokens.json");
  let tokens: DotsfilesTokens = {};

  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      tokens = data.tokens || data;
    } catch (e) {
      console.error(`[dotsfiles-secrets] Error leyendo ${configPath}:`, e);
    }
  }

  // Fallback a process.env
  return new Proxy(tokens, {
    get: (target, prop: string) => target[prop] || process.env[prop],
  });
}

import * as fs from "node:fs";
import * as path from "node:path";

export interface OpenSpecStatus {
  hasOpenSpec: boolean;
  schema: string;
  specsCount: number;
  specsList: string[];
  changesCount: number;
  changesList: string[];
}

export interface GraphifyStatus {
  hasGraphify: boolean;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  topHubs: string[];
}

export interface SpecGraphData {
  openSpec: OpenSpecStatus;
  graphify: GraphifyStatus;
}

export class SpecGraphWatcher {
  private cwd: string;
  private data: SpecGraphData = {
    openSpec: {
      hasOpenSpec: false,
      schema: "none",
      specsCount: 0,
      specsList: [],
      changesCount: 0,
      changesList: [],
    },
    graphify: {
      hasGraphify: false,
      nodeCount: 0,
      edgeCount: 0,
      communityCount: 0,
      topHubs: [],
    },
  };

  private pollInterval?: NodeJS.Timeout;
  private listeners: Array<() => void> = [];

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  public async init(): Promise<void> {
    await this.refresh();
    // Poll every 8 seconds for spec or graph updates
    this.pollInterval = setInterval(() => {
      this.refresh().catch(() => {});
    }, 8000);
  }

  public getData(): SpecGraphData {
    return {
      openSpec: {
        ...this.data.openSpec,
        specsList: [...this.data.openSpec.specsList],
        changesList: [...this.data.openSpec.changesList],
      },
      graphify: {
        ...this.data.graphify,
        topHubs: [...this.data.graphify.topHubs],
      },
    };
  }

  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async refresh(): Promise<void> {
    this.refreshOpenSpec();
    this.refreshGraphify();
    this.notify();
  }

  private refreshOpenSpec(): void {
    const openSpecDir = path.join(this.cwd, "openspec");
    if (!fs.existsSync(openSpecDir)) {
      this.data.openSpec.hasOpenSpec = false;
      return;
    }

    this.data.openSpec.hasOpenSpec = true;
    const configPath = path.join(openSpecDir, "config.yaml");
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf8");
        const match = raw.match(/schema:\s*([^\s#]+)/);
        this.data.openSpec.schema = match ? match[1] : "spec-driven";
      } catch {
        this.data.openSpec.schema = "spec-driven";
      }
    }

    // Read specs
    const specsDir = path.join(openSpecDir, "specs");
    if (fs.existsSync(specsDir)) {
      try {
        const entries = fs.readdirSync(specsDir, { withFileTypes: true });
        const list = entries
          .filter((e) => e.isDirectory() || e.name.endsWith(".md"))
          .map((e) => e.name.replace(/\.md$/, ""));
        this.data.openSpec.specsCount = list.length;
        this.data.openSpec.specsList = list;
      } catch {
        this.data.openSpec.specsCount = 0;
        this.data.openSpec.specsList = [];
      }
    }

    // Read changes
    const changesDir = path.join(openSpecDir, "changes");
    if (fs.existsSync(changesDir)) {
      try {
        const entries = fs.readdirSync(changesDir, { withFileTypes: true });
        const list = entries
          .filter((e) => e.isDirectory() || e.name.endsWith(".md"))
          .map((e) => e.name.replace(/\.md$/, ""));
        this.data.openSpec.changesCount = list.length;
        this.data.openSpec.changesList = list;
      } catch {
        this.data.openSpec.changesCount = 0;
        this.data.openSpec.changesList = [];
      }
    }
  }

  private refreshGraphify(): void {
    const graphifyOut = path.join(this.cwd, "graphify-out");
    const graphJson = path.join(graphifyOut, "graph.json");

    if (!fs.existsSync(graphJson)) {
      this.data.graphify.hasGraphify = false;
      return;
    }

    try {
      this.data.graphify.hasGraphify = true;
      const content = fs.readFileSync(graphJson, "utf8");
      const parsed = JSON.parse(content);

      const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const edges = Array.isArray(parsed.edges)
        ? parsed.edges
        : Array.isArray(parsed.links)
        ? parsed.links
        : [];

      this.data.graphify.nodeCount = nodes.length;
      this.data.graphify.edgeCount = edges.length;

      // Check analysis file for communities
      const analysisJson = path.join(graphifyOut, ".graphify_analysis.json");
      if (fs.existsSync(analysisJson)) {
        try {
          const analysis = JSON.parse(fs.readFileSync(analysisJson, "utf8"));
          if (analysis.communities) {
            this.data.graphify.communityCount = Object.keys(analysis.communities).length;
          }
        } catch {
          // ignore
        }
      }

      // Compute degree count for top hubs
      const degreeMap: Record<string, number> = {};
      for (const e of edges) {
        const src = e.source?.id || e.source;
        const tgt = e.target?.id || e.target;
        if (src) degreeMap[src] = (degreeMap[src] || 0) + 1;
        if (tgt) degreeMap[tgt] = (degreeMap[tgt] || 0) + 1;
      }

      const sortedHubs = Object.entries(degreeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name} (${count})`);

      this.data.graphify.topHubs = sortedHubs;
    } catch {
      this.data.graphify.hasGraphify = false;
    }
  }

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }

  public dispose(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.listeners = [];
  }
}

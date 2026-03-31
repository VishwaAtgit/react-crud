const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'architecture-manifest.json');
const DIAGRAM_PATH = path.join(DOCS_DIR, 'architecture.md');

/** Recursively collect all .js files under a directory */
function collectFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, fileList);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      fileList.push(full);
    }
  }
  return fileList;
}

/** Extract import/require targets from file contents */
function extractDependencies(filePath, srcDir) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const deps = [];
  const patterns = [
    /import\s+.*?from\s+['"](.+?)['"]/g,
    /import\s+['"](.+?)['"]/g,
    /require\(\s*['"](.+?)['"]\s*\)/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const target = m[1];
      if (target.startsWith('.')) {
        const resolved = path.resolve(path.dirname(filePath), target);
        let rel = path.relative(srcDir, resolved).replace(/\\/g, '/');
        // If the resolved path doesn't exist as-is, try common extensions
        if (!fs.existsSync(resolved)) {
          const exts = ['.js', '.jsx', '.ts', '.tsx'];
          for (const ext of exts) {
            if (fs.existsSync(resolved + ext)) {
              rel = path.relative(srcDir, resolved + ext).replace(/\\/g, '/');
              break;
            }
          }
        }
        deps.push(rel);
      }
    }
  }
  return deps;
}

/** Build the full dependency graph as { nodes: [...], edges: [...] } */
function buildGraph(srcDir) {
  const files = collectFiles(srcDir);
  const nodes = [];
  const edges = [];

  for (const file of files) {
    const rel = path.relative(srcDir, file).replace(/\\/g, '/');
    nodes.push(rel);
    const deps = extractDependencies(file, srcDir);
    for (const dep of deps) {
      edges.push({ from: rel, to: dep });
    }
  }
  return { nodes: nodes.sort(), edges };
}

/** Render graph as a Mermaid flowchart string */
function renderMermaid(graph) {
  const sanitize = (s) => s.replace(/[\/\.\-]/g, '_');
  let md = '# Architecture Diagram\n\n';
  md += '> Auto-generated — do not edit by hand.  \n';
  md += `> Last updated: ${new Date().toISOString()}\n\n`;
  md += '```mermaid\nflowchart LR\n';
  for (const node of graph.nodes) {
    md += `  ${sanitize(node)}["${node}"]\n`;
  }
  for (const { from, to } of graph.edges) {
    md += `  ${sanitize(from)} --> ${sanitize(to)}\n`;
  }
  md += '```\n';
  return md;
}

/** Main entry — callable from CLI or programmatically */
function generate(srcDir = SRC_DIR, docsDir = DOCS_DIR) {
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const manifestPath = path.join(docsDir, 'architecture-manifest.json');
  const diagramPath = path.join(docsDir, 'architecture.md');

  const graph = buildGraph(srcDir);
  const manifest = {
    generatedAt: new Date().toISOString(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    nodes: graph.nodes,
    edges: graph.edges
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(diagramPath, renderMermaid(graph));

  console.log(`✅  Architecture diagram written to ${diagramPath}`);
  console.log(`✅  Manifest written to ${manifestPath}`);
  return manifest;
}

// Allow direct CLI execution
if (require.main === module) {
  generate();
}

module.exports = { collectFiles, extractDependencies, buildGraph, renderMermaid, generate };
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'architecture-manifest.json');
const SUMMARY_PATH = path.join(DOCS_DIR, 'change-summary.md');

/** Compare two manifests and return structured delta */
function diffManifests(previous, current) {
  const prevNodes = new Set(previous.nodes || []);
  const curNodes = new Set(current.nodes || []);

  const addedNodes = [...curNodes].filter((n) => !prevNodes.has(n));
  const removedNodes = [...prevNodes].filter((n) => !curNodes.has(n));

  const edgeKey = (e) => `${e.from} -> ${e.to}`;
  const prevEdges = new Set((previous.edges || []).map(edgeKey));
  const curEdges = new Set((current.edges || []).map(edgeKey));

  const addedEdges = [...curEdges].filter((e) => !prevEdges.has(e));
  const removedEdges = [...prevEdges].filter((e) => !curEdges.has(e));

  return { addedNodes, removedNodes, addedEdges, removedEdges };
}

/** Render a change-summary markdown string */
function renderSummary(delta, prevDate, curDate) {
  let md = '# Architecture Change Summary\n\n';
  md += `> Comparing **${prevDate || 'unknown'}** → **${curDate || 'now'}**\n\n`;

  md += '## Modules\n\n';
  md += `| Added | Removed |\n|---|---|\n`;
  md += `| ${delta.addedNodes.length} | ${delta.removedNodes.length} |\n\n`;
  if (delta.addedNodes.length) md += '**Added modules:**\n' + delta.addedNodes.map((n) => `- \`${n}\``).join('\n') + '\n\n';
  if (delta.removedNodes.length) md += '**Removed modules:**\n' + delta.removedNodes.map((n) => `- \`${n}\``).join('\n') + '\n\n';

  md += '## Dependencies\n\n';
  md += `| Added | Removed |\n|---|---|\n`;
  md += `| ${delta.addedEdges.length} | ${delta.removedEdges.length} |\n\n`;
  if (delta.addedEdges.length) md += '**Added edges:**\n' + delta.addedEdges.map((e) => `- \`${e}\``).join('\n') + '\n\n';
  if (delta.removedEdges.length) md += '**Removed edges:**\n' + delta.removedEdges.map((e) => `- \`${e}\``).join('\n') + '\n\n';

  if (!delta.addedNodes.length && !delta.removedNodes.length && !delta.addedEdges.length && !delta.removedEdges.length) {
    md += '> No architecture changes detected.\n';
  }
  return md;
}

function run() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌  No manifest found. Run `npm run arch:generate` first.');
    process.exit(1);
  }

  const previous = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

  // Re-generate a fresh manifest for comparison
  const { generate } = require('./generate-architecture');
  const current = generate();

  const delta = diffManifests(previous, current);
  const summary = renderSummary(delta, previous.generatedAt, current.generatedAt);

  fs.writeFileSync(SUMMARY_PATH, summary);
  console.log(`✅  Change summary written to ${SUMMARY_PATH}`);
}

if (require.main === module) {
  run();
}

module.exports = { diffManifests, renderSummary };
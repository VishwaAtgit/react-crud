const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  collectFiles,
  extractDependencies,
  buildGraph,
  renderMermaid,
  generate
} = require('../../../scripts/generate-architecture');
const { diffManifests, renderSummary } = require('../../../scripts/architecture-diff');

describe('generate-architecture', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('collectFiles finds .js files recursively', () => {
    fs.mkdirSync(path.join(tmpDir, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'a.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'sub', 'b.jsx'), '');
    fs.writeFileSync(path.join(tmpDir, 'ignore.txt'), '');

    const files = collectFiles(tmpDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith('a.js'))).toBe(true);
    expect(files.some((f) => f.endsWith('b.jsx'))).toBe(true);
  });

  test('extractDependencies parses ES imports and require()', () => {
    const file = path.join(tmpDir, 'index.js');
    fs.writeFileSync(
      file,
      `import App from './App';\nconst store = require('./store');\nimport './side-effect';\nimport React from 'react';\n`
    );
    const deps = extractDependencies(file, tmpDir);
    expect(deps).toContain('App');
    expect(deps).toContain('store');
    expect(deps).toContain('side-effect');
    // 'react' is external, should NOT appear
    expect(deps).not.toContain('react');
  });

  test('buildGraph returns correct nodes and edges', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.js'), `import App from './App';`);
    fs.writeFileSync(path.join(tmpDir, 'App.js'), `import './App.css';`);

    const graph = buildGraph(tmpDir);
    expect(graph.nodes).toContain('index.js');
    expect(graph.nodes).toContain('App.js');
    expect(graph.edges).toContainEqual({ from: 'index.js', to: 'App.js' });
  });

  test('renderMermaid produces valid mermaid block', () => {
    const graph = { nodes: ['index.js'], edges: [] };
    const md = renderMermaid(graph);
    expect(md).toContain('```mermaid');
    expect(md).toContain('flowchart LR');
    expect(md).toContain('index_js["index.js"]');
  });

  test('generate writes diagram and manifest to docs dir', () => {
    const docsDir = path.join(tmpDir, 'docs');
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'entry.js'), `import './helper';`);
    fs.writeFileSync(path.join(srcDir, 'helper.js'), '');

    const manifest = generate(srcDir, docsDir);

    expect(manifest.nodeCount).toBe(2);
    expect(manifest.edgeCount).toBe(1);
    expect(fs.existsSync(path.join(docsDir, 'architecture.md'))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, 'architecture-manifest.json'))).toBe(true);
  });
});

describe('architecture-diff', () => {
  test('diffManifests detects added and removed nodes', () => {
    const prev = { nodes: ['a.js', 'b.js'], edges: [] };
    const cur = { nodes: ['a.js', 'c.js'], edges: [] };
    const delta = diffManifests(prev, cur);
    expect(delta.addedNodes).toEqual(['c.js']);
    expect(delta.removedNodes).toEqual(['b.js']);
  });

  test('diffManifests detects added and removed edges', () => {
    const prev = { nodes: [], edges: [{ from: 'a', to: 'b' }] };
    const cur = { nodes: [], edges: [{ from: 'a', to: 'c' }] };
    const delta = diffManifests(prev, cur);
    expect(delta.addedEdges).toEqual(['a -> c']);
    expect(delta.removedEdges).toEqual(['a -> b']);
  });

  test('diffManifests reports no changes for identical manifests', () => {
    const manifest = { nodes: ['x.js'], edges: [{ from: 'x', to: 'y' }] };
    const delta = diffManifests(manifest, manifest);
    expect(delta.addedNodes).toHaveLength(0);
    expect(delta.removedNodes).toHaveLength(0);
    expect(delta.addedEdges).toHaveLength(0);
    expect(delta.removedEdges).toHaveLength(0);
  });

  test('renderSummary contains "No architecture changes" when empty', () => {
    const delta = { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [] };
    const md = renderSummary(delta, 'then', 'now');
    expect(md).toContain('No architecture changes detected');
  });

  test('renderSummary lists added modules', () => {
    const delta = { addedNodes: ['new.js'], removedNodes: [], addedEdges: [], removedEdges: [] };
    const md = renderSummary(delta, 'then', 'now');
    expect(md).toContain('`new.js`');
    expect(md).toContain('Added modules');
  });
});
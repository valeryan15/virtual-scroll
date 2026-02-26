import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const reactVersionArgIndex = process.argv.findIndex((arg) => arg === '--react');
const reactVersion = reactVersionArgIndex > -1 ? process.argv[reactVersionArgIndex + 1] : undefined;
const expectArgIndex = process.argv.findIndex((arg) => arg === '--expect');
const expectMode = expectArgIndex > -1 ? process.argv[expectArgIndex + 1] : 'supported';

if (!reactVersion) {
  throw new Error('Missing required argument: --react <version>');
}

if (expectMode !== 'supported' && expectMode !== 'unsupported') {
  throw new Error('Invalid --expect value. Use supported or unsupported');
}

const major = Number.parseInt(reactVersion.split('.')[0] ?? '', 10);
if (!Number.isFinite(major)) {
  throw new Error(`Invalid React version: ${reactVersion}`);
}

const typesVersionByMajor = {
  16: { react: '16.14.67', reactDom: '16.9.25' },
  17: { react: '17.0.90', reactDom: '17.0.26' },
  18: { react: '18.3.12', reactDom: '18.3.7' },
  19: { react: '19.2.10', reactDom: '19.2.3' },
};

const typesVersion = typesVersionByMajor[major];
if (!typesVersion) {
  throw new Error(`Unsupported React major version for smoke test: ${major}`);
}

const run = (cmd, args, cwd) => {
  execFileSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
};

const packOutput = execFileSync('npm', ['pack', '--json', '--silent', '--ignore-scripts'], {
  cwd: repoRoot,
  env: process.env,
})
  .toString()
  .trim();

const parsedPackOutput = JSON.parse(packOutput);
const packFileName = parsedPackOutput[0]?.filename;
if (!packFileName) {
  throw new Error('Failed to resolve npm pack filename');
}

const packFilePath = join(repoRoot, packFileName);
const fixtureDir = mkdtempSync(join(tmpdir(), `virtual-scroll-react-${major}-`));

try {
  run('yarn', ['init', '-yp'], fixtureDir);
  run(
    'yarn',
    [
      'add',
      `react@${reactVersion}`,
      `react-dom@${reactVersion}`,
      `@types/react@${typesVersion.react}`,
      `@types/react-dom@${typesVersion.reactDom}`,
      'typescript@5.9.3',
      packFilePath,
    ],
    fixtureDir,
  );

  writeFileSync(
    join(fixtureDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          jsx: 'react',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['compat-smoke.tsx'],
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(fixtureDir, 'compat-smoke.tsx'),
    [
      "import React from 'react';",
      "import { VirtualGrid, VirtualList } from '@valeryan15/virtual-scroll';",
      '',
      'const list = (',
      '  <VirtualList',
      '    items={[{ id: 1, label: "Item 1" }, { id: 2, label: "Item 2" }]}',
      '    itemKey={(item: { id: number; label: string }) => item.id}',
      '    renderItem={({ item }: { item: { id: number; label: string } }) => <div>{item.label}</div>}',
      "    layout={{ sizeMode: 'fixed', itemSize: 20 }}",
      '  />',
      ');',
      '',
      'const grid = (',
      '  <VirtualGrid',
      '    rowCount={2}',
      '    columnCount={2}',
      "    rows={{ sizeMode: 'fixed', itemSize: 20 }}",
      "    columns={{ sizeMode: 'fixed', itemSize: 30 }}",
      '    renderCell={({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => <div>{`${rowIndex}:${columnIndex}`}</div>}',
      '  />',
      ');',
      '',
      'void list;',
      'void grid;',
      '',
    ].join('\n'),
  );

  writeFileSync(
    join(fixtureDir, 'runtime-smoke.cjs'),
    [
      "const React = require('react');",
      "const { renderToString } = require('react-dom/server');",
      "const { VirtualList } = require('@valeryan15/virtual-scroll');",
      '',
      'const html = renderToString(',
      '  React.createElement(VirtualList, {',
      '    items: [{ id: 1, label: "Item 1" }, { id: 2, label: "Item 2" }],',
      '    itemKey: (item) => item.id,',
      '    renderItem: ({ item }) => React.createElement("div", null, item.label),',
      '    layout: { sizeMode: "fixed", itemSize: 20 },',
      '  })',
      ');',
      '',
      'if (!html.includes("Item 1")) {',
      '  throw new Error("VirtualList SSR output mismatch");',
      '}',
      '',
      `console.log('react ${reactVersion} runtime smoke ok');`,
      '',
    ].join('\n'),
  );

  let smokeError;

  try {
    run('yarn', ['tsc', '--project', 'tsconfig.json'], fixtureDir);
    run('node', ['runtime-smoke.cjs'], fixtureDir);
  } catch (error) {
    smokeError = error;
  }

  if (expectMode === 'supported' && smokeError) {
    throw smokeError;
  }

  if (expectMode === 'unsupported' && !smokeError) {
    throw new Error(`React ${reactVersion} unexpectedly passed compatibility smoke`);
  }

  if (expectMode === 'unsupported') {
    console.log(`react ${reactVersion} unsupported as expected`);
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
  try {
    unlinkSync(packFilePath);
  } catch {
    // noop
  }
}

import ts from 'typescript'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = mkdtempSync(join(tmpdir(), 'hisab-tests-'))
try {
  for (const [source, target] of [['src/model.ts', 'model.mjs'], ['tests/model.test.ts', 'model.test.mjs']]) {
    const code = readFileSync(source, 'utf8').replace('../src/model.ts', './model.mjs')
    const { outputText } = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
    writeFileSync(join(directory, target), outputText)
  }
  const result = spawnSync(process.execPath, [join(directory, 'model.test.mjs')], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally { rmSync(directory, { recursive: true, force: true }) }

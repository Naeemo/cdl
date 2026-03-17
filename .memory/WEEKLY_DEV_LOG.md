[2026-03-17T11:29:36.235Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:29:36.236Z] [INFO] 
📦 Phase 1: Building packages
[2026-03-17T11:29:36.237Z] [CMD] Running: Build all packages
[2026-03-17T11:29:39.106Z] [ERROR] ✗ Build all packages failed: Command failed: pnpm -r build
[2026-03-17T11:29:39.106Z] [FATAL] 
❌ Weekly development failed: Command failed: pnpm -r build
[2026-03-17T11:34:03.238Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:34:03.239Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:34:03.239Z] [CMD] Running: Build core packages
[2026-03-17T11:34:05.549Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:34:05.549Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:34:05.550Z] [TEST] ❌ Compiler test exception: Cannot find module './packages/compiler/dist/compiler.js'
Require stack:
- /root/.openclaw/workspace/scripts/cdl-weekly-dev.js
[2026-03-17T11:34:05.550Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:34:05.550Z] [TEST] ❌ Renderer test exception: Cannot find module './packages/renderer/dist/index.js'
Require stack:
- /root/.openclaw/workspace/scripts/cdl-weekly-dev.js
[2026-03-17T11:34:05.550Z] [INFO] 
📝 Phase 4: Counting examples
[2026-03-17T11:34:05.551Z] [STATS] ❌ Example count failed: ENOENT: no such file or directory, scandir 'examples'
[2026-03-17T11:34:05.551Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:34:05.551Z] [PUBLISH] ❌ NPM check failed: ENOENT: no such file or directory, scandir 'packages'
[2026-03-17T11:34:05.551Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:34:05.559Z] [CMD] Running: Stage changes

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
[2026-03-17T11:34:05.563Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:34:05.563Z] [CMD] Running: Commit changes
[2026-03-17T11:34:05.574Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:34:05.574Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ❌ Failed
- Renderer: ❌ Failed

### Content
- Examples: 0 categories, 0 files
- NPM ready: 0/0 packages

### Git
- Status: committed

### ⚠️ Issues
- Compiler test exception
- Renderer test exception
- Example count failed
- NPM check failed

### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:34:05.574Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:34:15.810Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:34:15.811Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:34:15.811Z] [CMD] Running: Build core packages
[2026-03-17T11:34:18.097Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:34:18.097Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:34:18.100Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:34:18.101Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:34:18.102Z] [TEST] ❌ Renderer test: invalid output
[2026-03-17T11:34:18.102Z] [INFO] 
📝 Phase 4: Counting examples
[2026-03-17T11:34:18.103Z] [STATS] ✅ Found 8 categories, 7 examples
[2026-03-17T11:34:18.103Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:34:18.104Z] [PUBLISH] ✅ 7/13 packages publish-ready
[2026-03-17T11:34:18.104Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:34:18.110Z] [CMD] Running: Stage changes
[2026-03-17T11:34:18.113Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:34:18.113Z] [CMD] Running: Commit changes
[2026-03-17T11:34:18.118Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:34:18.118Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ❌ Failed

### Content
- Examples: 8 categories, 7 files
- NPM ready: 7/13 packages

### Git
- Status: committed

### ⚠️ Issues
- Renderer test failed

### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:34:18.119Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:34:32.458Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:34:32.459Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:34:32.459Z] [CMD] Running: Build core packages
[2026-03-17T11:34:34.752Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:34:34.752Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:34:34.756Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:34:34.756Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:34:34.757Z] [TEST] ✅ Renderer test passed
[2026-03-17T11:34:34.757Z] [INFO] 
📝 Phase 4: Counting examples
[2026-03-17T11:34:34.758Z] [STATS] ✅ Found 8 categories, 7 examples
[2026-03-17T11:34:34.758Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:34:34.759Z] [PUBLISH] ✅ 7/13 packages publish-ready
[2026-03-17T11:34:34.759Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:34:34.765Z] [CMD] Running: Stage changes

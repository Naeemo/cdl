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
[2026-03-17T11:34:34.769Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:34:34.769Z] [CMD] Running: Commit changes
[2026-03-17T11:34:34.774Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:34:34.774Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ✅ Passed

### Content
- Examples: 8 categories, 7 files
- NPM ready: 7/13 packages

### Git
- Status: committed


### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:34:34.774Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:49:21.864Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:49:21.865Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:49:21.865Z] [CMD] Running: Build core packages
[2026-03-17T11:49:24.150Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:49:24.150Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:49:24.154Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:49:24.154Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:49:24.155Z] [TEST] ✅ Renderer test passed
[2026-03-17T11:49:24.155Z] [INFO] 
📝 Phase 4: Counting examples
[2026-03-17T11:49:24.156Z] [STATS] ✅ Found 8 categories, 7 examples
[2026-03-17T11:49:24.156Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:49:24.157Z] [PUBLISH] ✅ 8/14 packages publish-ready
[2026-03-17T11:49:24.157Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:49:24.166Z] [CMD] Running: Stage changes
[2026-03-17T11:49:24.174Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:49:24.174Z] [CMD] Running: Commit changes
[2026-03-17T11:49:24.185Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:49:24.185Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ✅ Passed

### Content
- Examples: 8 categories, 7 files
- NPM ready: 8/14 packages

### Git
- Status: committed


### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:49:24.185Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:50:16.539Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:50:16.540Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:50:16.540Z] [CMD] Running: Build core packages
[2026-03-17T11:50:18.819Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:50:18.819Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:50:18.822Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:50:18.822Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:50:18.824Z] [TEST] ✅ Renderer test passed
[2026-03-17T11:50:18.824Z] [INFO] 
📝 Phase 4: Generating new examples
[2026-03-17T11:50:18.825Z] [CMD] Running: Generate examples
[2026-03-17T11:50:18.842Z] [GEN] ❌ Example generation failed: start is not defined
[2026-03-17T11:50:18.842Z] [INFO] 
📚 Phase 5: Expanding PROMPT.md
[2026-03-17T11:50:18.842Z] [DOCS] ✅ Expanded PROMPT.md (3245 → 4419 bytes)
[2026-03-17T11:50:18.842Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:50:18.843Z] [PUBLISH] ✅ 8/14 packages publish-ready
[2026-03-17T11:50:18.844Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:50:18.849Z] [CMD] Running: Stage changes
[2026-03-17T11:50:18.853Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:50:18.853Z] [CMD] Running: Commit changes
[2026-03-17T11:50:18.860Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:50:18.860Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ✅ Passed

### Content
- Examples: 0 categories, 0 files
- NPM ready: 8/14 packages

### Git
- Status: committed

### ⚠️ Issues
- Example generation failed

### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:50:18.860Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:50:42.076Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:50:42.078Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:50:42.078Z] [CMD] Running: Build core packages
[2026-03-17T11:50:44.394Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:50:44.394Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:50:44.397Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:50:44.397Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:50:44.400Z] [TEST] ✅ Renderer test passed
[2026-03-17T11:50:44.400Z] [INFO] 
📝 Phase 4: Generating new examples
[2026-03-17T11:50:44.401Z] [CMD] Running: Generate examples
[2026-03-17T11:50:44.418Z] [GEN] ❌ Example generation failed: start is not defined
[2026-03-17T11:50:44.418Z] [INFO] 
📚 Phase 5: Expanding PROMPT.md
[2026-03-17T11:50:44.418Z] [DOCS] ✅ Expanded PROMPT.md (4419 → 5593 bytes)
[2026-03-17T11:50:44.418Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:50:44.419Z] [PUBLISH] ✅ 8/14 packages publish-ready
[2026-03-17T11:50:44.419Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:50:44.425Z] [CMD] Running: Stage changes
[2026-03-17T11:50:44.429Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:50:44.429Z] [CMD] Running: Commit changes
[2026-03-17T11:50:44.435Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:50:44.435Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ✅ Passed

### Content
- Examples: 0 categories, 0 files
- NPM ready: 8/14 packages

### Git
- Status: committed

### ⚠️ Issues
- Example generation failed

### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:50:44.435Z] [DONE] 
✅ Weekly development completed!
[2026-03-17T11:51:00.567Z] [INFO] === CDL Weekly Development Started ===
[2026-03-17T11:51:00.568Z] [INFO] 
📦 Phase 1: Building core packages
[2026-03-17T11:51:00.568Z] [CMD] Running: Build core packages
[2026-03-17T11:51:02.877Z] [SUCCESS] ✓ Build core packages completed (2.3s)
[2026-03-17T11:51:02.877Z] [INFO] 
🧪 Phase 2: Testing compiler
[2026-03-17T11:51:02.882Z] [TEST] ✅ Compiler test passed
[2026-03-17T11:51:02.882Z] [INFO] 
🎨 Phase 3: Testing renderer
[2026-03-17T11:51:02.883Z] [TEST] ✅ Renderer test passed
[2026-03-17T11:51:02.883Z] [INFO] 
📝 Phase 4: Generating new examples
[2026-03-17T11:51:02.884Z] [CMD] Running: Generate examples
[2026-03-17T11:51:02.908Z] [SUCCESS] ✓ Generate examples completed (0.0s)
[2026-03-17T11:51:02.908Z] [GEN] ✅ Generated 15 new examples
[2026-03-17T11:51:02.909Z] [STATS] 📊 Total examples now: 22
[2026-03-17T11:51:02.909Z] [INFO] 
📚 Phase 5: Expanding PROMPT.md
[2026-03-17T11:51:02.909Z] [DOCS] ✅ PROMPT.md already substantial (5593 bytes)
[2026-03-17T11:51:02.909Z] [INFO] 
📦 Phase 5: NPM publish check
[2026-03-17T11:51:02.910Z] [PUBLISH] ✅ 8/14 packages publish-ready
[2026-03-17T11:51:02.910Z] [INFO] 
📦 Phase 6: Git operations
[2026-03-17T11:51:02.915Z] [CMD] Running: Stage changes
[2026-03-17T11:51:02.921Z] [SUCCESS] ✓ Stage changes completed (0.0s)
[2026-03-17T11:51:02.921Z] [CMD] Running: Commit changes
[2026-03-17T11:51:02.928Z] [SUCCESS] ✓ Commit changes completed (0.0s)
[2026-03-17T11:51:02.928Z] [GIT] ✓ Changes committed


## 📊 Weekly Development Summary

**Date**: 2026-03-17

### Build Status
- Core packages: ✅ Built
- Duration: 2.3s

### Tests
- Compiler: ✅ Passed
- Renderer: ✅ Passed

### Content
- Examples: 21 categories, 22 files
- NPM ready: 8/14 packages

### Git
- Status: committed


### 🎯 Next Week
- [ ] Fix Vue package build compatibility
- [ ] Publish NPM packages (after secrets configured)
- [ ] Add React/Vue component wrappers
- [ ] Expand chart type coverage from ECharts 5.x
- [ ] Improve NL-to-CDL accuracy

*Auto-generated weekly report*
[2026-03-17T11:51:02.928Z] [DONE] 
✅ Weekly development completed!

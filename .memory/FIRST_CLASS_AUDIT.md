# CDL First-Class-for-AI-Agents Audit

## What "First Class" Actually Means

### 🎯 Criteria (AI Agent Perspective)

1. **Zero Cognitive Load** - AI agent understands CDL instantly, no confusion
2. **Perfect NL→CDL** - Natural language → valid CDL on first try (>95% accuracy)
3. **Rich Examples** - 100+ examples covering every common chart scenario
4. **Bulletproof Errors** - Compiler errors tell exactly what's wrong and how to fix
5. **Tool Ecosystem** - MCP, CLI, NPM packages all published and working
6. **Documentation** - AI-friendly reference that agents can parse
7. **Test Coverage** - Comprehensive tests proving reliability
8. **Performance** - Sub-10ms compile time for typical charts
9. **Community** - Templates, prompt library, real-world usage
10. **Maintenance** - Active development, quick bug fixes

---

## Current State (2026-03-16)

| Criterion | Status | Score | Notes |
|-----------|--------|-------|-------|
| Zero Cognitive Load | 🟡 | 6/10 | Syntax clean but Chart { } support was broken (now fixed) |
| Perfect NL→CDL | 🔴 | 3/10 | No NL→CDL tool in MCP, prompt minimal (2KB) |
| Rich Examples | 🔴 | 2/10 | Only 7 examples across 8 categories |
| Bulletproof Errors | 🟡 | 5/10 | Basic errors, no context/help |
| Tool Ecosystem | 🟡 | 5/10 | MCP defined but not tested, CLI broken, NPM not published |
| Documentation | 🟡 | 6/10 | VitePress exists but may be outdated |
| Test Coverage | 🔴 | 1/10 | No visible test files |
| Performance | 🟢 | 8/10 | Compile fast (tested) |
| Community | 🔴 | 0/10 | No templates, no prompt library |
| Maintenance | 🟢 | 7/10 | Git active, roadmap exists |

**Overall: 🟡 4.2/10** - Good foundation, far from "first class"

---

## Gap Analysis

### Critical Gaps (Blockers for AI-First)

1. **NL-to-CDL is not production-ready**
   - No actual implementation in MCP? `generate_cdl` tool exists but is it implemented?
   - Prompt template is only 2KB - far too small for reliable generation
   - No prompt library for common scenarios

2. **Examples are sparse**
   - 7 examples total means AI agents have almost nothing to learn from
   - Need at least 100 examples across 20+ categories
   - Missing real-world datasets (finance, healthcare, e-commerce, etc.)

3. **Testing = none**
   - No unit tests visible
   - No integration tests
   - No AI accuracy benchmarks
   - Can't prove reliability

4. **Distribution not ready**
   - NPM packages not published (only 7/13 ready)
   - GitHub Actions not configured (need secrets)
   - VS Code extension not published
   - CLI broken (Node.js compatibility issues)

5. **Error messages not AI-friendly**
   - Just line/column, no suggestions
   - No "did you mean" or example fixes
   - No context about what was expected

---

## Path to First Class (12-Week Sprint)

### Week 1-2: Foundation Fixes ✅ (Done)
- [x] Fix Chart { } parser (was broken, now fixed)
- [x] Build core packages (compiler, renderer, ai)
- [x] Test basic pipeline

### Week 3-4: Testing & Quality
- [ ] Add unit tests for compiler (target: 80% coverage)
- [ ] Add integration tests (compile+render)
- [ ] Add AI accuracy benchmark (test 50 NL queries)
- [ ] Fix all TypeScript errors in all packages

### Week 5-6: Examples Blitz
- [ ] Generate 50 new examples covering:
  - All 16 chart types × 3 variations each = 48
  - 10 real-world datasets (sales, finance, weather, social media, etc.)
- [ ] Add example metadata (tags, difficulty, use case)
- [ ] Create example index/catalog

### Week 7-8: Prompt Engineering
- [ ] Expand PROMPT.md to 10KB+ with:
  - Comprehensive syntax reference
  - Common patterns & anti-patterns
  - Edge cases and how to handle them
  - Conversion guide from other DSLs
- [ ] Create prompt library (20+ common requests)
- [ ] Add few-shot examples to MCP generate_cdl

### Week 9-10: Distribution
- [ ] Configure GitHub Actions with Secrets (placeholder docs)
- [ ] Publish 7 core NPM packages
- [ ] Publish VS Code extension
- [ ] Fix CLI to work with Node 22
- [ ] Create Docker image for server

### Week 11-12: polish & Launch
- [ ] Improve error messages (add suggestions)
- [ ] Add "explain_cdl" MCP tool
- [ ] Create developer portal (quickstart, tutorials)
- [ ] Write blog post announcement
- [ ] Submit to ClawHub / SkillHub

---

## Success Metrics

- **NL→CDL accuracy**: >95% on benchmark suite (50 queries)
- **Test coverage**: >80% for compiler
- **Examples**: 100+ .cdl files across 20 categories
- **NPM downloads**: 100+ in first month (stretch)
- **MCP usage**: Agents successfully using it for chart tasks
- **Zero blocker bugs**: No parser crashes, no silent failures

---

## Immediate Actions (Next 48h)

1. **Fix compiler type errors** (done)
2. **Set up automated weekly dev** (done)
3. **Add unit test scaffolding** (next)
4. **Expand PROMPT.md with full reference**
5. **Generate 20 high-quality examples**
6. **Implement actual NL→CDL in MCP** (not just spec)

---

*This is the roadmap to "first class". Let's execute.*
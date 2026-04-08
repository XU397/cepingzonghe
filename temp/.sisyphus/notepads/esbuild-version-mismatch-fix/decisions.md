# Decisions

## 2026-02-09T02:57:33Z - Task 1: Boundary and Strategy Decisions

**Decision 1: Package Manager Strategy**

- **Chosen**: npm-only (v11.9.0)
- **Rationale**:
  - Existing package-lock.json uses npm format
  - README.md shows npm-first documentation
  - User explicitly requested "仅使用 npm，不混用 pnpm/yarn"
- **Implication**: Do not use pnpm or yarn in Tasks 2-4

**Decision 2: ESBUILD_BINARY_PATH Handling**

- **Chosen**: No environment cleanup needed
- **Rationale**: Variable is EMPTY, no override detected
- **Implication**: Task 2 can proceed directly to node_modules deletion

**Decision 3: Lockfile Regeneration Strategy**

- **Chosen**: Allow package-lock.json to be regenerated
- **Rationale**:
  - Current mismatch indicates corrupted state
  - Clean install is the most reliable fix
  - Plan explicitly allows "清理并重装依赖（允许 lock 重建）"
- **Implication**: Delete existing lock, let npm generate fresh one

**Decision 4: Evidence Collection**

- **Chosen**: Save full command output with timestamps
- **Rationale**: Enables post-mortem analysis if issues persist
- **Implication**: All Task 1-4 evidence stored in .sisyphus/evidence/

**Decision 5: Verification Approach**

- **Chosen**: Automated assertions, no manual steps
- **Rationale**: Follows "UNIVERSAL RULE: ZERO HUMAN INTERVENTION" from plan
- **Implication**: All acceptance criteria must be programmatically verified

**Next Task (Task 2) Dependencies:**

- Baseline confirmed: Node v22.19.0, npm 11.9.0, registry OK
- ESBUILD_BINARY_PATH confirmed: EMPTY (no cleanup needed)
- Strategy confirmed: npm-only, allow lockfile regeneration
- Ready to proceed: Delete node_modules + package-lock.json, run npm install

## 2026-02-09T03:07:03Z - Task 2: Reinstall Execution Decisions

**Decision 6: Delete Order**

- **Chosen**: Delete node_modules first, then package-lock.json
- **Rationale**:
  - Reduces risk of npm attempting to use corrupted node_modules
  - Ensures clean slate before new install
- **Implication**: None - both files deleted successfully

**Decision 7: Lockfile Regeneration Confirmed**

- **Chosen**: Let npm generate fresh package-lock.json
- **Rationale**:
  - Plan explicitly allows "允许 lock 重建"
  - Corrupted state requires fresh state
  - Prevents manual lockfile editing errors
- **Implication**: New lockfile timestamp 1770606380

**Decision 8: Non-Blocking Warnings Ignored**

- **Chosen**: Proceed to Task 3 despite deprecation/security warnings
- **Rationale**:
  - Primary goal is esbuild version alignment
  - Deprecated packages do not block dev server
  - Security fixes outside Task 2-4 scope (per plan)
- **Implication**: Task 3 will verify esbuild version specifically

**Decision 9: Evidence Documentation**

- **Chosen**: Full npm install output captured in evidence file
- **Rationale**:
  - Enables post-mortem if issues persist
  - Documents 543 package count and audit results
  - Captures exit code (0) for success confirmation
- **Implication**: .sisyphus/evidence/task-2-reinstall.txt created

**Next Task (Task 3) Dependencies:**

- Clean dependency tree: Ready
- package-lock.json: Freshly generated (timestamp 1770606380)
- Node modules: 543 packages installed
- Expected: npm run dev will show esbuild@0.18.20 alignment


## 2026-02-09T03:15:00Z - Task 3: Verification and Validation Decisions

**Decision 10: esbuild API Smoke Test Strategy**

- **Chosen**: Direct Node.js API test (`node -e "require('esbuild').transformSync(...)"`)
- **Rationale**:
  - Isolates esbuild from Vite layer
  - Tests core functionality directly
  - Returns explicit version number
  - Exit code clearly indicates success/failure
- **Implication**: Confirmed esbuild@0.18.20 is working correctly

**Decision 11: Dev Server Observation Window**

- **Chosen**: 20-second timeout observation window
- **Rationale**:
  - Sufficient for Vite to start and report status
  - Short enough to not waste resources
  - Captures Local address and any early errors
  - timeout command safely terminates long-running process
- **Implication**: Confirmed dev server starts successfully with no errors

**Decision 12: Strict Port and Host Configuration**

- **Chosen**: `--host 127.0.0.1 --port 5173 --strictPort`
- **Rationale**:
  - Prevents port conflicts (strictPort)
  - Binds to loopback interface for security (127.0.0.1)
  - Explicit port number for verification (5173)
  - Matches standard Vite conventions
- **Implication**: Confirmed service listens on exact requested address

**Decision 13: Success Criteria Definition**

- **Chosen**: Negative validation (what NOT to see)
- **Rationale**:
  - "Host version" error indicates original problem
  - "does not match binary version" indicates version conflict
  - Presence of Local address confirms successful startup
  - Exit code 0 confirms no errors
- **Implication**: All criteria met, version mismatch is resolved

**Decision 14: Task 4 Readiness Assessment**

- **Chosen**: Task 3 success enables Task 4 execution
- **Rationale**:
  - esbuild API verified working
  - Dev server confirmed functional
  - No blocking issues found
  - Version alignment complete
- **Implication**: Ready to proceed with `npm run build` verification

**Verification Summary:**

- esbuild API smoke test: PASS ✓
- Vite dev server startup: PASS ✓
- Version alignment (0.18.20): CONFIRMED ✓
- Mismatch errors: ABSENT ✓
- Task 3 completion: SUCCESS ✓

**Task 4 Dependencies:**

- esbuild functionality: Verified working
- Dev server capability: Confirmed functional
- Version alignment: Complete (0.18.20)
- Evidence files: Created and validated
- Notepad records: Appended with full documentation
- Ready to proceed: npm run build verification


## 2026-02-09T00:00:00Z - Task 4: Final Verification Decisions

**Decision 15: Build Verification Strategy**

- **Chosen**: Execute npm run build without code modifications
- **Rationale**:
  - Validates production build capability after dependency fix
  - Confirms esbuild functionality for production
  - No risk of introducing new issues (read-only verification)
- **Implication**: Build completed successfully in 20.70s

**Decision 16: Dependency Tree Analysis Approach**

- **Chosen**: Run `npm ls esbuild vite vitest --depth=3`
- **Rationale**:
  - Confirms esbuild version coexistence is intentional
  - Verifies no invalid/extraneous dependencies
  - Validates vitest dependencies are test-only
  - Depth 3 balances detail vs readability
- **Implication**: Confirmed 0.18.20 (production) vs 0.27.3 (test) coexistence

**Decision 17: Git Status Documentation**

- **Chosen**: Run `git status --porcelain` and document pre-existing changes
- **Rationale**:
  - Confirms Task 4 introduced zero new changes
  - Documents working directory state for transparency
  - Distinguishes plan-related vs. pre-existing changes
  - Prevents false attribution of issues
- **Implication**: ~400 pre-existing modified files documented, none from Task 4

**Decision 18: Dynamic Import Warning Handling**

- **Chosen**: Document as non-blocking performance optimization issue
- **Rationale**:
  - Warnings don't prevent successful build
  - Issue is code splitting optimization, not correctness
  - Fix requires architectural changes (dev page imports)
  - Outside Task 1-4 scope (version mismatch focus)
- **Implication**: Noted for future optimization work

**Decision 19: esbuild Version Coexistence Acceptance**

- **Chosen**: Accept 0.18.20 (production) + 0.27.3 (test) coexistence
- **Rationale**:
  - npm resolves dependencies correctly (no ELSPROBLEMS)
  - Production builds use 0.18.20 (intended version)
  - Test-only 0.27.3 doesn't affect production runtime
  - Aligning versions requires upgrading vitest or vite (out of scope)
- **Implication**: No action needed - this is expected dependency resolution

**Decision 20: Scope Closure Determination**

- **Chosen**: Close Task 4 with zero new changes introduced
- **Rationale**:
  - Primary objective (verify build after dependency fix) achieved
  - Strict adherence to "no code modifications" constraint
  - All acceptance criteria met (build, dependency tree, scope control)
  - Pre-existing changes don't affect Task 4 validity
- **Implication**: Task 4 and overall plan can be marked complete

**Task 4 Completion Summary:**

- Build verification: COMPLETE ✓
- Dependency analysis: COMPLETE ✓
- Scope validation: COMPLETE ✓
- Evidence documentation: COMPLETE ✓
- Notepad updates: COMPLETE ✓

**Plan Completion Readiness:**

- Task 1 (Baseline): COMPLETE
- Task 2 (Reinstall): COMPLETE
- Task 3 (esbuild verification): COMPLETE
- Task 4 (Build verification): COMPLETE
- All acceptance criteria met: YES
- Ready for final plan summary: YES

**Post-Plan Recommendations (Out of Scope):**

1. Address dynamic import warnings (code splitting optimization)
2. Upgrade deprecated packages (inflight, glob, rimraf, eslint)
3. Fix security vulnerabilities (npm audit fix)
4. Consider vitest/vite version alignment (if needed)
5. Clean up pre-existing working directory changes (separate effort)


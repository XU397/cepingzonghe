# Implementation Plan - REVISED SAFE APPROACH

## Overview

**⚠️ CRITICAL REVISION**: The original plan involving large-scale directory restructuring poses significant risks due to 379 relative path dependencies across 94 files. This revised plan uses a **non-breaking incremental approach** that adds modular functionality while preserving the existing codebase structure.

## Risk Assessment

**Current Dependency Complexity:**
- 172 `../` imports + 207 `./` imports = **379 path dependencies**
- **94 files** would need import path updates  
- Average **6-8 different import types** per page component
- Complex nested dependencies (Timer.jsx uses `../../context/AppContext`)
- Mixed static resource imports (some `import`, some string paths)

**High-Risk Areas:**
- Context provider chains
- Shared component references  
- Static asset paths (images, CSS modules)
- Utility function imports
- Hook dependencies

## Revised Implementation Strategy: "Facade Pattern + Gradual Migration"

- [ ] 1. Create module infrastructure WITHOUT moving files
  - Add new module system alongside existing structure (no file moves)
  - Create module registry as new additional files
  - Implement module interfaces as wrapper layer over existing components
  - Test module loading with existing file locations
  - *Requirements: 4.1, 6.1*

- [ ] 2. Implement URL-based module routing (overlay approach)
  - [ ] 2.1 Create module registry without file restructuring
    - Create `src/modules/ModuleRegistry.js` (new file, no moves)
    - Add URL to module mapping: "/seven-grade" -> existing PageRouter
    - Implement module interface as wrapper around existing components
    - Keep all existing imports and file locations unchanged
    - *Requirements: 6.1, 6.2*

  - [ ] 2.2 Create steamed-bun module wrapper
    - Create `src/modules/SteamedBunModule.js` (new file)
    - Wrap existing PageRouter and AppContext as module interface
    - Map existing pageMappings.js to module configuration format  
    - Preserve all existing page resume functionality
    - *Requirements: 3.2, 6.3*

  - [ ] 2.3 Add module configuration layer
    - Create `src/modules/ModuleConfig.js` with existing data mappings
    - Reference existing pageInfoMapping from utils/pageMappings.js
    - Add URL routing metadata without changing core logic
    - Ensure backward compatibility with current navigation
    - *Requirements: 4.1, 4.2*

- [ ] 3. Refactor authentication system for multi-module support
  - [ ] 3.1 Extract and enhance authentication context
    - Move authentication logic from AppContext to core/context/AuthContext.jsx
    - Update context to handle server response fields (batchCode, examNo, pageNum, url, schoolInfo)
    - Add module routing data management (assignedModuleUrl, currentPageNum)
    - Implement session management with module-aware state
    - *Requirements: 2.1, 2.2, 3.1*

  - [ ] 3.2 Update LoginPage component for module routing
    - Enhance LoginPage.jsx to parse new server response format
    - Add logic to extract URL routing information from login response
    - Implement automatic module redirection after successful authentication
    - Add error handling for invalid module URLs
    - *Requirements: 2.3, 3.3*

  - [ ] 3.3 Update API service for enhanced login response handling
    - Modify apiService.js loginUser function to handle new response format
    - Add response validation for required fields (url, pageNum, batchCode, etc.)
    - Implement proper error handling for missing module routing data
    - Maintain backward compatibility with existing API structure
    - *Requirements: 7.1, 7.2, 7.3*

- [ ] 4. Create module router system
  - [ ] 4.1 Implement central ModuleRouter component
    - Create ModuleRouter.jsx with URL-based module determination
    - Add determineModuleFromUrl function to map URLs to module IDs
    - Implement module loading with dynamic imports for code splitting
    - Add error boundaries and fallback components for module failures
    - *Requirements: 6.1, 6.2, 6.3*

  - [ ] 4.2 Integrate existing page resume functionality
    - Ensure existing getTargetPageIdFromPageNum function works with module system
    - Verify pageNum to pageId mapping transfers correctly to module configuration
    - Test module initialization with existing page resume logic
    - Ensure proper state restoration when resuming maintains current behavior
    - *Requirements: 3.2, 3.3*

  - [ ] 4.3 Integrate module router with App.jsx
    - Update App.jsx to use ModuleRouter instead of direct PageRouter
    - Ensure authentication context is properly passed to modules
    - Add loading states during module initialization
    - Test module switching and error recovery scenarios
    - *Requirements: 6.4*

- [ ] 5. Migrate steamed-bun module to new structure
  - [ ] 5.1 Create steamed-bun module directory structure
    - Create modules/steamed-bun/ directory with required subdirectories
    - Move existing pages/ components to modules/steamed-bun/pages/
    - Move module-specific components to modules/steamed-bun/components/
    - Create module entry point at modules/steamed-bun/index.js
    - *Requirements: 4.1, 4.3*

  - [ ] 5.2 Update page components to use shared components
    - Update all page component imports to use core/components/ paths
    - Ensure Timer, UserInfoBar, and navigation components work with new structure
    - Update CSS imports and module paths for relocated components
    - Test that all page components render correctly with new imports
    - *Requirements: 5.1, 5.2*

  - [ ] 5.3 Migrate module-specific context and utilities
    - Move steamed-bun specific context logic to modules/steamed-bun/context/
    - Migrate pageMappings.js and other utilities to modules/steamed-bun/utils/
    - Update utility function imports across steamed-bun module components
    - Ensure questionnaire and simulation data remain module-scoped
    - *Requirements: 4.3, 5.3*

  - [ ] 5.4 Implement steamed-bun module interface
    - Create modules/steamed-bun/index.js implementing AssessmentModule interface
    - Export ModuleComponent, moduleConfig, and other required properties
    - Add module-specific context providers and initialization logic
    - Integrate with existing PageRouter functionality within the module
    - *Requirements: 6.2, 6.3*

- [ ] 6. Update shared services for multi-module compatibility
  - [ ] 6.1 Enhance data logging service for module awareness
    - Update core/services/dataLogging.js to include module identification
    - Ensure LogEntry format maintains backward compatibility with existing API
    - Add module context to operation and answer logging
    - Test data submission with FormData format remains unchanged
    - *Requirements: 7.1, 7.2*

  - [ ] 6.2 Create shared API service layer
    - Extract common API functionality to core/services/apiService.js
    - Ensure login and saveHcMark endpoints work across all modules
    - Maintain existing RSA encryption and parameter formats
    - Add module-aware error handling and session management
    - *Requirements: 7.3, 7.4*

  - [ ] 6.3 Update configuration management
    - Ensure core/config/apiConfig.js works with module system
    - Add support for module-specific configuration overrides if needed
    - Maintain existing environment-based API configuration logic
    - Test production and development configurations work correctly
    - *Requirements: 8.1, 8.2*

- [ ] 7. Implement error handling and recovery systems
  - [ ] 7.1 Add module-level error boundaries
    - Create ErrorBoundary components for module isolation
    - Implement graceful degradation when modules fail to load
    - Add user-friendly error messages with retry mechanisms
    - Create fallback components for module loading failures
    - *Requirements: 6.4*

  - [ ] 7.2 Implement session and module recovery
    - Add logic to handle module routing failures
    - Implement session recovery when authentication expires
    - Add automatic retry logic for API communication failures
    - Ensure user can recover from module switching errors
    - *Requirements: 2.2, 3.3*

- [ ] 8. Testing and validation
  - [ ] 8.1 Create unit tests for core functionality
    - Write tests for ModuleRegistry registration and lookup
    - Test AuthContext with new server response format
    - Create tests for module interface validation
    - Add tests for URL to module mapping functionality
    - *Requirements: 6.1, 6.2*

  - [ ] 8.2 Add integration tests for module system
    - Test complete login to module loading flow
    - Verify page resume functionality works correctly
    - Test module switching and error recovery
    - Validate data logging works across different modules
    - *Requirements: 3.2, 3.3, 6.4*

  - [ ] 8.3 Create end-to-end tests for steamed-bun module
    - Test complete assessment flow from login to completion
    - Verify all existing functionality works in new module structure
    - Test timer functionality and questionnaire flow
    - Validate data submission maintains existing format
    - *Requirements: 7.1, 7.2, 7.4*

- [ ] 9. Build system and development workflow updates
  - [ ] 9.1 Update build configuration for module system
    - Ensure Vite builds all modules correctly with code splitting
    - Configure dynamic imports for module loading
    - Verify production builds maintain same output structure
    - Test development server works with new directory structure
    - *Requirements: 8.1, 8.2*

  - [ ] 9.2 Update development scripts and tooling
    - Ensure npm run dev, build, lint, preview commands work unchanged
    - Update ESLint configuration for new directory structure
    - Add module-specific linting rules if needed
    - Create module scaffolding tools for future development
    - *Requirements: 8.3, 8.4*

- [ ] 10. Documentation and deployment preparation
  - [ ] 10.1 Create module development documentation  
    - Document module interface requirements and best practices
    - Create guidelines for adding new assessment modules
    - Document URL routing and page resume functionality
    - Add troubleshooting guide for common module issues
    - *Requirements: 6.1, 6.2*

  - [ ] 10.2 Verify deployment compatibility
    - Test production builds deploy with same process
    - Verify API configuration works in production environment
    - Ensure existing deployment scripts and configurations work
    - Test that existing users can resume their assessments
    - *Requirements: 8.1, 8.2*

## Migration Strategy Notes

**Phase 1 (Tasks 1-4):** Establish core infrastructure and routing without breaking existing functionality
**Phase 2 (Tasks 5-6):** Migrate existing steamed-bun code to module structure  
**Phase 3 (Tasks 7-8):** Add robustness with error handling and comprehensive testing
**Phase 4 (Tasks 9-10):** Finalize build system and prepare for production deployment

Each task builds incrementally on previous work and maintains system functionality throughout the migration process. The modular approach ensures that if issues arise, the system can be rolled back to previous working states.
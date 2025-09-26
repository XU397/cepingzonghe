# QWEN.md

This file provides guidance to Qwen Code (Qwen3.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts Vite dev server on port 3000
- **Build**: `npm run build` - Creates production build
- **Lint**: `npm run lint` - Runs ESLint on JS/JSX files
- **Preview**: `npm run preview` - Previews production build

## Architecture Overview

This is a React-based educational assessment application for a "steamed bun" science inquiry task. The application manages a multi-page interactive learning experience with data logging, user authentication, and questionnaire components.

### Core Architecture Patterns

**State Management**: 
- Central state managed via `AppContext.jsx` with React Context API
- Persistent state using localStorage for session recovery
- Separate contexts for app state and data logging

**Page Navigation**:
- Custom routing system via `PageRouter.jsx` (not React Router)
- Page flow controlled by `currentPageId` state
- Protected routes require authentication
- Pages numbered P0-P28 with specific learning sequence

**Data Flow**:
- User interactions logged via `logOperation()` function
- Page data submitted via `submitPageData()` before navigation
- Backend API communication through `apiService.js`
- Real-time data logging to `/stu/saveHcMark` endpoint

### Key Components Structure

**Global State** (`src/context/AppContext.jsx`):
- Authentication state and user session management
- Task timer (40 minutes) and questionnaire timer (10 minutes)
- Page transition logic with automatic data submission
- Operation logging and answer collection systems

**API Layer** (`src/services/apiService.js`):
- Login endpoint: GET `/stu/login` with encrypted credentials
- Data submission: POST `/stu/saveHcMark` using FormData
- Environment-aware API configuration via `apiConfig.js`

**Page System**:
- Pages follow naming convention: `Page_XX_Description`
- Each page logs entry/exit events automatically
- Material reading pages (P4-P9) with modal components
- Simulation environment (P14-P17) with interactive components
- Questionnaire pages (P20-P28) with separate timing system

### Backend Integration

**Authentication**:
- Uses jsencrypt.ts for RSA password encryption
- Session-based authentication with localStorage persistence
- Automatic session recovery on page refresh
- Session timeout handling with re-login prompts

**Data Submission**:
- FormData format required for `/saveHcMark` endpoint
- Automatic page data submission before navigation
- Operation logging with timestamps and event types
- Answer collection for form inputs and selections

### Configuration

**Environment Setup**:
- Development: Uses Vite proxy to `/stu` endpoint
- Production: Configurable API modes (direct/proxy/sameOrigin)
- CORS handling via `vite.config.js` proxy configuration
- API configuration in `src/config/apiConfig.js`

### Development Notes

**Timer System**:
- Main task timer: 40 minutes total duration
- Questionnaire timer: 10 minutes separate timing
- Automatic timeout handling with forced page transitions
- Timer persistence across browser sessions

**Data Logging**:
- All user interactions logged with operation codes
- Duplicate operation prevention logic
- Page enter/exit events automatically recorded
- Real-time submission to backend for data persistence

**Page Flow Logic**:
- Linear progression through numbered pages
- Conditional navigation based on completion status
- Task completion triggers questionnaire phase
- Final submission handling in P28
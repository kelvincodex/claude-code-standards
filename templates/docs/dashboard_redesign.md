# Dashboard Design Specification

## Architecture
- Single unified layout: sidebar + header + content area
- Shell stays mounted, content area swaps based on route
- Both user types share the same shell — differences are content-level only

## Component Library
- Use UI library primitives as base, customize to match design
- UI library source files are READ-ONLY — create wrappers instead
- Every component must be reusable and accept props for variation

## Auth Flow
- Auth is modal-based — no standalone auth pages
- Header shows Login/Signup buttons when no session
- After auth, modals close and session state updates

## Unauthenticated State
- Dashboard renders immediately without a session
- Home tab is auto-selected by default
- Other tabs are visible but disabled/locked
- Content uses hardcoded design data

## Design Source of Truth
- Connect to design tool (Figma MCP) before building
- Use hardcoded data directly from the design
- Match spacing, color, typography exactly

*Customize this for your project's specific design requirements.*

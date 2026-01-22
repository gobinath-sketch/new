Proposal: Professional project structure for Single-playground ERP

Goal
- Provide a clear, maintainable, and production-ready folder layout.
- Keep current code intact until you approve a migration plan.

Summary recommendation (no changes performed)
- I will not move or modify any files until you approve this plan.

Recommended top-level tree

- backend/
  - src/
    - index.js (current server.js -> move here)
    - config/
      - index.js (load env & config)
    - api/
      - routes/  (move existing `routes/*.js` here)
      - controllers/ (new: move business logic from routes into controllers)
      - validators/ (request validation schemas)
    - models/  (existing `models/`)
    - services/ (business helpers: `aiDecisionEngine`, `notificationService`, `autoGeneration`, `generators`, `tdsCalculator`)
    - utils/ (pdf/excel helpers, ai wrappers)
    - middleware/ (existing `auth.js`, others)
    - scripts/ (existing `scripts/`)
    - tests/ (unit & integration tests)
  - package.json
  - Dockerfile
  - README.md

- frontend/
  - src/
    - app/ (routing, app-level state)
      - App.jsx
      - routes.jsx
    - pages/ (existing `pages/`)
    - components/ (existing `components/`)
    - services/ (existing `services/`)
    - hooks/ (custom React hooks)
    - contexts/ (React contexts)
    - styles/ (global CSS / design tokens)
    - utils/ (small helpers)
    - tests/ (component & e2e integration)
  - public/
  - package.json
  - vite.config.js
  - README.md

- infra/
  - docker/
    - backend.Dockerfile
    - frontend.Dockerfile
  - k8s/ (optional manifests)
  - terraform/ (optional infra-as-code)

- ci/
  - github/ (workflows: ci.yml, e2e.yml)

- docs/
  - architecture.md
  - api-spec.md (or openapi.yaml)
  - onboarding.md

- scripts/ (repo-level scripts: install-all, start-all)
- .github/ (issue templates, PR templates)
- .vscode/ (recommended workspace settings)
- README.md (root with quick start and links)

Mapping suggestions (where current items go)
- Keep `backend/models` as-is under `backend/src/models`.
- Move `backend/routes/*.js` → `backend/src/api/routes/*.js` and create small `controllers/*.js` files that call model/service functions. (This is optional but recommended.)
- `backend/server.js` → `backend/src/index.js` (entry); create `backend/package.json` scripts to start that file.
- `backend/utils/*` → `backend/src/utils` or `backend/src/services` depending on responsibility.
- Frontend: keep `frontend/src/pages`, `frontend/src/components`, move `frontend/src/context` → `frontend/src/contexts`, `frontend/src/services` remains.

Why this layout?
- Separation of concerns: `routes` only declare API surface; `controllers` implement request handling; `services` implement business logic and can be tested independently.
- Scales better for testing, CI, and deploy (Docker + infra).
- Easier onboarding and clearer ownership of code areas.

Implementation steps (manual, safe, with git history preserved)
1. Create directories as proposed.
2. Move files with `git mv` to preserve history.
   Example PowerShell commands (run from repository root):

```powershell
# create folders
mkdir backend\src\api\routes; mkdir backend\src\api\controllers; mkdir backend\src\config; mkdir backend\src\services

# move server to index
git mv backend\server.js backend\src\index.js

# move routes
git mv backend\routes\auth.js backend\src\api\routes\auth.js
# repeat for other route files

# move models
mkdir backend\src\models
git mv backend\models\* backend\src\models\

# commit
git add .
git commit -m "Restructure backend into src/api, src/models, src/services"
```

3. Update import paths (small edits). Use project-wide search/replace to update relative imports. Example: `import User from '../models/User.js'` may remain valid if relative positions preserved; otherwise update to `from '../models/User.js'` or `from '../../models/User.js'` depending on new file locations.
4. Run tests / start dev server and fix path breakages.

Options I can take next (pick one)
- A. Generate this structure in the repo (create directories and a `PROJECT_STRUCTURE_PROPOSAL.md`) but do NOT move any files. (safe)
- B. Scaffold directories and perform `git mv` moves for a selected small set (e.g., move `server.js` and `models`) and fix imports. (I will make those changes only after you approve.)
- C. Only produce a detailed, file-by-file migration plan listing exact `git mv` commands and import patches needed for full migration.

Please choose A, B, or C (or ask for a different option). I will not change code or move files until you explicitly approve the migration step.

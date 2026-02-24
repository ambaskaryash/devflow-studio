# DevFlow Studio

> **Visual DevOps Workflow Builder** — Design, execute, and manage development pipelines locally using a node-based canvas.

<p align="center">
  <img alt="DevFlow Studio" src="apps/desktop/src-tauri/icons/icon.png" width="80" />
</p>

## 🚀 Features

- **Visual Canvas** — Drag-and-drop workflow builder powered by React Flow
- **4 Built-in Block Types** — Docker Build, Docker Run, Git Pull, Script Run
- **Real Execution** — Runs actual Docker/Git/shell commands with live log streaming
- **Project Detection** — Opens a folder and auto-suggests a starter flow
- **Local-First** — No cloud, no CI/CD integration, no accounts
- **Cross-Platform** — Windows, Linux, macOS from a single codebase

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| UI Framework | React 18 + TypeScript |
| Styling | Tailwind CSS (dark theme) |
| Canvas | React Flow v11 |
| State | Zustand |
| Storage | SQLite (better-sqlite3) |
| Build | Vite v5 |

## 🗂️ Project Structure

```
devflow-studio/
├── apps/
│   ├── desktop/         ← Tauri shell (Rust src-tauri)
│   └── ui/              ← React frontend (Vite + Tailwind + React Flow)
├── core/
│   ├── flow-engine/     ← Graph model, validator, topological planner
│   ├── executor/        ← Shell command builders (Docker, Git, Script)
│   └── detectors/       ← Project type scanner + starter templates
├── packages/
│   ├── ui-components/   ← Shared React components
│   └── storage/         ← SQLite CRUD (flows + execution history)
└── package.json         ← npm workspaces root
```

## 🔧 Prerequisites

- **Node.js** v18+
- **Rust** (install via [rustup](https://rustup.rs))
- **Linux**: `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libgtk-3-dev`
- **Docker** (optional — needed to run Docker block types)

## ⚡ Getting Started

```bash
# Install dependencies
npm install

# Start the Tauri desktop app in dev mode
cd apps/desktop
cargo tauri dev

# Or build for production
cargo tauri build
```

### Frontend-only preview (no Tauri)

```bash
cd apps/ui
npx vite
# Opens at http://localhost:1420
```

## 🧩 Block Types

| Block | Command Generated | Config |
|-------|------------------|--------|
| **Docker Build** 🐳 | `docker build -t <tag> <context>` | context, tag, dockerfile, build-args |
| **Docker Run** ▶️ | `docker run -p ... <image>` | image, ports, env, name, detach |
| **Git Pull** 📥 | `git -C <dir> pull <remote> <branch>` | remote, branch, directory |
| **Script Run** 💻 | `bash -c "<command>"` | command, shell, working dir |

## 🗺️ Roadmap (Future)

- [ ] AI flow suggestions
- [ ] Kubernetes integration
- [ ] Plugin marketplace
- [ ] Flow replay mode
- [ ] Visual failure analytics
- [ ] Flow versioning / undo history

## 📄 License

MIT

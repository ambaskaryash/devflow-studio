# DevFlow Studio — User Guide ⚡
Welcome to **DevFlow Studio**, the advanced workflow automation platform for modern DevOps teams. This guide will help you master the visual canvas, execution engine, and advanced diagnostic tools.

---

## 🚀 Getting Started

### 1. Open a Project
DevFlow Studio is context-aware. To start:
- Click the **Open** button in the top toolbar.
- Select your project folder (e.g., a directory containing a `Dockerfile`, `package.json`, or `requirements.txt`).
- The system will automatically detect your project type and offer a template.

### 2. Building Your First Flow
- **Add Nodes**: Click on the specialized node buttons in the toolbar (e.g., **Docker**, **Git**, **Script**).
- **Connect Nodes**: Click and drag from the output handle (right) of one node to the input handle (left) of another.
- **Configure**: Select a node to open the **Node Settings** panel on the right. Enter your commands, tags, or parameters.

---

## 🛠️ Core Features

### Workflow Execution
- **Run Flow**: Click the blue **Run Flow** button to start execution.
- **Real-time Monitoring**: Nodes will glow orange while running and show an SVG progress ring. Logs will stream live in the bottom panel.
- **Resilience**: If a node fails, the flow pauses. You can fix the issue (e.g., in your local files) and click **Resume** to continue from where you left off.

### Visual Flow Debugger 🐞
Step through your automation precisely:
1. Toggle **Debug Mode** in the toolbar.
2. Click **Run Flow**.
3. The engine will pause before each node. Use the **Step** button in the toolbar to execute one node at a time, or **Resume** to finish the rest.

### Smart Workflow Optimizer ✨
Optimize your pipelines for speed and reliability:
- Click the **Optimize** button to open the Optimizer Drawer.
- Click **Analyze** to get suggestions (e.g., "Parallelize independent tasks" or "Use specific Docker tags").
- Click **Apply** to automatically update your flow based on the suggestions.

---

## 📦 Sharing & Portability

### Flow Sharing (.devflowpkg)
Save and share your workflows as portable files:
- **Export**: Click the **Download** icon to save your current flow as a `.devflowpkg` file.
- **Import**: Click the **Upload** icon to load a `.devflowpkg` file shared by a teammate.

### Version History
- Click **History** in the toolbar to see past snapshots of your flow.
- Click **Save** to manually create a labeled snapshot.

---

## 🧩 Advanced: Plugin SDK

Extend DevFlow Studio with custom node types:
- See the [SDK Guide](packages/plugin-sdk/SDK_GUIDE.md) for full details.
- Plugins are loaded automatically from your project's `plugins/` directory.

---

## 📈 Performance & Stability
DevFlow Studio is built for production:
- **Streaming Architecture**: Handles thousands of log lines without lag.
- **Safe Execution**: Protected against plugin crashes via internal safeguards.
- **Local Telemetry**: Tracks execution times to help you identify bottlenecks in your own CI/CD processes.

---
*DevFlow Studio — Automate with Precision.*

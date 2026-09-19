# HOW TO RUN AETHERIUS IDE

## Quick Start (One-Step)

### Using the launcher script (recommended)
1. Ensure **Agent Bridge** is running:
   - Open a PowerShell window
   - Run: `cd "C:\Users\jpowe\Desktop\IDE-Workspace\workspace\integration"`
   - Run: `.\\BridgeService.py`
   - Verify: Agent Bridge health at http://127.0.0.1:8471/health

2. Run the IDE launcher:
   - Right-click: `Start-Aetherius-IDE.ps1` on your Desktop
   - Or run: `powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jpowe\Desktop\Start-Aetherius-IDE.ps1"`
   - IDE opens at: http://127.0.0.1:5199

3. Log in / select model:
   - The IDE will auto-detect connected Agent Bridge
   - Select a local model from the ModelCenter
   - Choose Chat mode or Work mode via the view toggle

### Manual launch (without script)
1. Start Agent Bridge:
   - Open PowerShell
   - `cd "C:\Users\jpowe\Desktop\IDE-Workspace\workspace\integration"`
   - Run: `.\\BridgeService.py`
   - Verify health at http://127.0.0.1:8471/health

2. Start the IDE dev server:
   - Open PowerShell
   - `cd "C:\Users\jpowe\Desktop\IDE-Workspace\workspace\app"`
   - Run: `npx vite --port 5199 --host 127.0.0.1`
   - OR: Run `Start-Aetherius-IDE.ps1` (see above)

3. Open the IDE in your browser at: http://127.0.0.1:5199

## IDE Interface Overview

### Main Layout
- **LEFT**: Project / Files / Tools panel
- **CENTER**: Editor / Workspace canvas
- **RIGHT**: Genesis avatar / Chat / Task context
- **BOTTOM**: Terminal / Output / Problems / Debug / Logs

### Panels are:
- Resizable
- Dockable where practical
- Collapsible
- Persistent

### View Modes
- **Chat mode**: Conversation, questions, explanations, design discussion, research, planning, light file interaction
- **Work mode**: Understand task → retrieve project context → plan → delegate → execute → edit files → run commands → test → review → adapt → continue

### Minimum Visual Acceptance (owner must verify)
- [ ] MENU / COMMAND AREA
- [ ] PROJECT / FILE TREE
- [ ] MAIN EDITOR / WORKSPACE
- [ ] AI CHAT / AVATAR AREA
- [ ] TASKCENTER
- [ ] MODELCENTER
- [ ] TERMINAL
- [ ] OUTPUT / PROBLEMS / DEBUG INFORMATION
- [ ] STATUS BAR
- [ ] SETTINGS
- [ ] GIT / VERSION CONTROL
- [ ] CHAT MODE
- [ ] WORK MODE

### Model Selection
1. Click ModelCenter to view installed/local/downloadable models
2. Select a local model (e.g., qwen2.5-coder:3b)
3. The selected model becomes the supervisor/worker for Agent Bridge tasks

### Using Chat Mode
1. Type a question or design request in the chat input
2. Press Enter (Shift+Enter for new line)
3. The agent will respond with explanation, plan, or code chips
4. Use action buttons (implementation plan cards, code chips, etc.)

### Using Work Mode
1. Ensure a project is open or create one via the file tree
2. The IDE will understand the task and retrieve project context
3. Agent Bridge will delegate to a worker model
4. Edit files, run commands, test — progress is visibly tracked
5. Current task, step, agent/model, result, verification, and adaptation are displayed

### Terminal
1. Click the Terminal panel at the bottom
2. Use `createTerminalSession` to start a session
3. Run commands: `execTerminal` sends them to the Agent Bridge
4. History is preserved; origin badges show user vs agent

### File Operations
- **List**: File tree shows project structure
- **Read**: Click a file to view content in the editor
- **Write**: Edit the editor content, use "Save" to write via Agent Bridge
- **Search**: Use the search panel to find patterns across files
- **Git**: Use the Git panel for status, commit, push operations

### Settings
- Theme: Dark / Frost / Aurora / Amber (bottom of AI panel)
- Keybindings: Configurable shortcuts (toggle sidebar, mode switching, etc.)
- Agent & Model: Primary reasoning engine, tool execution permissions

## Stopping the IDE

### Using the launcher script
- Return to the PowerShell window
- Press Ctrl+C (may need to press twice — once for the read-host, once for the vite process)
- Both the IDE dev server and Agent Bridge services will stop

### Manual stop
- **IDE dev server**: Return to its PowerShell window, press Ctrl+C
- **Agent Bridge**: Return to its PowerShell window, press Ctrl+C

## Known Limitations
- IDE is a development/slice build — not yet a packaged desktop executable
- Agent Bridge must be running for full functionality
- Some features (full-screen avatar, extension system) are planned for future milestones
- Mobile/tablet-specific UI not yet implemented

## Verifying IDE is Working
The IDE is working when:
- Browser shows http://127.0.0.1:5199
- AI panel shows "connected" or a model name (not "disconnected")
- ModelCenter lists available models
- Terminal can accept commands (if Agent Bridge is running)
- File read/write operations complete without error

## If Something Goes Wrong
- Check: Is Agent Bridge running at http://127.0.0.1:8471/health?
- Check: Is the IDE dev server running at http://127.0.0.1:5199?
- Check: Console for any JavaScript errors (F12)
- View: `audit_report.txt` in IDE-Workspace root for common issues
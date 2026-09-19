# UNIT F: REAL END-TO-IDE TEST (Agent Bridge Only, No Genesis)

## Test Objective
Prove Agent Bridge is functional through the IDE without Genesis.
Sequence: choose model → open test project → ask AI to make safe edit → Bridge executes → run test → show result.

## Preconditions
- Agent Bridge is running at http://127.0.0.1:8471
- IDE is running at http://127.0.0.1:5199 (start via Start-Aetherius-IDE.ps1)

## Test Steps

### Step 1: Choose Model
1. Open IDE at http://127.0.0.1:5199
2. Click ModelCenter (right panel)
3. Select a local model from "INSTALLED LOCAL" category
   - Example: qwen2.5-coder:3b, granite3.3:2b, deepseek-coder:1.3b
4. The model becomes the supervisor for Agent Bridge tasks
5. Verify: Model name appears in the status bar

### Step 2: Open Test Project
1. In the LEFT panel (Project/Files), click "Open Folder"
2. Select a directory with simple source files
   - OR: Click the "New File" button to create `test.txt` with content "Hello World"
3. Verify: Project tree shows the new/test files
4. Verify: Editor shows the file content

### Step 3: Ask AI to Make Safe Edit
1. In the CHAT area (right panel or bottom depending on layout), type:
   > "Change 'Hello World' to 'Hello Aetherius' in test.txt"
2. Press Enter (Shift+Enter for new line)
3. The IDE sends the task to Agent Bridge with the selected model
4. Agent Bridge delegates to the worker model
5. The model edits the file via workspace/file operations

### Step 4: Bridge Executes
1. Watch the TERMINAL panel (bottom) for activity
2. Watch the OUTPUT panel for results
3. The IDE shows:
   - Current task: "Change 'Hello World' to 'Hello Aetherius' in test.txt"
   - Current step: "edit file" / "verify result"
   - Agent/model: selected model name
   - Progress: percentage completed
4. The model performs the edit through Agent Bridge API
5. Verification runs (tests, output check)

### Step 5: Run Test / Show Result
1. After the edit completes, the IDE shows:
   - Result: "File edited successfully"
   - Verification: "Content changed: Hello Aetherius (was: Hello World)"
   - Progress: 100%
2. In the editor, verify: test.txt now contains "Hello Aetherius"
3. In the chat, the agent reports: "I changed Hello World to Hello Aetherius in test.txt"
4. **Test PASSED** if: file content was actually modified as requested

### Step 6: Document Result
1. Note which model was used
2. Note the task that was completed
3. Verify the file change in the editor
4. Record: "Agent Bridge test PASSED with model X — safe edit completed"

## Expected Outcomes

### Test PASSED
- Model selected and appears in status bar
- Test project opened successfully
- AI made the requested edit
- Bridge executed the task (no errors)
- File content was actually changed as requested
- Result displayed to user

### Test FAILED (document outcome)
- Model not available or failed to load
- Project could not be opened
- AI could not complete the task
- Bridge returned error (check terminal for details)
- File was not modified as requested
- Result: Document what failed and why — this is valuable evidence for adaptive loop

## Evidence to Record
- Model name used: [e.g., qwen2.5-coder:3b]
- Task completed: [e.g., "Change Hello World to Hello Aetherius in test.txt"]
- File modified: [path and before/after content]
- Bridge status: [connected/disconnected/error]
- Any error messages or evidence

## How to Classify the Result
After Unit F, classify:

**AGENT_BRIDGE = OWNER_TESTABLE** if:
- The end-to-end test PASSED (model worked, task completed, file modified)
- Jonathan can repeat the test with different models

**AGENT_BRIDGE = NOT YET** if:
- The test FAILED (model unavailable, bridge error, task incomplete)
- Only some models work, need to test multiple
- Bridge needs configuration or bridge service needs restart

This classification feeds directly into **Unit I: Phase Decision**.
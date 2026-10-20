// Renderer process for test-electron-app
// Simple counter application with IPC communication

let count = 0;

// Display the current count
function updateDisplay() {
  const counterEl = document.getElementById('counter') as HTMLSpanElement;
  counterEl.textContent = count.toString();
}

// Increment the counter
document.getElementById('increment')!.addEventListener('click', () => {
  count++;
  updateDisplay();
  // Send message to main process
  if ((window as any).electron) {
    (window as any).electron.send('counter-updated', count);
  }
});

// Reset the counter
document.getElementById('reset')!.addEventListener('click', () => {
  count = 0;
  updateDisplay();
  // Send message to main process
  if ((window as any).electron) {
    (window as any).electron.send('counter-reset', count);
  }
});

// Initial display
updateDisplay();
// Step 1: Query the target element that will receive the dispatched commands.
// In the Invoker Commands API, buttons point to this element using 'commandfor="status-panel"'.
const statusPanel = document.querySelector('#status-panel');

// Step 2: Grab the internal text span so we can update the displayed state on screen.
const statusIndicator = document.querySelector('#status-indicator');

// Step 3: Attach a single listener for the native 'command' event directly to the target element.
// Buttons with 'commandfor' pointing to this ID will automatically dispatch this event here.
statusPanel.addEventListener('command', (event) => {
	// Extract the custom command name from the CommandEvent object.
	// Custom commands are required to start with two dashes (e.g., '--set-active', '--reset').
	const { command } = event;

	// The event object also provides 'event.source', referencing the exact <button> that triggered it.
	// console.log("Invoked by button:", event.source);

	// Step 4: Route the incoming action in one centralized location rather than managing multiple button listeners.
	switch (command) {
		case '--set-active':
			// Add the active CSS modifier class to update panel styling.
			statusPanel.classList.add('active');

			// Update the readable text inside the indicator container.
			statusIndicator.textContent = 'Active (Command Handled)';
			break;

		case '--reset':
			// Strip the active styling class back to default resting state.
			statusPanel.classList.remove('active');

			// Revert the text label back to its idle baseline.
			statusIndicator.textContent = 'Idle';
			break;

		default:
			// Gracefully ignore or log any custom commands that aren't handled by this component.
			break;
	}
});

// FULLY COMMENTED CODE DEMO
// Include clear inline comments explaining WHY key lines exist
// Include error handling or feature detection where appropriate

const actionBtn = document.querySelector('#actionBtn');
const eventLog = document.querySelector('#eventLog');

// Helper to write diagnostic feedback to the log panel
const logMessage = (text) => {
	const item = document.createElement('li');
	item.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
	eventLog.prepend(item);
};

// Dedicated handler for the primary business logic
const executeAction = (sourceType) => {
	logMessage(`Action executed via: ${sourceType}`);
};

// Touch input: Process immediately on touchstart to eliminate tap latency
actionBtn.addEventListener(
	'touchstart',
	(event) => {
		executeAction('Direct Touch');
	},
	{ passive: true }
);

// Mouse input: Distinguish genuine hardware mouse clicks from synthesized tap events
actionBtn.addEventListener('mousedown', (event) => {
	// Feature detection: Check if the browser supports UIEvent.sourceCapabilities
	if (event.sourceCapabilities) {
		// If the device that fired this mousedown generates touch events,
		// this event is an emulated mouse event triggered by a tap.
		if (event.sourceCapabilities.firesTouchEvents) {
			logMessage('Ignored synthesized mousedown (touch device detected)');
			return;
		}
	}

	// Legitimate mouse click from a physical pointer device
	executeAction('Physical Mouse');
});

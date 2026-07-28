// Store references to DOM elements using document.querySelector
const startBtn = document.querySelector('#start-btn');
const permissionStatus = document.querySelector('#permission-status');
const userStateEl = document.querySelector('#user-state');
const screenStateEl = document.querySelector('#screen-state');
const logList = document.querySelector('#log-list');

// Define minimum threshold for idle state triggering (in milliseconds; min 60,000 ms per spec)
const IDLE_THRESHOLD_MS = 60000;

// Helper function to append timestamped messages to the UI log list
const addLogEntry = (message, type = 'info') => {
	const timestamp = new Date().toLocaleTimeString();
	const li = document.createElement('li');
	li.className = `log-item ${type}`;
	li.textContent = `[${timestamp}] ${message}`;

	// Prepend to show the latest state changes at the top
	logList.prepend(li);
};

// Update status text in the UI indicator cards
const updateIndicators = (userState, screenState) => {
	userStateEl.textContent = userState;
	screenStateEl.textContent = screenState;
};

// Main function to initialize and start the IdleDetector
const initIdleDetection = async () => {
	// 1. Verify browser compatibility
	if (!('IdleDetector' in window)) {
		addLogEntry(
			'Error: Idle Detection API is not supported in this browser.',
			'locked'
		);
		permissionStatus.textContent = 'Status: Unsupported';
		return;
	}

	try {
		// 2. Request user permission (must be called from a user gesture)
		addLogEntry('Requesting Idle Detection permission...', 'info');
		const permission = await IdleDetector.requestPermission();
		permissionStatus.textContent = `Permission: ${permission}`;

		if (permission !== 'granted') {
			addLogEntry('Permission denied by user.', 'locked');
			return;
		}

		// 3. Instantiate the IdleDetector instance
		const idleDetector = new IdleDetector();

		// 4. Attach event listener for change events using arrow functions
		idleDetector.addEventListener('change', () => {
			const { userState, screenState } = idleDetector;

			// Log state transition
			addLogEntry(
				`State change — User: ${userState} | Screen: ${screenState}`,
				userState === 'active' ? 'active' : 'idle'
			);

			// Update DOM indicators
			updateIndicators(userState, screenState);

			// Example operational hooks:
			if (userState === 'idle' || screenState === 'locked') {
				// Pause resource-intensive processes (e.g., real-time polling, video canvas)
				addLogEntry('System paused: entering idle mode.', 'idle');
			} else if (userState === 'active') {
				// Resume background activity
				addLogEntry('System resumed: user returned active.', 'active');
			}
		});

		// 5. Start listening with a 60-second minimum threshold
		await idleDetector.start({
			threshold: IDLE_THRESHOLD_MS
		});

		addLogEntry(
			`Idle detector active (Threshold: ${IDLE_THRESHOLD_MS / 1000}s).`,
			'active'
		);

		// Set initial values
		updateIndicators(idleDetector.userState, idleDetector.screenState);

		// Disable start button once initialized
		startBtn.disabled = true;
		startBtn.textContent = 'Monitoring Active';
	} catch (error) {
		addLogEntry(`Initialization error: ${error.message}`, 'locked');
	}
};

// Attach click listener to start button using arrow function
startBtn.addEventListener('click', () => {
	initIdleDetection();
});

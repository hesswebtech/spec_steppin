/**
 * Interactive History API Script Router
 * Configures layout text parameters mapped directly to key view IDs
 */
const pages = {
	dashboard: { title: 'Welcome to your Dashboard 📊' },
	analytics: { title: 'Your Analytics Reports 📈' },
	settings: { title: 'System Preferences ⚙️' }
};

/**
 * Updates CSS states, text values, and renders raw JSON state mapping inside the inspector panel
 * Uses arrow functions and querySelector / querySelectorAll
 */
const updateUI = (tabId, state) => {
	// 1. Highlight the current active button using querySelectorAll
	const buttons = document.querySelectorAll('.tab-button');
	buttons.forEach((btn) => {
		if (btn.id === `btn-${tabId}`) {
			btn.classList.add('active');
		} else {
			btn.classList.remove('active');
		}
	});

	// 2. Load the dynamic textual contents using querySelector
	const titleElement = document.querySelector('#content-title');
	if (titleElement) {
		titleElement.textContent = pages[tabId]?.title || 'Unknown Page';
	}

	const timestampElement = document.querySelector('#content-timestamp');
	if (timestampElement) {
		const timeStr =
			state && state.timestamp
				? `State Registered: ${new Date(state.timestamp).toLocaleTimeString()}`
				: 'Initial session entry status';
		timestampElement.textContent = timeStr;
	}

	// 3. Render raw dynamic JSON inside inspector panel block
	const inspectorElement = document.querySelector('#state-inspector');
	if (inspectorElement) {
		inspectorElement.textContent = JSON.stringify(state || null, null, 2);
	}
};

/**
 * Handles tab navigation routines
 */
const switchTab = (tabId, pushToHistory = true) => {
	const stateObject = {
		tab: tabId,
		timestamp: Date.now()
	};

	if (pushToHistory) {
		// Save state context parameters using system-level pushState overrides
		window.history.pushState(stateObject, '', `?tab=${tabId}`);
	}

	// Flush UI changes immediately
	updateUI(tabId, stateObject);
};

/**
 * Global popstate Event Listener
 * Catches user physical browser 'Back' or 'Forward' button triggers
 */
window.addEventListener('popstate', (event) => {
	if (event.state && event.state.tab) {
		// State records exist; reload past state parameters
		updateUI(event.state.tab, event.state);
	} else {
		// Null state recovery fallback (e.g. baseline domain entry path)
		const params = new URLSearchParams(window.location.search);
		const activeTab = params.get('tab') || 'dashboard';
		updateUI(activeTab, null);
	}
});

/**
 * Initialization Block
 * Binds click listeners programmatically once DOM node construction completes
 */
document.addEventListener('DOMContentLoaded', () => {
	// Bind click actions to custom workspace routing tabs
	document.querySelectorAll('.tab-button').forEach((btn) => {
		btn.addEventListener('click', () => {
			// Derive tab names ('dashboard', 'analytics', 'settings') from element ID keys
			const tabId = btn.id.replace('btn-', '');
			switchTab(tabId);
		});
	});

	// Bind browser backward and forward simulators with clean selectors
	const backBtn = document.querySelector('#btn-back');
	const forwardBtn = document.querySelector('#btn-forward');

	if (backBtn) {
		backBtn.addEventListener('click', () => window.history.back());
	}

	if (forwardBtn) {
		forwardBtn.addEventListener('click', () => window.history.forward());
	}

	// Resolve routing properties on active load execution
	const initialParams = new URLSearchParams(window.location.search);
	const initialTab = initialParams.get('tab') || 'dashboard';

	// Use state context cache if restored page instance state is active
	const restoredState = window.history.state || {
		tab: initialTab,
		timestamp: Date.now()
	};

	// Initial page layout paint call
	updateUI(initialTab, restoredState);
});

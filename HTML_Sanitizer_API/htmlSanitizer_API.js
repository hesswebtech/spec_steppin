// Feature detection
const isSupported =
	typeof Sanitizer !== 'undefined' || 'setHTML' in Element.prototype;
if (!isSupported) {
	document.querySelector('#supportBanner').style.display = 'block';
}
// Logger to mock actual script runtime inside the DOM contexts (exposed to window)
window.logXss = (message) => {
	const logs = document.querySelector('#executionLogs');
	logs.innerHTML = `⚠️ <span class="alert-hit">[ALERT]</span> XSS Attack Succeeded: <span class="alert-hit">${message}</span>`;
	console.warn('XSS Attack Succeeded:', message);
};

const clearOutputs = () => {
	document.querySelector('#unsafeOutput').innerHTML = '';
	document.querySelector('#safeOutput').innerHTML = '';
	document.querySelector('#executionLogs').innerHTML =
		'<span class="alert-clean">✔ [SYSTEM]</span> Sandboxes reset. Awaiting click...';
};

// Traditional approach (Unsafe)
const injectUnsafe = () => {
	clearOutputs();
	const input = document.querySelector('#htmlInput').value;
	const target = document.querySelector('#unsafeOutput');

	// Delaying injection slightly to give visual render feedback
	setTimeout(() => {
		target.innerHTML = input;
	}, 100);
};
// Modern HTML Sanitizer API approach (Safe)
const injectSafe = () => {
	clearOutputs();
	const input = document.querySelector('#htmlInput').value;
	const target = document.querySelector('#safeOutput');

	setTimeout(() => {
		try {
			if (isSupported) {
				// Native secure insertion API
				target.setHTML(input);

				// Confirming clean render logs
				const currentLog = document.querySelector('#executionLogs').innerHTML;
				if (!currentLog.includes('[ALERT]')) {
					document.querySelector('#executionLogs').innerHTML =
						'<span class="alert-clean">🔒 [SECURE]</span> setHTML() parsed the input. Native parser stripped all malicious event loops and inline execution targets.';
				}
			} else {
				// Fallback: parsing and manually stripping unsafe nodes
				const dummy = document.createElement('div');
				dummy.innerHTML = input;

				const scripts = dummy.querySelectorAll('script');
				Array.from(scripts).forEach((script) => script.remove());

				const allElements = dummy.querySelectorAll('*');
				Array.from(allElements).forEach((el) => {
					el.removeAttribute('onerror');
					el.removeAttribute('onload');
					if (
						el.tagName === 'A' &&
						el.getAttribute('href')?.startsWith('javascript:')
					) {
						el.removeAttribute('href');
					}
				});
				target.innerHTML = dummy.innerHTML;
				document.querySelector('#executionLogs').innerHTML =
					'<span class="alert-clean">🔒 [MOCKED PORT]</span> Simulated stripping and sanitized successfully.';
			}
		} catch (e) {
			document.querySelector('#executionLogs').innerHTML =
				`✕ Error executing: ${e.message}`;
		}
	}, 100);
};

// Declarative event bindings using querySelector and Arrow Functions
document
	.querySelector('.btn-danger')
	.addEventListener('click', () => injectUnsafe());
document
	.querySelector('.btn-safe')
	.addEventListener('click', () => injectSafe());

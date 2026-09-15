// FULLY COMMENTED CODE DEMO
window.addEventListener('DOMContentLoaded', async () => {
	const canvas = document.querySelector('#ink-canvas');
	if (!canvas) {
		console.error('Canvas element not found.');
		return;
	}

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		console.error('2D context is not supported on this device.');
		return;
	}

	// Define consistent stroke styling shared between the canvas and the Ink API
	const strokeStyle = {
		color: '#0f172a', // Slate 900
		diameter: 4 // Pixel width of the stroke
	};

	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.lineWidth = strokeStyle.diameter;
	ctx.strokeStyle = strokeStyle.color;

	// Track active drawing stroke state
	let isDrawing = false;
	let lastX = 0;
	let lastY = 0;

	// Hold reference to the DelegatedInkTrailPresenter instance
	let inkPresenter = null;

	// Feature detection: Check for Ink API support before requesting a presenter
	if (
		'ink' in navigator &&
		typeof navigator.ink.requestPresenter === 'function'
	) {
		try {
			// Confine ink trail rendering to the canvas bounding box
			inkPresenter = await navigator.ink.requestPresenter({
				presentationArea: canvas
			});
		} catch (error) {
			// Fallback: If presenter acquisition fails, standard canvas drawing continues seamlessly
			console.warn(
				'Ink API initialization failed; continuing with standard rendering.',
				error
			);
			inkPresenter = null;
		}
	} else {
		// Informational fallback for unsupported engines (Firefox, Safari, older Chrome versions)
		console.info(
			'Ink API is not supported in this browser environment. Using standard canvas pipeline.'
		);
	}

	// Pointer Down: Initialize path tracking
	canvas.addEventListener('pointerdown', (event) => {
		// Restrict drawing to primary button interactions (stylus tip, touch, left click)
		if (event.button !== 0) return;

		isDrawing = true;
		lastX = event.offsetX;
		lastY = event.offsetY;

		// Retain input focus even if the pointer moves outside the canvas boundary
		canvas.setPointerCapture(event.pointerId);
	});

	// Pointer Move: Render persistent stroke and trigger predicted compositor trail
	canvas.addEventListener('pointermove', (event) => {
		if (!isDrawing) return;

		const currentX = event.offsetX;
		const currentY = event.offsetY;

		// 1. Draw the permanent segment to the 2D canvas context
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(currentX, currentY);
		ctx.stroke();

		lastX = currentX;
		lastY = currentY;

		// 2. Delegate low-latency trail rendering to the OS compositor
		// updateInkTrailStartPoint requires a trusted PointerEvent
		if (inkPresenter && event.isTrusted) {
			inkPresenter.updateInkTrailStartPoint(event, {
				color: strokeStyle.color,
				diameter: strokeStyle.diameter
			});
		}
	});

	// Shared cleanup logic for pointer release and boundary interruptions
	const stopDrawing = (event) => {
		if (!isDrawing) return;
		isDrawing = false;

		if (canvas.hasPointerCapture(event.pointerId)) {
			canvas.releasePointerCapture(event.pointerId);
		}
	};

	// Pointer Up & Cancel: Teardown pointer state
	canvas.addEventListener('pointerup', stopDrawing);
	canvas.addEventListener('pointercancel', stopDrawing);
});

const container = document.querySelector('#space-container');
const target = document.querySelector('#target-element');
const dot = document.querySelector('#click-dot');

const screenCoordsEl = document.querySelector('#screen-coords');
const boundingRectEl = document.querySelector('#bounding-rect');
const matrixSigEl = document.querySelector('#matrix-signature');
const localProjectedEl = document.querySelector('#local-projected');

container.addEventListener('click', (event) => {
	// 1. Capture click coordinates inside a native DOMPoint representation
	const clickPoint = new DOMPoint(event.clientX, event.clientY);

	// Update screen coordinates display
	screenCoordsEl.textContent = `x: ${clickPoint.x.toFixed(1)}, y: ${clickPoint.y.toFixed(1)}`;

	// 2. Query target element bounds (surfaces DOMRect)
	const targetRect = target.getBoundingClientRect();
	boundingRectEl.textContent = `w: ${targetRect.width.toFixed(1)}, h: ${targetRect.height.toFixed(1)}`;

	// Position visual feedback marker
	const containerRect = container.getBoundingClientRect();
	const dotX = event.clientX - containerRect.left;
	const dotY = event.clientY - containerRect.top;
	dot.style.left = `${dotX}px`;
	dot.style.top = `${dotY}px`;
	dot.style.display = 'block';

	// 3. Extract the active runtime transform stylesheet matrix
	const style = window.getComputedStyle(target);
	const transformString = style.transform;

	if (transformString && transformString !== 'none') {
		// Instantiate a native DOMMatrix directly from the DOM CSS variable
		const matrix = new DOMMatrix(transformString);

		// Print key 2D/3D determinants from the DOMMatrix signature
		matrixSigEl.textContent = `m11: ${matrix.m11.toFixed(3)}, m12: ${matrix.m12.toFixed(3)}`;

		try {
			// Compute the inverse matrix to transform from viewport system backward to local system
			const inverseMatrix = matrix.inverse();

			// Standardize screen layout offsets before projection
			const viewportOffsetPoint = new DOMPoint(
				event.clientX - (targetRect.left + targetRect.width / 2),
				event.clientY - (targetRect.top + targetRect.height / 2)
			);

			// Apply transformation vector projection
			const localCoords = viewportOffsetPoint.matrixTransform(inverseMatrix);
			localProjectedEl.textContent = `x: ${localCoords.x.toFixed(1)}, y: ${localCoords.y.toFixed(1)}`;
		} catch (err) {
			localProjectedEl.textContent = 'Non-invertible matrix';
		}
	} else {
		matrixSigEl.textContent = 'Identity (No transform)';
		const localX = event.clientX - targetRect.left;
		const localY = event.clientY - targetRect.top;
		localProjectedEl.textContent = `x: ${localX.toFixed(1)}, y: ${localY.toFixed(1)}`;
	}
});

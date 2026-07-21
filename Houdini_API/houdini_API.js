// 1. Register a typed, non-inherited custom property
if ('registerProperty' in CSS) {
	CSS.registerProperty({
		name: '--checker-size',
		syntax: '<length>',
		inherits: false,
		initialValue: '32px'
	});
}

// 2. Load the paint worklet module
if ('paintWorklet' in CSS) {
	CSS.paintWorklet
		.addModule('checkerboard.js')
		.then(() => console.log('Houdini Paint Worklet loaded successfully.'))
		.catch((err) => console.error('Failed to load Houdini Worklet:', err));
} else {
	// Fallback message for unsupported browsers (Firefox/Safari without experimental flags)
	document.getElementById('canvas').style.backgroundColor = '#334155';
	console.warn('Your browser does not support the CSS Paint API natively.');
}

// 3. Dynamic adjustment
const slider = document.querySelector('#size-slider');
const displayVal = document.querySelector('#size-val');
const canvasElement = document.querySelector('#canvas');

slider.addEventListener('input', (event) => {
	const currentSize = `${event.target.value}px`;
	displayVal.textContent = currentSize;

	// Update custom property; Houdini immediately redraws the canvas off-thread
	canvasElement.style.setProperty('--checker-size', currentSize);
});

// A standards-compliant PaintWorklet to draw a dynamic canvas pattern
class CheckerboardPainter {
	// Specify which CSS Custom Properties this worklet should monitor
	static get inputProperties() {
		return ['--checker-size', '--checker-color-1', '--checker-color-2'];
	}

	// Draw pattern inside the paint method (executes off the main thread)
	paint(ctx, geom, properties) {
		// Read properties and parse values with sensible fallback defaults
		const sizeProperty = properties.get('--checker-size');
		const size = sizeProperty ? parseFloat(sizeProperty.toString()) : 32;

		const color1 =
			properties.get('--checker-color-1')?.toString().trim() || '#1e293b';
		const color2 =
			properties.get('--checker-color-2')?.toString().trim() || '#334155';

		// Loop through geometry dimensions to draw grid cells
		for (let y = 0; y < geom.height; y += size) {
			for (let x = 0; x < geom.width; x += size) {
				// Toggle drawing colors based on column/row parity
				const isEven = (x / size + y / size) % 2 === 0;
				ctx.fillStyle = isEven ? color1 : color2;
				ctx.fillRect(x, y, size, size);
			}
		}
	}
}

// Register the class name to map directly with CSS paint(checkerboard)
registerPaint('checkerboard', CheckerboardPainter);

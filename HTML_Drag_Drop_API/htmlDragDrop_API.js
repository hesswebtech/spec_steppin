document.addEventListener('DOMContentLoaded', () => {
	const draggables = document.querySelectorAll('.draggable-item');
	const dropZone = document.getElementById('drop-zone');
	const logOutput = document.getElementById('log-output');

	// Unified logging utility
	const log = (message) => {
		const timestamp = new Date().toLocaleTimeString();
		logOutput.textContent =
			`[${timestamp}] ${message}\n` + logOutput.textContent;
	};

	// Prevent default behaviors for Drag & Drop actions
	const preventDefaults = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};

	// 1. Draggable Item Event Listeners
	draggables.forEach((item) => {
		item.addEventListener('dragstart', (e) => {
			item.classList.add('dragging');
			// Pack the reference ID into the dataTransfer pipeline
			e.dataTransfer.setData('text/plain', item.id);
			log(`Started dragging: "${item.innerText.trim()}"`);
		});

		item.addEventListener('dragend', () => {
			item.classList.remove('dragging');
		});
	});

	// 2. Drop Zone Targets
	['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
		dropZone.addEventListener(eventName, preventDefaults, false);
	});

	// Highlight Drop Target when element is hovered overhead
	['dragenter', 'dragover'].forEach((eventName) => {
		dropZone.addEventListener(
			eventName,
			() => {
				dropZone.classList.add('hover');
			},
			false
		);
	});

	// Remove Highlight when element slides out of target airspace
	['dragleave', 'drop'].forEach((eventName) => {
		dropZone.addEventListener(
			eventName,
			() => {
				dropZone.classList.remove('hover');
			},
			false
		);
	});

	// Handle Drop Action
	dropZone.addEventListener('drop', (e) => {
		// Read unique transport key from the pipeline payload
		const itemId = e.dataTransfer.getData('text/plain');
		const droppedElement = document.getElementById(itemId);

		if (droppedElement) {
			const taskText = droppedElement.innerText.trim();

			// Update UI Structure inside target
			dropZone.innerHTML = `
        <div class="draggable-item dropped-confirmed">
          <strong>✅ Completed:</strong> ${taskText}
        </div>
      `;
			dropZone.classList.add('dropped');

			log(
				`SUCCESS: Dropped payload with ID ${itemId} containing "${taskText}"`
			);

			// Reset the drop target visual styles after 2.5 seconds
			setTimeout(() => {
				dropZone.innerHTML = `<p class="drop-message">Drop Files or Folders Here</p>`;
				dropZone.className = '';
			}, 2500);
		} else {
			log('WARNING: Dropped element was invalid or read empty payload.');
		}
	});
});

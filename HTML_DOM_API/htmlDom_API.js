// Wait for the DOM to be fully loaded before running code
document.addEventListener('DOMContentLoaded', () => {
	// Select elements using DOM API
	const box = document.querySelector('#demo-box');
	const changeBtn = document.querySelector('#change-btn');
	const addBtn = document.querySelector('#add-btn');

	// Event handler: Change box content, style, and attribute
	changeBtn.addEventListener('click', () => {
		// Change the text content
		box.textContent = 'The box has been changed!';

		// Toggle a CSS class to change the background style
		box.classList.toggle('highlight');

		// Set a custom markup data attribute
		box.setAttribute('data-changed', 'true');
	});

	// Event handler: Add a new paragraph below the box
	addBtn.addEventListener('click', () => {
		// Create a new <p> Element Node
		const newPara = document.createElement('p');
		newPara.textContent = 'This paragraph was added using the DOM API.';

		// Insert the new element node immediately after the box element
		box.insertAdjacentElement('afterend', newPara);
	});

	// Demonstrate reading attributes and logging to the console
	console.log('Box ID:', box.id); // Accessing a property
	console.log('Box initial content:', box.textContent); // Reading text content
});

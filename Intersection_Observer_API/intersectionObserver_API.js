/**
 * Intersection Observer Implementation
 * hesswebtech.com Demo Script
 *
 * Demonstrates performant, asynchronous scroll-triggered reveals
 * without binding listeners to window.scroll or forcing layout recalculations.
 */

// Ensure the DOM tree is fully constructed before querying elements
document.addEventListener('DOMContentLoaded', () => {
	// 1. SELECT TARGET ELEMENTS
	// Query all DOM elements that need to be tracked and animated.
	const cards = document.querySelectorAll('.reveal-card');

	// 2. FEATURE DETECTION / PROGRESSIVE ENHANCEMENT
	// Verify that the browser natively supports the Intersection Observer API.
	// If an older browser lacks support, immediately reveal all elements so content remains accessible.
	if (!('IntersectionObserver' in window)) {
		console.warn(
			'IntersectionObserver not supported by this browser. Falling back to default display.'
		);
		cards.forEach((card) => card.classList.add('is-visible'));
		return;
	}

	// 3. OBSERVER CONFIGURATION OPTIONS
	// Fine-tune the intersection boundaries and sensitivity thresholds.
	const observerOptions = {
		/**
		 * root:
		 * Defines the ancestor element used as the viewport for checking visibility.
		 * Passing `null` defaults to the top-level browser viewport window.
		 */
		root: null,

		/**
		 * rootMargin:
		 * Offsets applied to the bounding box of the root before calculating intersections.
		 * Syntax mirrors standard CSS margins (top, right, bottom, left).
		 *
		 * Using '-60px' on the bottom shrinks the trigger area upward, requiring
		 * the element to travel 60px past the bottom edge before registering an intersection.
		 * (Tip: Use positive values like '200px' for lazy-loading images ahead of scroll).
		 */
		rootMargin: '0px 0px -60px 0px',

		/**
		 * threshold:
		 * A single number or an array of numbers between 0.0 and 1.0 indicating
		 * the percentage of the target's visibility required to execute the callback.
		 *
		 * 0.15 means the callback fires when exactly 15% of the target element
		 * is visible within the bounds set by root + rootMargin.
		 */
		threshold: 0.15
	};

	// 4. CALLBACK FUNCTION DEFINITION
	/**
	 * handleIntersect
	 * Executed asynchronously on the main thread whenever any observed element
	 * crosses one of the specified threshold boundaries.
	 *
	 * @param {IntersectionObserverEntry[]} entries - An array of entry objects,
	 *        one for each observed target that crossed a threshold.
	 * @param {IntersectionObserver} observerInstance - The active observer instance
	 *        managing these observations (useful for unobserving targets inside the loop).
	 */
	const handleIntersect = (entries, observerInstance) => {
		// Loop through every observed element that experienced a threshold transition
		entries.forEach((entry) => {
			/**
			 * entry.isIntersecting:
			 * A boolean flag that returns true if the target is currently intersecting
			 * with the intersection root (i.e., entering the viewport), or false if it is exiting.
			 */
			if (entry.isIntersecting) {
				// 4a. Trigger the Visual State:
				// Add the CSS class that transitions the element from hidden to visible.
				entry.target.classList.add('is-visible');

				/**
				 * 4b. Cleanup and Memory Management:
				 * Because this reveal animation only needs to play once upon initial view,
				 * we stop observing this specific DOM node immediately.
				 *
				 * Calling observerInstance.unobserve(entry.target) releases the browser
				 * from tracking this element further, reclaiming memory and CPU cycles.
				 */
				observerInstance.unobserve(entry.target);
			}
		});
	};

	// 5. INSTANTIATE THE OBSERVER
	// Create the observer instance by passing the callback logic and the options configuration.
	const revealObserver = new IntersectionObserver(
		handleIntersect,
		observerOptions
	);

	// 6. REGISTER TARGETS
	// Iterate through the NodeList and instruct the observer to track each individual card.
	cards.forEach((card) => {
		revealObserver.observe(card);
	});
});

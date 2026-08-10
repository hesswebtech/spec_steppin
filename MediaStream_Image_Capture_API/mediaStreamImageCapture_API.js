// State management variables for media stream objects
let activeStream = null;
let imageCapturer = null;

// UI Element references
const startBtn = document.querySelector('#start-btn');
const captureBtn = document.querySelector('#capture-btn');
const videoElement = document.querySelector('#webcam-preview');
const imageElement = document.querySelector('#captured-result');
const statusElement = document.querySelector('#status');

/**
 * Feature detection function to check API availability.
 */
const isApiSupported = () => {
	return 'ImageCapture' in window && 'mediaDevices' in navigator;
};

/**
 * Initializes the camera feed and binds the ImageCapture controller.
 */
const startCamera = async () => {
	statusElement.textContent = '';

	// Feature detection guard clause
	if (!isApiSupported()) {
		statusElement.textContent =
			'The Image Capture API is not fully supported in this browser.';
		return;
	}

	try {
		// Request hardware camera access with targeted high-resolution constraints
		activeStream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				facingMode: 'user'
			}
		});

		// Attach the active media stream to the HTML5 video element for live previewing
		videoElement.srcObject = activeStream;

		// Retrieve the first active video track from the stream
		const videoTrack = activeStream.getVideoTracks()[0];

		if (!videoTrack) {
			throw new Error('No active video track found on the stream.');
		}

		// Initialize the ImageCapture controller instance passing the video track
		imageCapturer = new ImageCapture(videoTrack);

		// Update control button states once initialization is complete
		startBtn.disabled = true;
		captureBtn.disabled = false;
	} catch (error) {
		// Graceful error handling for permission denials or device unavailability
		console.error('Camera access failed:', error);
		statusElement.textContent = `Error accessing camera: ${error.message}`;
	}
};

/**
 * Captures a high-resolution snapshot using the native ImageCapture API.
 */
const takePhoto = async () => {
	if (!imageCapturer) return;

	try {
		// Execute takePhoto(), returning a Promise that resolves directly to a JPEG/PNG Blob
		const photoBlob = await imageCapturer.takePhoto();

		// Create an Object URL representing the image Blob for lightweight DOM rendering
		const imageUrl = URL.createObjectURL(photoBlob);

		// Clean up memory from previously created Blob URLs to prevent memory leaks
		if (imageElement.src && imageElement.src.startsWith('blob:')) {
			URL.revokeObjectURL(imageElement.src);
		}

		// Assign the generated Object URL to the image element
		imageElement.src = imageUrl;
	} catch (error) {
		// Handle hardware acquisition failures during frame capture
		console.error('Failed to take photo:', error);
		statusElement.textContent = `Capture failed: ${error.message}`;
	}
};

// Attach event listeners to execution controls
startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', takePhoto);

/**
 * Insertable Streams for MediaStreamTrack Demo
 * Hess WebTech (hesswebtech.com)
 *
 * Demonstrates consuming a raw video MediaStreamTrack via MediaStreamTrackProcessor,
 * piping frames through a custom TransformStream for real-time natural overlay processing,
 * and pushing transformed frames into a generator sink to record via MediaRecorder.
 */

// --- DOM References ---
const previewVideo = document.querySelector('#preview');
const playbackVideo = document.querySelector('#playback');
const btnStart = document.querySelector('#btnStart');
const btnRecord = document.querySelector('#btnRecord');
const btnStop = document.querySelector('#btnStop');
const statusBanner = document.querySelector('#status');

// --- State Management ---
let rawStream = null; // Captures direct webcam output from getUserMedia
let processedStream = null; // Holds the final synthesized track containing transformed frames
let mediaRecorder = null; // MediaRecorder instance attached to the processed stream
let recordedChunks = []; // Buffer array collecting encoded WebM data packets

/**
 * Normalizes browser differences between VideoTrackGenerator and MediaStreamTrackGenerator.
 * Returns an object containing the writable sink and standard MediaStreamTrack.
 */
const createTrackGenerator = () => {
	// Spec standard implementation (Chrome 94+)
	if ('VideoTrackGenerator' in window) {
		const generator = new VideoTrackGenerator();
		return {
			writable: generator.writable,
			track: generator.track
		};
	}

	// Pre-standard or alternative naming variant
	if ('MediaStreamTrackGenerator' in window) {
		const generator = new MediaStreamTrackGenerator({ kind: 'video' });
		const track = generator.track || generator;
		return {
			writable: generator.writable,
			track
		};
	}

	throw new Error(
		'Insertable Streams generator is not supported in this browser.'
	);
};

/**
 * Validates user agent support for both readable extraction and track generation.
 */
const verifySupport = () => {
	const hasProcessor = 'MediaStreamTrackProcessor' in window;
	const hasGenerator =
		'VideoTrackGenerator' in window || 'MediaStreamTrackGenerator' in window;

	if (!hasProcessor || !hasGenerator) {
		statusBanner.textContent =
			'Error: Insertable Streams API is not supported in this browser. Ensure Chrome/Edge 94+ or flags enabled.';
		statusBanner.style.color = '#f87171';
		btnStart.disabled = true;
		return false;
	}
	return true;
};

/**
 * Creates the TransformStream that intercepts, stamps with a watermark, and outputs VideoFrames.
 * Retains natural true-color camera rendering without inversion filters.
 */
const createFrameTransformer = () => {
	// Maintain an OffscreenCanvas across transform iterations to avoid per-frame GC allocations
	const offscreen = new OffscreenCanvas(640, 480);
	const ctx = offscreen.getContext('2d', { willReadFrequently: true });

	return new TransformStream({
		transform: async (videoFrame, controller) => {
			const width = videoFrame.displayWidth;
			const height = videoFrame.displayHeight;

			// Dynamically match offscreen canvas dimensions if incoming frame size changes
			if (offscreen.width !== width || offscreen.height !== height) {
				offscreen.width = width;
				offscreen.height = height;
			}

			// 1. Draw raw video frame in natural, true color
			ctx.drawImage(videoFrame, 0, 0, width, height);

			// 2. Render real-time watermark overlay with timestamp
			ctx.fillStyle = '#0284c7';
			ctx.font = 'bold 18px monospace';
			ctx.fillText('HESS WEBTECH | LIVE PIPELINE', 20, 36);

			// 3. Construct new VideoFrame with exact microsecond timestamp preservation
			const newFrame = new VideoFrame(offscreen, {
				timestamp: videoFrame.timestamp
			});

			// Explicitly close input frame handle to prevent memory and GPU leaks
			videoFrame.close();

			// Enqueue the new frame to the stream output controller
			controller.enqueue(newFrame);
		}
	});
};

/**
 * Requests camera access, connects the stream pipeline, and displays preview
 */
const initPipeline = async () => {
	try {
		statusBanner.textContent = 'Requesting camera stream...';

		// Acquire source video track from hardware webcam
		rawStream = await navigator.mediaDevices.getUserMedia({
			video: { width: 640, height: 480 },
			audio: false
		});

		const [videoTrack] = rawStream.getVideoTracks();

		// 1. Instantiate the source processor (turns track into a ReadableStream of VideoFrames)
		const processor = new MediaStreamTrackProcessor({ track: videoTrack });

		// 2. Instantiate the sink generator (provides WritableStream and target MediaStreamTrack)
		const { writable, track: outputTrack } = createTrackGenerator();

		// Guard check to confirm valid MediaStreamTrack extraction
		if (!outputTrack || !(outputTrack instanceof MediaStreamTrack)) {
			throw new Error(
				'Resolved generator object is not a valid MediaStreamTrack.'
			);
		}

		// 3. Connect: Processor -> Custom Transformer -> Generator Sink
		const transformer = createFrameTransformer();
		processor.readable
			.pipeThrough(transformer)
			.pipeTo(writable)
			.catch((err) => {
				console.error('Pipeline processing error:', err);
			});

		// 4. Wrap generated track into a standard MediaStream and assign to DOM
		processedStream = new MediaStream([outputTrack]);
		previewVideo.srcObject = processedStream;

		// Update UI controls
		btnStart.disabled = true;
		btnRecord.disabled = false;
		statusBanner.textContent =
			'Stream connected. Ready to record transformed track.';
		statusBanner.style.color = '#94a3b8';
	} catch (err) {
		statusBanner.textContent = `Initialization Failed: ${err.message}`;
		statusBanner.style.color = '#f87171';
		console.error(err);
	}
};

/**
 * Captures the processed stream via MediaRecorder
 */
const startRecording = () => {
	recordedChunks = [];

	// Prefer VP9 codec if supported; fallback to standard webm container
	const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
		? { mimeType: 'video/webm;codecs=vp9' }
		: { mimeType: 'video/webm' };

	mediaRecorder = new MediaRecorder(processedStream, options);

	// Buffer incoming compressed video packets
	mediaRecorder.ondataavailable = (event) => {
		if (event.data && event.data.size > 0) {
			recordedChunks.push(event.data);
		}
	};

	// Finalize recording and set video source for playback
	mediaRecorder.onstop = () => {
		const blob = new Blob(recordedChunks, { type: 'video/webm' });
		playbackVideo.src = URL.createObjectURL(blob);
		statusBanner.textContent = 'Recording finalized. Ready for playback.';
	};

	mediaRecorder.start();
	btnRecord.disabled = true;
	btnStop.disabled = false;
	statusBanner.textContent = 'Recording transformed stream...';
};

/**
 * Halts active recording and toggles button states
 */
const stopRecording = () => {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
		btnRecord.disabled = false;
		btnStop.disabled = true;
	}
};

// --- Event Listeners ---
btnStart.addEventListener('click', () => {
	if (verifySupport()) initPipeline();
});
btnRecord.addEventListener('click', () => startRecording());
btnStop.addEventListener('click', () => stopRecording());

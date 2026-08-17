import { capture, paintColor, paintScreen, PALETTES, SCREEN_HEIGHT, SCREEN_WIDTH, SENSOR } from './camera.js';

const WHEEL_FRAMES = 4;
const TINTS = [
	[0xc0, 0x28, 0x28],
	[0x28, 0xa0, 0x38],
	[0x28, 0x48, 0xc8]
];
const FILTERS = [0, 1, 2];

const stage = document.querySelector('.stage');
const still = document.querySelector('.still');
const screen = document.querySelector('canvas');
const onButton = document.querySelector('#on');
const snapButton = document.querySelector('#snap');
const offButton = document.querySelector('#off');
const radios = [...document.querySelectorAll('input[name="mode"]')];
const status = document.querySelector('[role="status"]');

const ctx = screen.getContext('2d');
const sensor = document.createElement('canvas');
sensor.width = sensor.height = SENSOR;
const sensorCtx = sensor.getContext('2d', { willReadFrequently: true });
sensorCtx.imageSmoothingQuality = 'high';
const image = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
const video = document.createElement('video');
video.muted = true;
video.playsInline = true;

let mode = 'Green';
let on = false;
let starting = false;
let stream = null;
let shades = null;
let channels = [null, null, null];
let frame = 0;
let frames = 0;

function render() {
	const grid = mode === 'Color' ? 2 : 1;
	if (screen.width !== SCREEN_WIDTH * grid) {
		screen.width = SCREEN_WIDTH * grid;
		screen.height = SCREEN_HEIGHT * grid;
	}
	const scale = Math.max(
		1,
		Math.floor(Math.min(stage.clientWidth / (SCREEN_WIDTH * grid), stage.clientHeight / (SCREEN_HEIGHT * grid)))
	);
	screen.style.width = `${SCREEN_WIDTH * grid * scale}px`;
	screen.style.height = `${SCREEN_HEIGHT * grid * scale}px`;
	screen.setAttribute(
		'aria-label',
		mode === 'Color'
			? 'Game camera views through red, green and blue filters, and the color composite'
			: 'Game camera view'
	);
	onButton.hidden = on;
	snapButton.hidden = !on;
	offButton.hidden = !on;
}

function paint() {
	if (mode !== 'Color') {
		paintScreen(image.data, shades, PALETTES[mode]);
		ctx.putImageData(image, 0, 0);
		return;
	}
	for (const f of FILTERS) {
		paintScreen(image.data, channels[f], PALETTES.Gray, TINTS[f]);
		ctx.putImageData(image, (f % 2) * SCREEN_WIDTH, Math.floor(f / 2) * SCREEN_HEIGHT);
	}
	if (on) paintColor(image.data, channels);
	else paintScreen(image.data, null, PALETTES.Gray);
	ctx.putImageData(image, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function tick() {
	if (video.readyState >= video.HAVE_CURRENT_DATA) {
		const side = Math.min(video.videoWidth, video.videoHeight);
		sensorCtx.setTransform(-1, 0, 0, 1, SENSOR, 0);
		sensorCtx.drawImage(
			video,
			(video.videoWidth - side) / 2,
			(video.videoHeight - side) / 2,
			side,
			side,
			0,
			0,
			SENSOR,
			SENSOR
		);
		const rgba = sensorCtx.getImageData(0, 0, SENSOR, SENSOR).data;
		if (mode === 'Color') {
			const filter = FILTERS[Math.floor(frames++ / WHEEL_FRAMES) % 3];
			channels[filter] = capture(rgba, Math.random, filter);
		} else {
			shades = capture(rgba, Math.random);
		}
	}
	paint();
	frame = requestAnimationFrame(tick);
}

function stop() {
	cancelAnimationFrame(frame);
	stream?.getTracks().forEach((track) => track.stop());
	stream = null;
	video.srcObject = null;
	shades = null;
	channels = [null, null, null];
	on = false;
	render();
	paint();
}

async function open() {
	status.textContent = '';
	if (!navigator.mediaDevices?.getUserMedia) {
		status.textContent = 'This browser can’t use a camera here (it needs HTTPS or localhost).';
		return;
	}
	try {
		stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
			audio: false
		});
	} catch {
		status.textContent = 'No camera, or permission was refused.';
		return;
	}
	video.srcObject = stream;
	try {
		await video.play();
	} catch {
		stream.getTracks().forEach((track) => track.stop());
		stream = null;
		video.srcObject = null;
		status.textContent = 'The camera started, but its video wouldn’t play.';
		return;
	}
	on = true;
	render();
	frame = requestAnimationFrame(tick);
}

async function start() {
	if (starting || stream) return;
	starting = true;
	try {
		await open();
	} finally {
		starting = false;
	}
}

function snap() {
	const [sx, sy] = mode === 'Color' ? [SCREEN_WIDTH, SCREEN_HEIGHT] : [0, 0];
	const big = document.createElement('canvas');
	big.width = SCREEN_WIDTH * 4;
	big.height = SCREEN_HEIGHT * 4;
	const bigCtx = big.getContext('2d');
	bigCtx.imageSmoothingEnabled = false;
	bigCtx.drawImage(screen, sx, sy, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, big.width, big.height);
	big.toBlob((blob) => {
		if (!blob) return;
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `game-camera-${Date.now()}.png`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	});
}

onButton.addEventListener('click', start);
snapButton.addEventListener('click', snap);
offButton.addEventListener('click', stop);
for (const radio of radios) {
	radio.addEventListener('change', () => {
		mode = radio.value;
		render();
		paint();
	});
	radio.disabled = false;
}
new ResizeObserver(render).observe(stage);

still.style.display = 'none';
screen.hidden = false;
onButton.disabled = false;
render();
paint();

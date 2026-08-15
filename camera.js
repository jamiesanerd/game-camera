export const SENSOR = 128;
export const WIDTH = 128;
export const HEIGHT = 112;
const CROP_TOP = 8;

export const SCREEN_WIDTH = 160;
export const SCREEN_HEIGHT = 144;
export const INSET = 16;

export const DITHER = [
	0x2a, 0x5e, 0x9b, 0x51, 0x8b, 0xca, 0x33, 0x69, 0xa6, 0x5a, 0x97, 0xd6, 0x44, 0x7c, 0xba, 0x37, 0x6d, 0xaa,
	0x4d, 0x87, 0xc6, 0x40, 0x78, 0xb6, 0x30, 0x65, 0xa2, 0x57, 0x93, 0xd2, 0x2d, 0x61, 0x9e, 0x54, 0x8f, 0xce,
	0x4a, 0x84, 0xc2, 0x3d, 0x74, 0xb2, 0x47, 0x80, 0xbe, 0x3a, 0x71, 0xae
];

export const ENHANCE = 0.5;
export const SATURATION = 0.05;
export const STREAKS = 3;
export const NOISE = 2;

export const PALETTES = {
	Green: [
		[0x0f, 0x38, 0x0f],
		[0x30, 0x62, 0x30],
		[0x8b, 0xac, 0x0f],
		[0x9b, 0xbc, 0x0f]
	],
	Gray: [
		[0x00, 0x00, 0x00],
		[0x55, 0x55, 0x55],
		[0xaa, 0xaa, 0xaa],
		[0xff, 0xff, 0xff]
	]
};

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

export function toGray(rgba, filter) {
	const gray = new Uint8ClampedArray(rgba.length / 4);
	for (let i = 0; i < gray.length; i++) {
		gray[i] =
			filter === undefined
				? 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]
				: rgba[i * 4 + filter];
	}
	return gray;
}

export function autoContrast(gray, saturation = SATURATION) {
	const histogram = new Uint32Array(256);
	for (const v of gray) histogram[v]++;
	const clip = gray.length * saturation;
	let low = 0;
	for (let seen = histogram[0]; seen <= clip && low < 255; ) seen += histogram[++low];
	let high = 255;
	for (let seen = histogram[255]; seen <= clip && high > 0; ) seen += histogram[--high];
	if (high <= low) return;
	const scale = 255 / (high - low);
	for (let i = 0; i < gray.length; i++) gray[i] = clamp((gray[i] - low) * scale);
}

export function sensorArtifacts(gray, size, rand) {
	for (let i = 0; i < gray.length; i++) {
		const streak = i % size % 2 === 0 ? STREAKS : -STREAKS;
		const normal = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
		gray[i] = clamp(gray[i] + streak + NOISE * Math.round(normal));
	}
}

export function enhanceEdges(gray, size, alpha = ENHANCE) {
	const out = new Uint8ClampedArray(gray);
	for (let y = 1; y < size - 1; y++) {
		for (let x = 1; x < size - 1; x++) {
			const i = y * size + x;
			const edge = 4 * gray[i] - gray[i - size] - gray[i + size] - gray[i - 1] - gray[i + 1];
			out[i] = clamp(gray[i] + alpha * edge);
		}
	}
	return out;
}

export function dither(gray, size) {
	const shades = new Uint8Array(gray.length);
	for (let i = 0; i < gray.length; i++) {
		const cell = ((Math.floor(i / size) % 4) * 4 + (i % size) % 4) * 3;
		const v = gray[i];
		shades[i] = v < DITHER[cell] ? 0 : v < DITHER[cell + 1] ? 1 : v < DITHER[cell + 2] ? 2 : 3;
	}
	return shades;
}

export function capture(rgba, rand, filter) {
	const gray = toGray(rgba, filter);
	autoContrast(gray);
	sensorArtifacts(gray, SENSOR, rand);
	const shades = dither(enhanceEdges(gray, SENSOR), SENSOR);
	return shades.subarray(CROP_TOP * SENSOR, (CROP_TOP + HEIGHT) * SENSOR);
}

function eachScreenPixel(pixel, frame) {
	for (let y = 0; y < SCREEN_HEIGHT; y++) {
		for (let x = 0; x < SCREEN_WIDTH; x++) {
			const px = x - INSET;
			const py = y - INSET;
			const o = (y * SCREEN_WIDTH + x) * 4;
			if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
				pixel(o, py * WIDTH + px);
			} else {
				const line = px >= -1 && px <= WIDTH && py >= -1 && py <= HEIGHT;
				frame(o, line ? 0 : 1);
			}
		}
	}
}

function put(out, o, [r, g, b]) {
	out[o] = r;
	out[o + 1] = g;
	out[o + 2] = b;
	out[o + 3] = 255;
}

export function paintScreen(out, shades, palette, frameColor) {
	eachScreenPixel(
		(o, i) => put(out, o, palette[shades ? shades[i] : 3]),
		(o, shade) => put(out, o, shade === 1 && frameColor ? frameColor : palette[shade])
	);
}

export function paintColor(out, channels) {
	eachScreenPixel(
		(o, i) => {
			for (let c = 0; c < 3; c++) out[o + c] = channels[c] ? channels[c][i] * 85 : 0;
			out[o + 3] = 255;
		},
		(o, shade) => put(out, o, PALETTES.Gray[shade])
	);
}

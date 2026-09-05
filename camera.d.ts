export declare const SENSOR: number;
export declare const WIDTH: number;
export declare const HEIGHT: number;

export declare const SCREEN_WIDTH: number;
export declare const SCREEN_HEIGHT: number;
export declare const INSET: number;

export declare const DITHER: readonly number[];

export declare const ENHANCE: number;
export declare const SATURATION: number;
export declare const STREAKS: number;
export declare const NOISE: number;

export type Rgb = readonly [number, number, number];
export type Palette = readonly Rgb[];
export type Filter = 0 | 1 | 2;

export type PaletteName =
	| 'Green'
	| 'Pocket'
	| 'Light'
	| 'Gray'
	| 'Negative'
	| 'Red'
	| 'Sepia'
	| 'Tangerine'
	| 'Sunset'
	| 'Pink'
	| 'Grape'
	| 'Ocean'
	| 'Mint'
	| 'Neon';

export declare const PALETTES: Readonly<Record<PaletteName, Palette>>;
export declare const PRIMARIES: readonly Rgb[];

export declare function toHex(color: Rgb): string;
export declare function fromHex(hex: string): Rgb;
export declare function ramp(color: Rgb): Palette;

export declare function toGray(rgba: ArrayLike<number>, filter?: Filter): Uint8ClampedArray;
export declare function autoContrast(gray: Uint8ClampedArray, saturation?: number): void;
export declare function sensorArtifacts(gray: Uint8ClampedArray, size: number, rand: () => number): void;
export declare function enhanceEdges(gray: Uint8ClampedArray, size: number, alpha?: number): Uint8ClampedArray;
export declare function dither(gray: Uint8ClampedArray, size: number): Uint8Array;
export declare function capture(rgba: ArrayLike<number>, rand: () => number, filter?: Filter): Uint8Array;

export declare function paintScreen(
	out: Uint8ClampedArray,
	shades: Uint8Array | null,
	palette: Palette,
	frameColor?: Rgb
): void;
export declare function paintColor(
	out: Uint8ClampedArray,
	channels: readonly (Uint8Array | null)[],
	colors?: readonly Rgb[]
): void;

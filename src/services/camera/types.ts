/**
 * Camera / barcode adapter surface.
 * The presentation layer depends on this port, not vision-camera directly.
 */
export type BarcodeScanResult = {
  readonly value: string;
  readonly type: string;
};

export type CodeScannerConfig = {
  onCodeScanned: (result: BarcodeScanResult) => void;
  /** Code types to recognise. */
  codeTypes?: ReadonlyArray<
    'ean-13' | 'ean-8' | 'code-128' | 'qr' | 'upc-a' | 'upc-e'
  >;
};

export const DEFAULT_CODE_TYPES: NonNullable<CodeScannerConfig['codeTypes']> = [
  'ean-13',
  'ean-8',
  'code-128',
  'qr',
  'upc-a',
  'upc-e',
];

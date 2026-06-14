declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }

  type Convert = (options: ConvertOptions) => Promise<Buffer>;

  const convert: Convert;
  export default convert;
}

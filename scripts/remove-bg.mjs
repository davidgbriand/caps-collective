import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/together-we-dare-new.jpg');
const outputPath = path.join(__dirname, '../public/together-we-dare-clean.png');

async function removeBackground() {
  try {
    // Read the image without any resizing to preserve quality
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    console.log('Original image:', metadata.width, 'x', metadata.height);

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    // Create a new buffer with alpha channel
    const pixels = new Uint8Array(info.width * info.height * 4);

    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];

      // Check if pixel is close to white/light background
      // Using a more aggressive threshold for white/near-white pixels
      const brightness = (r + g + b) / 3;
      const isWhitish = r > 240 && g > 240 && b > 240;
      const isLightGray = r > 200 && g > 200 && b > 200 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
      const isBackground = isWhitish || (isLightGray && brightness > 210);

      pixels[i * 4] = r;
      pixels[i * 4 + 1] = g;
      pixels[i * 4 + 2] = b;
      pixels[i * 4 + 3] = isBackground ? 0 : 255;
    }

    await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png({ compressionLevel: 0 }) // No compression for best quality
    .toFile(outputPath);

    console.log('Background removed successfully!');
    console.log(`Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

removeBackground();


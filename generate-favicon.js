import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFavicons() {
  const inputPath = path.join(__dirname, 'public', 'new-logo.png');
  const publicDir = path.join(__dirname, 'public');
  
  try {
    // Generate favicon.ico (32x32)
    await sharp(inputPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    
    // Generate favicon-16x16.png
    await sharp(inputPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    
    // Generate apple-touch-icon.png (180x180)
    await sharp(inputPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // Generate a larger version for og-image (1200x630)
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    
    // For favicon.ico, we'll use the 32x32 version
    const favicon32Buffer = await sharp(inputPath)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    // Copy the 32x32 PNG as favicon.ico (browsers accept PNG in .ico files)
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32Buffer);
    
    console.log('✅ All favicon files generated successfully!');
    console.log('Generated files:');
    console.log('- favicon.ico (32x32)');
    console.log('- favicon-16x16.png');
    console.log('- favicon-32x32.png');
    console.log('- apple-touch-icon.png (180x180)');
    console.log('- og-image.png (1200x630)');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
  }
}

generateFavicons();
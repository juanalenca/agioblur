const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function resizeIcons() {
  const sourcePath = path.join(__dirname, 'logo-extensao.png');
  const iconsDir = path.join(__dirname, 'icons');
  
  if (!fs.existsSync(iconsDir)){
    fs.mkdirSync(iconsDir);
  }

  try {
    const image = await Jimp.read(sourcePath);
    // Since it might not be a square, Jimp has crop or cover. We'll use contain to make it a square or just resize if it's already square.
    // The user said they updated the image. Assuming it's already square-ish or can be covered.
    // We will use autocrop to remove transparent padding if any, then square it.
    image.autocrop();

    const sizes = [16, 32, 48, 128];
    for (const size of sizes) {
      const cloned = image.clone();
      cloned.contain(size, size);
      const dest = path.join(iconsDir, `icon${size}.png`);
      await cloned.writeAsync(dest);
      console.log(`Created ${dest}`);
    }
  } catch (err) {
    console.error('Error resizing:', err);
  }
}

resizeIcons();

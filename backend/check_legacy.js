const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');
const Product = require('./models/Product');

async function checkLegacyImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const categories = await Category.find({});
    const products = await Product.find({});

    let legacyCount = 0;
    let cloudinaryCount = 0;
    let missingCount = 0;

    const report = {
      legacy: [],
      cloudinary: [],
      missing: []
    };

    const processItem = (item, type) => {
      const img = item.image;
      if (!img) {
        missingCount++;
        report.missing.push({ type, id: item._id, name: item.name });
      } else if (img.startsWith('/uploads/')) {
        legacyCount++;
        report.legacy.push({ type, id: item._id, name: item.name, path: img });
      } else if (img.includes('res.cloudinary.com')) {
        cloudinaryCount++;
        report.cloudinary.push({ type, id: item._id, name: item.name, path: img });
      } else {
         // other URLs
         cloudinaryCount++;
      }
    };

    categories.forEach(c => processItem(c, 'Category'));
    products.forEach(p => processItem(p, 'Product'));

    console.log('\n--- Legacy Image Report ---');
    console.log(`Cloudinary/Remote Images: ${cloudinaryCount}`);
    console.log(`Legacy Local Images (/uploads/): ${legacyCount}`);
    console.log(`Missing Images: ${missingCount}`);
    
    if (legacyCount > 0) {
      console.log('\nLegacy Records (Need Re-upload before production):');
      report.legacy.forEach(r => console.log(`- [${r.type}] ${r.name} (${r.path})`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLegacyImages();

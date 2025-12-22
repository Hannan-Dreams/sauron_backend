// Test file to debug route loading issue
console.log('Step 1: Loading express...');
const express = require('express');

console.log('Step 2: Loading upload config...');
const { upload } = require('./src/config/upload');
console.log('Upload loaded:', typeof upload.single);

console.log('Step 3: Loading controller...');
const techProductsController = require('./src/controllers/techProductsController');
console.log('Controller functions:', Object.keys(techProductsController));

console.log('Step 4: Creating router...');
const router = express.Router();

console.log('Step 5: Adding routes...');
router.post(
    '/',
    upload.single('image'),
    techProductsController.createProduct
);

console.log('✅ All steps completed successfully!');

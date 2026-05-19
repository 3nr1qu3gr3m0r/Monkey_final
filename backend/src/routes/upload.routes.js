const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinaryController = require('../controllers/upload.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Configuramos Multer para que guarde el archivo en la memoria RAM temporalmente
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST: /api/upload
// Usamos upload.single('image') porque en el frontend pusimos formData.append('image', file)
router.post('/', authenticateToken, upload.single('image'), cloudinaryController.uploadImage);

module.exports = router;
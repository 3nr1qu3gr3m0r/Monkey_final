const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Buscar productos y servicios: GET /api/search?q=pastel
router.get('/', searchController.buscar);

module.exports = router;
const express = require('express');
const router = express.Router();
const controller = require('../controllers/furnitureController');
const authMiddleware = require('../middleware/authMiddleware');


router.use(authMiddleware);
router.get('/', controller.getAllFurniture);
router.post('/', controller.createFurniture);
router.put('/:id', controller.updateFurniture);
router.delete('/:id', controller.deleteFurniture);
// Rute Publik (Tanpa Auth Middleware)
router.get('/public', controller.getPublicFurniture);

module.exports = router;
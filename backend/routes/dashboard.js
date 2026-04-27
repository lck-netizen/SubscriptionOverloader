const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();
router.use(requireAuth);

router.get('/stats', asyncHandler(getStats));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { getInsights } = require('../controllers/insightsController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(getInsights));

module.exports = router;

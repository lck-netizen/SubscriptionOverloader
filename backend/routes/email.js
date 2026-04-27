const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { sendTestEmail } = require('../controllers/emailController');

const router = express.Router();
router.use(requireAuth);

router.post('/test', asyncHandler(sendTestEmail));

module.exports = router;

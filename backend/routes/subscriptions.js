const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const {
  getSubscriptions,
  getSubscriptionMeta,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  simulatePayment,
} = require('../controllers/subscriptionController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(getSubscriptions));
router.get('/meta', asyncHandler(getSubscriptionMeta));
router.post('/', asyncHandler(createSubscription));
router.put('/:id', asyncHandler(updateSubscription));
router.delete('/:id', asyncHandler(deleteSubscription));
router.post('/:id/simulate-payment', asyncHandler(simulatePayment));

module.exports = router;

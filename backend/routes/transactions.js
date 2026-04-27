const express = require('express');
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransaction);

module.exports = router;

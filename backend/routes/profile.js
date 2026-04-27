const express = require('express');
const upload = require('../middleware/upload');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const {
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfile,
  changePassword,
} = require('../controllers/profileController');

const router = express.Router();
router.use(requireAuth);

router.post('/profile-picture', upload.single('profilePicture'), asyncHandler(uploadProfilePicture));
router.delete('/profile-picture', asyncHandler(deleteProfilePicture));
router.put('/', asyncHandler(updateProfile));
router.put('/password', asyncHandler(changePassword));

module.exports = router;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

function getUploadPath() {
  return path.join(__dirname, '..', 'uploads');
}

async function uploadProfilePicture(user, file) {
  try {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const relativePath = path.join('uploads', file.filename).replace(/\\/g, '/');
    user.profilePicture = relativePath;
    await user.save();

    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[profile:upload]', err);
    throw new AppError('Could not upload profile picture', 500);
  }
}

async function deleteProfilePicture(user) {
  try {
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      user.profilePicture = '';
      await user.save();
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[profile:delete-picture]', err);
    throw new AppError('Could not delete profile picture', 500);
  }
}

async function updateProfile(user, updates) {
  try {
    const {
      name,
      monthlyBudget,
      email,
      bio,
      favoriteOTT,
      favoriteMovies,
      favoriteServices,
      dateOfBirth,
      phoneNumber,
      address,
      website,
      socialLinks,
    } = updates;

    if (name != null) user.name = String(name).trim();
    if (monthlyBudget != null) user.monthlyBudget = Number(monthlyBudget);
    if (email && email.toLowerCase().trim() !== user.email) {
      const lower = email.toLowerCase().trim();
      const exists = await User.findOne({ email: lower });
      if (exists) {
        throw new AppError('Email already in use', 409);
      }
      user.email = lower;
      user.isVerified = false;
    }

    if (bio !== undefined) user.bio = bio;
    if (favoriteOTT !== undefined) user.favoriteOTT = favoriteOTT;
    if (favoriteMovies !== undefined) user.favoriteMovies = favoriteMovies;
    if (favoriteServices !== undefined) user.favoriteServices = favoriteServices;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;

    await user.save();
    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[profile:update]', err);
    throw new AppError('Could not update profile', 500);
  }
}

async function changePassword(user, currentPassword, newPassword) {
  try {
    if (!currentPassword || !newPassword) {
      throw new AppError('Both fields required', 400);
    }
    if (newPassword.length < 6) {
      throw new AppError('Password too short', 400);
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[profile:password]', err);
    throw new AppError('Could not change password', 500);
  }
}

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfile,
  changePassword,
};

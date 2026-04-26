const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_ALG = 'HS256';
const ACCESS_TTL = 60 * 60 * 24 * 7; // 7 days

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { algorithm: JWT_ALG, expiresIn: ACCESS_TTL }
  );
}

function setAuthCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ACCESS_TTL * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie('access_token', { path: '/', sameSite: 'none', secure: true });
}

async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return res.status(401).json({ detail: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [JWT_ALG] });
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ detail: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

module.exports = { signAccessToken, setAuthCookie, clearAuthCookie, requireAuth };

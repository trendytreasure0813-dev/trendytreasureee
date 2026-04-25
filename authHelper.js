const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);
const randomBytes = util.promisify(crypto.randomBytes);

// Simple secret for Token Signature (HMAC)
const JWT_SECRET = 'trendytreasure-secret-key';

const hashPassword = async (password) => {
    const salt = await randomBytes(16);
    const buf = await scrypt(password, salt, 64);
    return `${buf.toString('hex')}.${salt.toString('hex')}`;
};

const verifyPassword = async (storedPassword, suppliedPassword) => {
    const [hashedPassword, salt] = storedPassword.split('.');
    if (!hashedPassword || !salt) return false;

    const buf = await scrypt(suppliedPassword, Buffer.from(salt, 'hex'), 64);
    return buf.toString('hex') === hashedPassword;
};

const generateToken = (user) => {
    const payload = JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() });
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    return `${Buffer.from(payload).toString('base64')}.${signature}`;
};

const verifyToken = (token) => {
    try {
        if (!token) return null;

        const [payloadB64, signature] = token.split('.');
        if (!payloadB64 || !signature) return null;

        const payloadStr = Buffer.from(payloadB64, 'base64').toString();

        // Verify signature
        const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');

        if (signature === expectedSignature) {
            return JSON.parse(payloadStr);
        }
        return null;
    } catch (e) {
        return null;
    }
};

module.exports = { hashPassword, verifyPassword, generateToken, verifyToken };

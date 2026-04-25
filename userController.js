const { readData, writeData } = require('./fileHandler');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const { hashPassword, verifyPassword, generateToken } = require('./authHelper');
const { isValidEmail, isValidPassword } = require('./validationHelper');
const crypto = require('crypto');

const USERS_FILE = 'users.json';

const registerUser = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return sendError(res, 400, 'Name, email, and password are required');
        }

        if (!isValidEmail(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        if (!isValidPassword(password)) {
            return sendError(res, 400, 'Password must be at least 6 characters');
        }

        const users = await readData(USERS_FILE);

        if (users.find(u => u.email === email)) {
            return sendError(res, 409, 'User already exists');
        }

        const hashedPassword = await hashPassword(password);

        const newUser = {
            id: crypto.randomUUID(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData(USERS_FILE, users);

        const { password: _, ...userWithoutPassword } = newUser;
        sendJSON(res, 201, { message: 'User registered successfully', user: userWithoutPassword });

    } catch (error) {
        console.error(error);
        sendError(res, 500, 'Internal Server Error');
    }
};

const loginUser = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { email, password } = body;

        if (!email || !password) {
            return sendError(res, 400, 'Email and password are required');
        }

        const users = await readData(USERS_FILE);
        const user = users.find(u => u.email === email);

        if (!user) {
            return sendError(res, 401, 'Invalid credentials');
        }

        const isMatch = await verifyPassword(user.password, password);

        if (!isMatch) {
            return sendError(res, 401, 'Invalid credentials');
        }

        const token = generateToken(user);

        const { password: _, ...userWithoutPassword } = user;
        sendJSON(res, 200, { message: 'Login successful', token, user: userWithoutPassword });

    } catch (error) {
        console.error(error);
        sendError(res, 500, 'Internal Server Error');
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await readData(USERS_FILE);
        const usersSafe = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
        sendJSON(res, 200, usersSafe);
    } catch (error) {
        sendError(res, 500, 'Internal Server Error');
    }
};

module.exports = { registerUser, loginUser, getAllUsers };

const http = require('http');
const url = require('url');
const { sendError, sendJSON } = require('./utils/responseHelper');
const { registerUser, loginUser, getAllUsers } = require('./utils/userController');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('./utils/productController');
const { addToCart, getCart } = require('./utils/cartController');
const { createOrder, getOrders } = require('./utils/orderController');
const { verifyToken } = require('./utils/authHelper');

const PORT = 5000;

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Preflight Request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Authentication Middleware
    const authenticate = (req) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];
        return verifyToken(token);
    };

    // Route: /register
    if (path === '/register' && method === 'POST') {
        return registerUser(req, res);
    }

    // Route: /login
    if (path === '/login' && method === 'POST') {
        return loginUser(req, res);
    }

    // Route: /users
    if (path === '/users' && method === 'GET') {
        req.user = authenticate(req); // Optional auth for listing users
        return getAllUsers(req, res);
    }

    // Route: /products
    if (path === '/products') {
        if (method === 'GET') return getAllProducts(req, res);
        if (method === 'POST') {
            req.user = authenticate(req);
            if (!req.user) return sendError(res, 401, 'Unauthorized');
            return createProduct(req, res);
        }
    }

    // Route: /products/:id
    if (path.startsWith('/products/')) {
        const id = path.split('/')[2];
        if (id) {
            if (method === 'GET') return getProductById(req, res, id);
            if (method === 'PUT') {
                req.user = authenticate(req);
                if (!req.user) return sendError(res, 401, 'Unauthorized');
                return updateProduct(req, res, id);
            }
            if (method === 'DELETE') {
                req.user = authenticate(req);
                if (!req.user) return sendError(res, 401, 'Unauthorized');
                return deleteProduct(req, res, id);
            }
        }
    }

    // Route: /cart
    if (path === '/cart') {
        req.user = authenticate(req);
        if (!req.user) return sendError(res, 401, 'Unauthorized');

        if (method === 'GET') return getCart(req, res);
        if (method === 'POST') return addToCart(req, res);
    }

    // Route: /orders
    if (path === '/orders') {
        req.user = authenticate(req);
        if (!req.user) return sendError(res, 401, 'Unauthorized');

        if (method === 'GET') return getOrders(req, res);
        if (method === 'POST') return createOrder(req, res);
    }

    // 404 Route Not Found
    sendError(res, 404, 'Route not found');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

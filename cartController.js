const { readData, writeData } = require('./fileHandler');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');

const CART_FILE = 'cart.json';

// We assume req.user is populated by the auth middleware in server.js
const getCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        const carts = await readData(CART_FILE);
        const userCart = carts.find(c => c.userId === user.id) || { userId: user.id, items: [] };

        sendJSON(res, 200, userCart);
    } catch (error) {
        sendError(res, 500, 'Error fetching cart');
    }
};

const addToCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        const body = await getRequestBody(req);
        const { productId, quantity } = body;

        if (!productId || !quantity) return sendError(res, 400, 'ProductId and quantity required');

        const carts = await readData(CART_FILE);
        let userCartIndex = carts.findIndex(c => c.userId === user.id);

        if (userCartIndex === -1) {
            // Create new cart
            const newCart = { userId: user.id, items: [{ productId, quantity }] };
            carts.push(newCart);
            await writeData(CART_FILE, carts);
            return sendJSON(res, 201, newCart);
        } else {
            // Update existing cart
            const userCart = carts[userCartIndex];
            const itemIndex = userCart.items.findIndex(i => i.productId === productId);

            if (itemIndex > -1) {
                userCart.items[itemIndex].quantity += quantity;
            } else {
                userCart.items.push({ productId, quantity });
            }

            carts[userCartIndex] = userCart;
            await writeData(CART_FILE, carts);
            return sendJSON(res, 200, userCart);
        }
    } catch (error) {
        sendError(res, 500, 'Error updating cart');
    }
};

module.exports = { getCart, addToCart };

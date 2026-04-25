const { readData, writeData } = require('./fileHandler');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const crypto = require('crypto');

const ORDERS_FILE = 'orders.json';
const CART_FILE = 'cart.json';
const PRODUCTS_FILE = 'products.json';

const getOrders = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        const orders = await readData(ORDERS_FILE);
        const userOrders = orders.filter(o => o.userId === user.id);

        sendJSON(res, 200, userOrders);
    } catch (error) {
        sendError(res, 500, 'Error fetching orders');
    }
};

const createOrder = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        // Logic: Create order from current cart
        const carts = await readData(CART_FILE);
        const cartIndex = carts.findIndex(c => c.userId === user.id);
        const userCart = carts[cartIndex];

        if (!userCart || userCart.items.length === 0) {
            return sendError(res, 400, 'Cart is empty');
        }

        const products = await readData(PRODUCTS_FILE);
        const orders = await readData(ORDERS_FILE);

        // Calculate total and Check Stock
        let total = 0;
        const validItems = [];

        for (const item of userCart.items) {
            const productIndex = products.findIndex(p => p.id === item.productId);
            const product = products[productIndex];

            if (!product) {
                return sendError(res, 400, `Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
                return sendError(res, 400, `Insufficient stock for ${product.name}`);
            }

            total += product.price * item.quantity;
            validItems.push({ item, productIndex }); // Store index to update later
        }

        // Deduct Stock
        for (const { item, productIndex } of validItems) {
            products[productIndex].stock -= item.quantity;
        }
        await writeData(PRODUCTS_FILE, products); // Save updated stock

        const newOrder = {
            id: crypto.randomUUID(),
            userId: user.id,
            items: userCart.items,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            totalAmount: total
        };

        orders.push(newOrder);
        await writeData(ORDERS_FILE, orders);

        // Clear cart
        carts[cartIndex].items = [];
        await writeData(CART_FILE, carts);

        sendJSON(res, 201, newOrder);
    } catch (error) {
        console.error(error);
        sendError(res, 500, 'Error creating order');
    }
};

module.exports = { getOrders, createOrder };

const { readData, writeData } = require('./fileHandler');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const crypto = require('crypto');

const PRODUCTS_FILE = 'products.json';

const getAllProducts = async (req, res) => {
    try {
        const products = await readData(PRODUCTS_FILE);
        const parsedUrl = require('url').parse(req.url, true);
        const search = parsedUrl.query.search;
        const category = parsedUrl.query.category;

        let filteredProducts = products;

        if (search) {
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (category) {
            filteredProducts = filteredProducts.filter(p =>
                p.category.toLowerCase() === category.toLowerCase()
            );
        }

        sendJSON(res, 200, filteredProducts);
    } catch (error) {
        sendError(res, 500, 'Error fetching products');
    }
};

const getProductById = async (req, res, id) => {
    try {
        const products = await readData(PRODUCTS_FILE);
        const product = products.find(p => p.id === id);

        if (!product) {
            return sendError(res, 404, 'Product not found');
        }
        sendJSON(res, 200, product);
    } catch (error) {
        sendError(res, 500, 'Error fetching product');
    }
};

const createProduct = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { name, description, price, category, imageUrl, stock } = body;

        if (!name || !price) {
            return sendError(res, 400, 'Name and price are required');
        }

        const products = await readData(PRODUCTS_FILE);
        const newProduct = {
            id: crypto.randomUUID(),
            name,
            description: description || '',
            price: Number(price),
            category: category || 'Uncategorized',
            imageUrl: imageUrl || '',
            stock: Number(stock) || 0,
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);
        await writeData(PRODUCTS_FILE, products);
        sendJSON(res, 201, newProduct);
    } catch (error) {
        sendError(res, 500, 'Error creating product');
    }
};

const updateProduct = async (req, res, id) => {
    try {
        const body = await getRequestBody(req);
        const products = await readData(PRODUCTS_FILE);
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return sendError(res, 404, 'Product not found');
        }

        // Merge existing with new data
        const updatedProduct = { ...products[index], ...body, id: products[index].id }; // Ensure ID doesn't change
        products[index] = updatedProduct;

        await writeData(PRODUCTS_FILE, products);
        sendJSON(res, 200, updatedProduct);
    } catch (error) {
        sendError(res, 500, 'Error updating product');
    }
};

const deleteProduct = async (req, res, id) => {
    try {
        const products = await readData(PRODUCTS_FILE);
        const filteredProducts = products.filter(p => p.id !== id);

        if (products.length === filteredProducts.length) {
            return sendError(res, 404, 'Product not found');
        }

        await writeData(PRODUCTS_FILE, filteredProducts);
        sendJSON(res, 200, { message: 'Product deleted successfully' });
    } catch (error) {
        sendError(res, 500, 'Error deleting product');
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };

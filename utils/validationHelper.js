const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const isValidPassword = (password) => {
    // At least 6 chars
    return password && password.length >= 6;
};

const isValidProduct = (product) => {
    return product.name &&
        typeof product.price === 'number' && product.price > 0 &&
        typeof product.stock === 'number' && product.stock >= 0;
};

module.exports = { isValidEmail, isValidPassword, isValidProduct };

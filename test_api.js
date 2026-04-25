const BASE_URL = 'http://localhost:5000';

const test = async () => {
    let token = '';
    let productId = '';
    let userId = '';

    const log = (msg, data) => {
        console.log(`\n[TEST] ${msg}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    };

    try {
        // 1. Register
        const userRandom = `user_${Date.now()}`;
        const resRegister = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userRandom,
                email: `${userRandom}@example.com`,
                password: 'password123'
            })
        });
        const dataRegister = await resRegister.json();
        log('Register', dataRegister);
        userId = dataRegister.user.id;

        // 2. Login
        const resLogin = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `${userRandom}@example.com`,
                password: 'password123'
            })
        });
        const dataLogin = await resLogin.json();
        log('Login', dataLogin);
        token = dataLogin.token;

        if (!token) throw new Error('No token returned');

        // 3. Create Product
        const resProduct = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Gold Watch',
                price: 5000,
                description: 'Luxury gold watch',
                stock: 10
            })
        });
        const dataProduct = await resProduct.json();
        log('Create Product', dataProduct);
        productId = dataProduct.id;

        // 4. Get Products
        const resGetProducts = await fetch(`${BASE_URL}/products`);
        const dataGetProducts = await resGetProducts.json();
        log('Get Products', dataGetProducts);

        // 5. Add to Cart
        const resCart = await fetch(`${BASE_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });
        const dataCart = await resCart.json();
        log('Add to Cart', dataCart);

        // 6. Get Cart
        const resGetCart = await fetch(`${BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataGetCart = await resGetCart.json();
        log('Get Cart', dataGetCart);

        // 7. Create Order
        const resOrder = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataOrder = await resOrder.json();
        log('Create Order', dataOrder);

        // 8. Get Orders
        const resGetOrders = await fetch(`${BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataGetOrders = await resGetOrders.json();
        log('Get Orders', dataGetOrders);

        console.log('\nAll tests passed!');

    } catch (error) {
        console.error('Test failed:', error);
    }
};

test();

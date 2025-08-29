const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers for production
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// PayPal configuration (LIVE MODE) - Use environment variables for security
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'Ad28CVMHrm_ArFIxt7GBEqjyM-6z9qmyJgIEF8Jaesg7CDJ1ciylbIh2PyT8hi9GJbv2Fe7A4hUjUxwh';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'ECbsfnxh0ev7Z0jB_K7lSR7zWWuAyj1DxQRWsZ5vwPm3NwRTW_WErirjivjJcBaKLUGfNvCSTdf4KpGK';

// PayPal API endpoints (LIVE for production)
const PAYPAL_BASE_URL = 'https://api-m.paypal.com';

// Function to get PayPal access token
async function getPayPalAccessToken() {
    try {
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(`${PAYPAL_BASE_URL}/v1/oauth2/token`, 
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting PayPal access token:', error);
        throw error;
    }
}

// Skin prices
const SKIN_PRICES = {
    'golden': 2.99,
    'ninja': 4.99,
    'cosmic': 3.99,
    'royal': 1.99,
    'legendary': 4.99
};

// Store purchased skins (in production, use a database)
const purchasedSkins = new Set();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create PayPal order
app.post('/create-order', async (req, res) => {
    try {
        const { skinType } = req.body;
        
        // Input validation
        if (!skinType || typeof skinType !== 'string') {
            return res.status(400).json({ error: 'Invalid skin type' });
        }
        
        const price = SKIN_PRICES[skinType];
        
        if (!price) {
            return res.status(400).json({ error: 'Invalid skin type' });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Create PayPal order using PayPal Orders API
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: price.toString()
                },
                description: `${skinType.charAt(0).toUpperCase() + skinType.slice(1)} Yeti Skin`,
                reference_id: skinType
            }]
        };

        // Make actual API call to PayPal
        const response = await axios.post(`${PAYPAL_BASE_URL}/v2/checkout/orders`, orderData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('PayPal order created:', response.data.id);
        
        res.json({
            orderID: response.data.id,
            skinType: skinType,
            price: price
        });

    } catch (error) {
        console.error('Error creating PayPal order:', error.response?.data || error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: 'Failed to create order',
            details: error.response?.data || error.message
        });
    }
});

// Capture PayPal payment
app.post('/capture-order', async (req, res) => {
    try {
        const { orderID, skinType } = req.body;
        
        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Capture the payment with PayPal
        const response = await axios.post(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('PayPal payment captured:', response.data.id);
        
        // Verify payment was successful
        if (response.data.status === 'COMPLETED') {
            // Grant the skin
            purchasedSkins.add(skinType);
            
            res.json({
                success: true,
                skinType: skinType,
                message: 'Payment successful! Skin unlocked.',
                transactionId: response.data.purchase_units[0].payments.captures[0].id
            });
        } else {
            throw new Error('Payment not completed');
        }

    } catch (error) {
        console.error('Error capturing PayPal payment:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
});

// Get purchased skins
app.get('/purchased-skins', (req, res) => {
    res.json(Array.from(purchasedSkins));
});

// Success page
app.get('/success', (req, res) => {
    res.send(`
        <html>
            <head><title>Payment Successful!</title></head>
            <body>
                <h1>🎉 Payment Successful!</h1>
                <p>Your skin has been unlocked!</p>
                <a href="/">Return to Game</a>
            </body>
        </html>
    `);
});

// Cancel page
app.get('/cancel', (req, res) => {
    res.send(`
        <html>
            <head><title>Payment Cancelled</title></head>
            <body>
                <h1>❌ Payment Cancelled</h1>
                <p>No worries, you can try again anytime!</p>
                <a href="/">Return to Game</a>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🎮 Game available at http://localhost:${PORT}`);
});

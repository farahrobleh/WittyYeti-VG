const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const Database = require('./database');
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

// Security middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://wittyyetigame.up.railway.app'] : ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting for production
if (process.env.NODE_ENV === 'production') {
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files from current directory

// PayPal configuration (LIVE MODE) - Use environment variables for security
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Validate required environment variables
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('❌ CRITICAL: PayPal credentials not set in environment variables!');
    process.exit(1);
}

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

// Initialize database
const database = new Database();

// Initialize database tables
database.init().then(() => {
    console.log('Database tables initialized');
}).catch(error => {
    console.error('Failed to initialize database:', error);
});

// Clean up expired sessions every hour
setInterval(async () => {
    await database.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
        return res.status(401).json({ error: 'No session token provided' });
    }
    
    try {
        const user = await database.verifySession(sessionToken);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid session token' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve PayPal SDK with dynamic client ID
app.get('/paypal-sdk.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        // Dynamic PayPal SDK loader
        (function() {
            var script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD';
            document.head.appendChild(script);
        })();
    `);
});

// Input validation helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    return username && username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// User registration
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3-20 characters, alphanumeric and underscores only' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const user = await database.registerUser(username, email, password);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        const result = await database.loginUser(username, password);
        res.json({
            success: true,
            user: result.user,
            sessionToken: result.sessionToken
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// User logout
app.post('/logout', authenticateUser, async (req, res) => {
    try {
        const sessionToken = req.headers.authorization.replace('Bearer ', '');
        await database.logout(sessionToken);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's owned skins
app.get('/user-skins', authenticateUser, async (req, res) => {
    try {
        const skins = await database.getUserSkins(req.user.userId);
        res.json({ skins });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

        // Log order creation (without exposing sensitive data)
        console.log('PayPal order created successfully');
        
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

        console.log('PayPal payment captured successfully');
        
        // Verify payment was successful
        if (response.data.status === 'COMPLETED') {
            const transactionId = response.data.purchase_units[0].payments.captures[0].id;
            
            // Get user from session token (if provided)
            const sessionToken = req.headers.authorization?.replace('Bearer ', '');
            let userId = null;
            
            if (sessionToken) {
                try {
                    const user = await database.verifySession(sessionToken);
                    userId = user.userId;
                    
                    // Store the purchase in database
                    await database.addUserSkin(userId, skinType, transactionId);
                } catch (error) {
                    console.error('Failed to store purchase in database:', error);
                }
            }
            
            res.json({
                success: true,
                skinType: skinType,
                message: 'Payment successful! Skin unlocked.',
                transactionId: transactionId,
                userId: userId
            });
        } else {
            throw new Error('Payment not completed');
        }

    } catch (error) {
        console.error('Error capturing PayPal payment:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
});

// Get purchased skins (deprecated - use /user-skins instead)
app.get('/purchased-skins', (req, res) => {
    res.status(410).json({ error: 'This endpoint is deprecated. Use /user-skins with authentication.' });
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
    if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🎮 Game available at https://wittyyetigame.up.railway.app`);
    } else {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🎮 Game available at http://localhost:${PORT}`);
    }
});

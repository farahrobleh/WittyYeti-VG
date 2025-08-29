const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Database {
    constructor() {
        // Use PostgreSQL connection string from environment variables
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        this.init();
    }

    async init() {
        try {
            // Create users table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create user_skins table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_skins (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    skin_type VARCHAR(50) NOT NULL,
                    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    transaction_id VARCHAR(100),
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(user_id, skin_type)
                )
            `);

            // Create user_sessions table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    session_token VARCHAR(500) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }

    // User registration
    async registerUser(username, email, password) {
        try {
            const passwordHash = bcrypt.hashSync(password, 10);
            
            const result = await this.pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
                [username, email, passwordHash]
            );
            
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    }

    // User login
    async loginUser(username, password) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM users WHERE username = $1 OR email = $1',
                [username]
            );
            
            const user = result.rows[0];
            
            if (!user) {
                throw new Error('User not found');
            }
            
            if (!bcrypt.compareSync(password, user.password_hash)) {
                throw new Error('Invalid password');
            }
            
            // Create session token
            const sessionToken = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );

            // Store session in database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await this.pool.query(
                'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
                [user.id, sessionToken, expiresAt.toISOString()]
            );
            
            return {
                user: { id: user.id, username: user.username, email: user.email },
                sessionToken
            };
        } catch (error) {
            throw error;
        }
    }

    // Verify session token
    async verifySession(sessionToken) {
        try {
            const result = await this.pool.query(
                'SELECT us.user_id, u.username, u.email FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.session_token = $1 AND us.expires_at > NOW()',
                [sessionToken]
            );
            
            const session = result.rows[0];
            
            if (!session) {
                throw new Error('Invalid or expired session');
            }
            
            return {
                userId: session.user_id,
                username: session.username,
                email: session.email
            };
        } catch (error) {
            throw error;
        }
    }

    // Get user's owned skins
    async getUserSkins(userId) {
        try {
            const result = await this.pool.query(
                'SELECT skin_type FROM user_skins WHERE user_id = $1',
                [userId]
            );
            
            return result.rows.map(row => row.skin_type);
        } catch (error) {
            throw error;
        }
    }

    // Add skin to user's collection
    async addUserSkin(userId, skinType, transactionId) {
        try {
            const result = await this.pool.query(
                'INSERT INTO user_skins (user_id, skin_type, transaction_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, skin_type) DO NOTHING',
                [userId, skinType, transactionId]
            );
            
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    // Logout (remove session)
    async logout(sessionToken) {
        try {
            const result = await this.pool.query(
                'DELETE FROM user_sessions WHERE session_token = $1',
                [sessionToken]
            );
            
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    // Clean up expired sessions
    async cleanupExpiredSessions() {
        try {
            await this.pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
        } catch (error) {
            console.error('Failed to cleanup expired sessions:', error);
        }
    }
}

module.exports = Database;

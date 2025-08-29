const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Database {
    constructor() {
        this.db = new sqlite3.Database('./game.db');
        this.init();
    }

    init() {
        // Create users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create user_skins table (many-to-many relationship)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_skins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                skin_type TEXT NOT NULL,
                purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                transaction_id TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, skin_type)
            )
        `);

        // Create user_sessions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        console.log('Database initialized successfully');
    }

    // User registration
    async registerUser(username, email, password) {
        return new Promise((resolve, reject) => {
            const passwordHash = bcrypt.hashSync(password, 10);
            
            this.db.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Username or email already exists'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({ id: this.lastID, username, email });
                    }
                }
            );
        });
    }

    // User login
    async loginUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username],
                async (err, user) => {
                    if (err) {
                        reject(err);
                    } else if (!user) {
                        reject(new Error('User not found'));
                    } else if (!bcrypt.compareSync(password, user.password_hash)) {
                        reject(new Error('Invalid password'));
                    } else {
                        // Create session token
                        const sessionToken = jwt.sign(
                            { userId: user.id, username: user.username },
                            process.env.JWT_SECRET || 'your-secret-key',
                            { expiresIn: '30d' }
                        );

                        // Store session in database
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 30);

                        this.db.run(
                            'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
                            [user.id, sessionToken, expiresAt.toISOString()],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({
                                        user: { id: user.id, username: user.username, email: user.email },
                                        sessionToken
                                    });
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    // Verify session token
    async verifySession(sessionToken) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT us.*, u.username, u.email FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.session_token = ? AND us.expires_at > datetime("now")',
                [sessionToken],
                (err, session) => {
                    if (err) {
                        reject(err);
                    } else if (!session) {
                        reject(new Error('Invalid or expired session'));
                    } else {
                        resolve({
                            userId: session.user_id,
                            username: session.username,
                            email: session.email
                        });
                    }
                }
            );
        });
    }

    // Get user's owned skins
    async getUserSkins(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT skin_type FROM user_skins WHERE user_id = ?',
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows.map(row => row.skin_type));
                    }
                }
            );
        });
    }

    // Add skin to user's collection
    async addUserSkin(userId, skinType, transactionId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO user_skins (user_id, skin_type, transaction_id) VALUES (?, ?, ?)',
                [userId, skinType, transactionId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    // Logout (remove session)
    async logout(sessionToken) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM user_sessions WHERE session_token = ?',
                [sessionToken],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    // Clean up expired sessions
    cleanupExpiredSessions() {
        this.db.run('DELETE FROM user_sessions WHERE expires_at < datetime("now")');
    }
}

module.exports = Database;

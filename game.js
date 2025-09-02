// Simple Game State
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.gameOver = false;
        this.isDying = false; // New death animation state
        this.isBossBattle = false; // New boss battle state
        this.score = 0;
        this.distance = 0; // This will be in kilometers
        this.giftsCollected = 0;
        this.gameSpeed = 3; // Much slower starting speed
        this.maxSpeed = 8; // Lower max speed
        this.lastSpawnDistance = 0; // Track distance for spawning
        this.health = 10; // Health bar with 10 notches
        this.maxHealth = 10;
        this.deathAnimationTime = 0; // Track death animation progress
        this.bossBattleTime = 0; // Track boss battle progress
        this.bossMeter = 0.5; // Boss battle meter (0 = player wins, 1 = boss wins)
        this.lastBossCheck = 0; // Track when to check for boss battle
        this.tugFlashTime = 0; // Visual feedback for tug input
        this.lastTugTime = 0; // Prevent spam but allow powerful tugs
        this.lastBossScore = 0; // Track the last score that triggered a boss battle
        this.showVictoryMessage = false; // Show victory message after boss defeat
        this.victoryMessageTime = 0; // Track victory message display time
        this.fieldClearTime = 0; // Track post-victory field clearing period
        this.currentSkin = 'default'; // Track current skin
        this.ownedSkins = ['default']; // Track owned skins
        this.frameCount = 0; // Track frames for skin powers

    }
}

// Audio Manager
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.volume = 0.7;
    }

    toggleMute() {
        this.soundEnabled = !this.soundEnabled;
        this.musicEnabled = !this.musicEnabled;
        
        if (!this.musicEnabled && this.currentMusic) {
            this.currentMusic.pause(); // Pause instead of stop
        } else if (this.musicEnabled && this.currentMusic) {
            this.currentMusic.play().catch(e => console.warn('Music resume failed:', e));
        }
        
        return this.soundEnabled && this.musicEnabled;
    }

    isMuted() {
        return !this.soundEnabled || !this.musicEnabled;
    }

    loadSound(key, src) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = src;
        this.sounds[key] = audio;
    }

    loadMusic(key, src) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.loop = true;
        
        // Add load event listener
        audio.addEventListener('canplaythrough', () => {
            // Music loaded successfully
        });
        
        audio.addEventListener('error', (e) => {
            console.warn(`Failed to load music: ${key}`, e);
        });
        
        audio.src = src;
        this.music[key] = audio;
    }

    playSound(key) {
        if (!this.soundEnabled || !this.sounds[key]) return;
        
        try {
            const sound = this.sounds[key].cloneNode();
            sound.volume = this.volume;
            sound.play().catch(e => console.warn('Sound play failed:', e));
        } catch (e) {
            console.warn('Sound play error:', e);
        }
    }

    playMusic(key) {
        if (!this.music[key]) {
            console.warn(`Music ${key} not found!`);
            return;
        }
        
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        try {
            this.currentMusic = this.music[key];
            this.currentMusic.volume = this.volume * 0.5; // Music quieter than sound effects
            
            // Only play if music is enabled
            if (this.musicEnabled) {
                this.currentMusic.play().catch(e => {
                    console.warn('Music play failed:', e);
                });
            }
        } catch (e) {
            console.warn('Music play error:', e);
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    pauseMusic() {
        if (this.currentMusic && this.musicEnabled) {
            this.currentMusic.pause();
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.musicEnabled) {
            this.currentMusic.play().catch(e => console.warn('Music resume failed:', e));
        }
    }

    getCurrentMusicKey() {
        // Helper method to get the current music key
        for (let key in this.music) {
            if (this.music[key] === this.currentMusic) {
                return key;
            }
        }
        return null;
    }

    loadAllAudio() {
        // Music
        this.loadMusic('menu', 'assets/audio/music/menu-music.mp3');
        this.loadMusic('gameplay', 'assets/audio/music/gameplay-music.mp3');
        this.loadMusic('gameOver', 'assets/audio/music/game-over-music.mp3');
        this.loadMusic('boss', 'assets/audio/music/boss-music.mp3');
        this.loadMusic('victory', 'assets/audio/music/victory-music.mp3');
        
        // Sound Effects - Only game over sound
        this.loadSound('gameOver', 'assets/audio/sounds/game-over.mp3');
    }
}

// Image Asset Manager
class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalImages = 0;
        this.allLoaded = false;
    }

    loadImage(key, src) {
        this.totalImages++;
        const img = new Image();
        img.onload = () => {
            this.loadedCount++;
            if (this.loadedCount === this.totalImages) {
                this.allLoaded = true;
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            this.loadedCount++;
            if (this.loadedCount === this.totalImages) {
                this.allLoaded = true;
            }
        };
        img.src = src;
        this.images[key] = img;
    }

    getImage(key) {
        return this.images[key];
    }

    loadAllImages() {
        // Character
        this.loadImage('yeti', 'assets/images/character/yeti-runner.png');
        
        // Enemies
        this.loadImage('karen', 'assets/images/enemies/karen-claus.png');
        this.loadImage('elf', 'assets/images/enemies/angry-elf.png');
        this.loadImage('reindeer', 'assets/images/enemies/revenge-reindeer.png');
        this.loadImage('bossJohnny', 'assets/images/enemies/boss-johnny.png');
        
        // Collectibles
        this.loadImage('gift1', 'assets/images/collectibles/gift-box-1.png');
        this.loadImage('gift2', 'assets/images/collectibles/gift-box-2.png');
        this.loadImage('gift3', 'assets/images/collectibles/gift-box-3.png');
        
        // Obstacles
        this.loadImage('tree', 'assets/images/obstacles/tree.png');
        this.loadImage('rock', 'assets/images/obstacles/rock.png');
        
        // UI
        this.loadImage('logo', 'assets/images/ui/witty-yeti-logo.png');
        
        // Backgrounds
        this.loadImage('background1', 'assets/images/background/background-1.png');
        this.loadImage('bossBackground', 'assets/images/background/boss-fight-background.png');
    }
}

// Game Object Classes
class Player {
    constructor(canvas, assetManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
        this.width = 60;
        this.height = 80;
        this.x = 100;
        this.y = canvas.height - this.height - 20;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.isJumping = false;
        this.lane = 1; // 0: left, 1: center, 2: right
        this.laneWidth = 200;
        this.lanePositions = [canvas.width / 2 - this.laneWidth, canvas.width / 2, canvas.width / 2 + this.laneWidth];
        this.animationFrame = 0;
        this.skinType = 'default'; // Default skin
    }

    update() {
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        if (this.y > this.canvas.height - this.height - 20) {
            this.y = this.canvas.height - this.height - 20;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Update x position based on lane
        this.x = this.lanePositions[this.lane] - this.width / 2;
        
        // Update animation
        this.animationFrame += 0.1;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }

    moveLeft() {
        if (this.lane > 0) {
            this.lane--;
        }
    }

    moveRight() {
        if (this.lane < 2) {
            this.lane++;
        }
    }

    draw() {
        const yetiImage = this.assetManager.getImage('yeti');
        if (yetiImage && this.assetManager.allLoaded) {
            this.ctx.save();
            
            // Debug: log current skin type
            if (this.skinType !== 'default') {
                console.log(`Drawing player with skin: ${this.skinType}`);
            }
            
            // Draw the base image first
            this.ctx.drawImage(yetiImage, this.x, this.y, this.width, this.height);
            
            // Apply skin-specific color overlay
            switch(this.skinType) {
                case 'radioactive':
                    // Apply emerald green overlay for radioactive yeti
                    this.ctx.globalCompositeOperation = 'multiply';
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Semi-transparent green
                    this.ctx.fillRect(this.x, this.y, this.width, this.height);
                    this.ctx.globalCompositeOperation = 'source-over';
                    console.log('Applied radioactive green overlay');
                    break;
                case 'ninja':
                    // Apply dark overlay for ninja yeti
                    this.ctx.globalCompositeOperation = 'multiply';
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Semi-transparent black
                    this.ctx.fillRect(this.x, this.y, this.width, this.height);
                    this.ctx.globalCompositeOperation = 'source-over';
                    break;
                case 'cosmic':
                    // Apply blue overlay for cosmic yeti
                    this.ctx.globalCompositeOperation = 'multiply';
                    this.ctx.fillStyle = 'rgba(0, 100, 255, 0.3)'; // Semi-transparent blue
                    this.ctx.fillRect(this.x, this.y, this.width, this.height);
                    this.ctx.globalCompositeOperation = 'source-over';
                    break;
                case 'royal':
                    // Apply gold overlay for royal yeti
                    this.ctx.globalCompositeOperation = 'multiply';
                    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Semi-transparent gold
                    this.ctx.fillRect(this.x, this.y, this.width, this.height);
                    this.ctx.globalCompositeOperation = 'source-over';
                    break;
                case 'legendary':
                    // Apply purple overlay for legendary yeti
                    this.ctx.globalCompositeOperation = 'multiply';
                    this.ctx.fillStyle = 'rgba(128, 0, 128, 0.3)'; // Semi-transparent purple
                    this.ctx.fillRect(this.x, this.y, this.width, this.height);
                    this.ctx.globalCompositeOperation = 'source-over';
                    break;
                default:
                    // No overlay for default skin
                    console.log('No overlay applied for default skin');
                    break;
            }
            
            // Restore the context
            this.ctx.restore();
            
            // Filter applied, now drawing image
        } else {
            // Fallback to basic shape if image not loaded
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    applyCSSFilterFallback() {
        // This method is not needed - canvas filters should work
        console.log('CSS filter fallback called but not needed');
    }

    getBounds() {
        // Make collision box much smaller for more forgiving gameplay
        const margin = 15;
        return {
            x: this.x + margin,
            y: this.y + margin,
            width: this.width - margin * 2,
            height: this.height - margin * 2
        };
    }
}

class Obstacle {
    constructor(canvas, assetManager, x, y, type) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 50;
        this.height = 50;
        this.speed = 0;
    }

    update(gameSpeed) {
        this.x -= gameSpeed;
    }

    draw() {
        const imageKey = this.type === 'tree' ? 'tree' : 'rock';
        const obstacleImage = this.assetManager.getImage(imageKey);
        
        if (obstacleImage && this.assetManager.allLoaded) {
            this.ctx.drawImage(obstacleImage, this.x, this.y, this.width, this.height);
        } else {
            // Fallback to basic shape
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        // Make obstacle collision box smaller
        const margin = 5;
        return {
            x: this.x + margin,
            y: this.y + margin,
            width: this.width - margin * 2,
            height: this.height - margin * 2
        };
    }
}

class Gift {
    constructor(canvas, assetManager, x, y) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 0;
        this.collected = false;
        this.animationFrame = 0;
        this.giftType = Math.floor(Math.random() * 3) + 1; // Random gift type 1-3
    }

    update(gameSpeed) {
        this.x -= gameSpeed;
        this.animationFrame += 0.1;
    }

    draw() {
        if (this.collected) return;

        const imageKey = `gift${this.giftType}`;
        const giftImage = this.assetManager.getImage(imageKey);
        
        if (giftImage && this.assetManager.allLoaded) {
            // Add a slight bounce animation
            const bounceOffset = Math.sin(this.animationFrame) * 3;
            this.ctx.drawImage(giftImage, this.x, this.y + bounceOffset, this.width, this.height);
        } else {
            // Fallback to basic shape
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Enemy {
    constructor(canvas, assetManager, x, y, type) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 60;
        this.height = 60;
        this.speed = 0;
        this.animationFrame = 0;
    }

    update(gameSpeed) {
        this.x -= gameSpeed;
        this.animationFrame += 0.1;
    }

    draw() {
        let imageKey;
        switch(this.type) {
            case 'karen':
                imageKey = 'karen';
                break;
            case 'elf':
                imageKey = 'elf';
                break;
            case 'reindeer':
                imageKey = 'reindeer';
                break;
            default:
                imageKey = 'karen';
        }
        
        const enemyImage = this.assetManager.getImage(imageKey);
        
        if (enemyImage && this.assetManager.allLoaded) {
            this.ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
        } else {
            // Fallback to basic shape
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        // Make enemy collision box smaller
        const margin = 10;
        return {
            x: this.x + margin,
            y: this.y + margin,
            width: this.width - margin * 2,
            height: this.height - margin * 2
        };
    }
}

// Main Game Class
class WittyYetiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = new GameState();
        this.assetManager = new AssetManager();
        this.audioManager = new AudioManager(); // Initialize AudioManager
        
        this.player = null;
        this.obstacles = [];
        this.gifts = [];
        this.enemies = [];
        this.pendingPurchase = null;
        
        // Authentication state
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('sessionToken');
        this.currentScreen = 'title'; // Track current screen
        
        // Professional spawning system
        this.spawnManager = {
            lastGiftSpawn: 0,
            lastObstacleSpawn: 0,
            lastEnemySpawn: 0,
            minGiftDistance: 0.05, // 50 meters between gifts
            minObstacleDistance: 0.08, // 80 meters between obstacles
            minEnemyDistance: 0.12, // 120 meters between enemies
            maxObjectsOnScreen: 3 // Maximum objects per type on screen
        };
        
        this.setupEventListeners();
        this.loadAssets();
        
        // Check if user has already made audio choice
        const audioChoice = localStorage.getItem('wittyYetiAudioChoice');
        
        if (audioChoice === null) {
            // First time visitor - show audio permission dialog
            this.showAudioPermissionDialog();
        } else if (audioChoice === 'enabled') {
            // User previously enabled audio - start normally
            this.startWithAudio();
        } else {
            // User previously disabled audio - start silently
            this.startWithoutAudio();
        }
        
        // Check for existing session
        if (this.sessionToken) {
            this.verifySession();
        }
        
        // Make game instance globally accessible
        window.gameInstance = this;
    }

    showAudioPermissionDialog() {
        const modal = document.getElementById('audioPermissionModal');
        modal.classList.add('show');
        
        // Set up button listeners
        document.getElementById('enableAudioBtn').onclick = () => {
            localStorage.setItem('wittyYetiAudioChoice', 'enabled');
            modal.classList.remove('show');
            this.startWithAudio();
        };
        
        document.getElementById('disableAudioBtn').onclick = () => {
            localStorage.setItem('wittyYetiAudioChoice', 'disabled');
            modal.classList.remove('show');
            this.startWithoutAudio();
        };
    }

    startWithAudio() {
        this.audioManager.soundEnabled = true;
        this.audioManager.musicEnabled = true;
        this.showTitleScreen();
        this.audioManager.playMusic('menu');
    }

    startWithoutAudio() {
        this.audioManager.soundEnabled = false;
        this.audioManager.musicEnabled = false;
        this.showTitleScreen();
    }

    // Authentication methods
    async registerUser(username, email, password) {
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.showLoginForm();
            } else {
                this.showNotification('Registration failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Registration failed: ' + error.message, 'error');
        }
    }

    async loginUser(username, password) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.user;
                this.sessionToken = result.sessionToken;
                localStorage.setItem('sessionToken', this.sessionToken);
                
                // Load user's owned skins
                await this.loadUserSkins();
                
                this.showUserInfo();
                
                // Return to previous screen or title screen
                if (this.currentScreen === 'login') {
                    if (this.gameState.isPlaying) {
                        this.returnToGame();
                    } else {
                        this.showTitleScreen();
                        // Update skin store UI when returning to title screen
                        setTimeout(() => {
                            this.updateSkinStoreUI();
                        }, 100);
                    }
                }
                
                this.showNotification('Login successful! Your progress will be saved.', 'success');
            } else {
                this.showNotification('Login failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Login failed: ' + error.message, 'error');
        }
    }

    async logout() {
        try {
            if (this.sessionToken) {
                await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('sessionToken');
        this.gameState.ownedSkins = ['default'];
        this.updateLoginButtons();
        this.showLoginForm();
    }

    async loadUserSkins() {
        try {
            const response = await fetch('/user-skins', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            
            const result = await response.json();
            
            if (result.skins) {
                this.gameState.ownedSkins = ['default', ...result.skins];
                console.log('Loaded user skins:', this.gameState.ownedSkins);
                // Update skin store UI to show correct buttons
                this.updateSkinStoreUI();
            }
        } catch (error) {
            console.error('Failed to load user skins:', error);
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
    }

    showUserInfo() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('userDisplayName').textContent = this.currentUser.username;
        
        // Update login/logout buttons on all screens
        this.updateLoginButtons();
    }
    
    showLoginScreen() {
        this.currentScreen = 'login';
        this.showScreen('login');
        this.showLoginForm();
        
        // If coming from game screen, pause the game and show return to game button
        if (this.gameState.isPlaying) {
            this.gameState.isPaused = true;
            this.audioManager.pauseMusic();
            document.getElementById('loginReturnToGameBtn').style.display = 'inline-block';
        } else {
            document.getElementById('loginReturnToGameBtn').style.display = 'none';
        }
    }
    
    updateLoginButtons() {
        const isLoggedIn = !!this.currentUser;
        const username = this.currentUser?.username || 'User';
        
        // Update title screen
        document.getElementById('userInfo').style.display = isLoggedIn ? 'flex' : 'none';
        document.getElementById('loginPrompt').style.display = isLoggedIn ? 'none' : 'flex';
        document.getElementById('userDisplayName').textContent = username;
        
        // Update main menu login/logout button
        const mainMenuLoginBtn = document.getElementById('showLoginBtn');
        if (isLoggedIn) {
            mainMenuLoginBtn.textContent = 'LOGOUT';
            mainMenuLoginBtn.className = 'secondary-button logout-button';
        } else {
            mainMenuLoginBtn.textContent = 'LOGIN';
            mainMenuLoginBtn.className = 'secondary-button login-button';
        }
        
        // Update game screen
        document.getElementById('gameUserInfo').style.display = isLoggedIn ? 'flex' : 'none';
        document.getElementById('gameLoginPrompt').style.display = isLoggedIn ? 'none' : 'flex';
        document.getElementById('gameUserDisplayName').textContent = username;
        document.getElementById('gameLoginBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
        document.getElementById('gameLogoutBtn').style.display = isLoggedIn ? 'inline-block' : 'none';
        
        // Update game over screen
        document.getElementById('gameOverUserInfo').style.display = isLoggedIn ? 'flex' : 'none';
        document.getElementById('gameOverLoginPrompt').style.display = isLoggedIn ? 'none' : 'flex';
        document.getElementById('gameOverUserDisplayName').textContent = username;
        document.getElementById('gameOverLoginBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
        document.getElementById('gameOverLogoutBtn').style.display = isLoggedIn ? 'inline-block' : 'none';
        
        // Update how to play screen
        document.getElementById('howToPlayUserInfo').style.display = isLoggedIn ? 'flex' : 'none';
        document.getElementById('howToPlayLoginPrompt').style.display = isLoggedIn ? 'none' : 'flex';
        document.getElementById('howToPlayUserDisplayName').textContent = username;
        document.getElementById('howToPlayLoginBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
        document.getElementById('howToPlayLogoutBtn').style.display = isLoggedIn ? 'inline-block' : 'none';
        
        // Update login screen
        document.getElementById('loginUserInfo').style.display = isLoggedIn ? 'flex' : 'none';
        document.getElementById('loginLoginPrompt').style.display = isLoggedIn ? 'none' : 'flex';
        document.getElementById('loginUserDisplayName').textContent = username;
    }



    showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
    
    showLoginRequiredModal() {
        document.getElementById('loginRequiredModal').style.display = 'flex';
    }
    
    hideLoginRequiredModal() {
        document.getElementById('loginRequiredModal').style.display = 'none';
        
        // Resume the game if it was paused for purchase
        if (this.gameState.isPlaying && this.gameState.isPaused) {
            this.gameState.isPaused = false;
            this.audioManager.playMusic('gameplay');
        }
    }
    
    returnToGame() {
        this.currentScreen = 'game';
        this.showScreen('game');
        
        // Resume the game
        this.gameState.isPaused = false;
        this.audioManager.resumeMusic();
        
        // Hide the return to game button
        document.getElementById('loginReturnToGameBtn').style.display = 'none';
    }

    async verifySession() {
        try {
            const response = await fetch('/user-skins', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = { username: 'User' }; // We'll get full user info later
                this.gameState.ownedSkins = ['default', ...result.skins];
                this.showUserInfo();
            } else {
                // Session expired or invalid
                this.sessionToken = null;
                localStorage.removeItem('sessionToken');
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            this.sessionToken = null;
            localStorage.removeItem('sessionToken');
            this.showLoginForm();
        }
    }



    loadAssets() {
        this.assetManager.loadAllImages();
        this.audioManager.loadAllAudio(); // Load audio assets
        
        // Start game loop immediately
        this.gameLoop();
    }

    setupEventListeners() {
        // Screen navigation
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('howToPlayBtn').addEventListener('click', () => {
            this.showHowToPlayScreen();
        });
        
        // Authentication event listeners
        document.getElementById('loginBtn').addEventListener('click', () => {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            this.loginUser(username, password);
        });
        
        document.getElementById('registerBtn').addEventListener('click', () => {
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            this.registerUser(username, email, password);
        });
        

        
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Login screen navigation
        document.getElementById('showLoginBtn').addEventListener('click', () => {
            if (this.currentUser) {
                this.logout();
            } else {
                this.showLoginScreen();
            }
        });
        document.getElementById('loginBackToMenuBtn').addEventListener('click', () => this.showTitleScreen());
        document.getElementById('loginReturnToGameBtn').addEventListener('click', () => this.returnToGame());
        
        // Login/logout buttons on all screens
        document.getElementById('gameLoginBtn').addEventListener('click', () => this.showLoginScreen());
        document.getElementById('gameLogoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('gameOverLoginBtn').addEventListener('click', () => this.showLoginScreen());
        document.getElementById('gameOverLogoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('howToPlayLoginBtn').addEventListener('click', () => this.showLoginScreen());
        document.getElementById('howToPlayLogoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('loginLogoutBtn').addEventListener('click', () => this.logout());
        
        // Login required modal buttons
        document.getElementById('goToLoginBtn').addEventListener('click', () => {
            this.hideLoginRequiredModal();
            this.showLoginScreen();
        });
        document.getElementById('cancelPurchaseBtn').addEventListener('click', () => {
            this.hideLoginRequiredModal();
        });
        
        document.getElementById('backToTitleBtn').addEventListener('click', () => {
            this.showTitleScreen();
        });

        // Skins store event listeners
        this.setupSkinsStoreListeners();
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('gameBackToMenuBtn').addEventListener('click', () => {
            this.showTitleScreen();
        });
        
        // Mute button event listeners
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.getElementById('gameMuteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.getElementById('gameOverMuteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('gameOverBackToMenuBtn').addEventListener('click', () => {
            this.showTitleScreen();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Allow keyboard input during boss battles, even when isPlaying is false
            if ((!this.gameState.isPlaying && !this.gameState.isBossBattle) || this.gameState.isPaused || this.gameState.gameOver) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                case ' ':
                    e.preventDefault();
                    if (!this.gameState.isBossBattle) {
                        this.player.jump();
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    if (this.gameState.isBossBattle) {
                        this.handleBossBattleInput();
                    }
                    break;
            }
        });
    }

    startGame() {
        // Reset everything
        this.gameState.reset();
        this.gameState.isPlaying = true;
        
        // Clear all objects
        this.obstacles = [];
        this.gifts = [];
        this.enemies = [];
        
        // Reset spawn manager
        this.spawnManager.lastGiftSpawn = 0;
        this.spawnManager.lastObstacleSpawn = 0;
        this.spawnManager.lastEnemySpawn = 0;
        
        // Create new player
        this.player = new Player(this.canvas, this.assetManager);
        this.player.skinType = this.gameState.currentSkin; // Apply current skin
        
        // Update UI
        this.updateUI();
        
        // Show game screen
        this.currentScreen = 'game';
        this.showScreen('game');
        this.audioManager.playMusic('gameplay'); // Play gameplay music
    }

    togglePause() {
        if (this.gameState.gameOver) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        document.getElementById('pauseBtn').textContent = this.gameState.isPaused ? 'RESUME' : 'PAUSE';
        if (this.gameState.isPaused) {
            this.audioManager.pauseMusic();
        } else {
            this.audioManager.resumeMusic();
        }
    }

    restartGame() {
        this.startGame();
    }

    gameOver() {
        if (this.gameState.gameOver) return;
        
        this.gameState.gameOver = true;
        this.gameState.isPlaying = false;
        this.audioManager.stopMusic();
        this.audioManager.playMusic('gameOver'); // Play game over music
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.gameState.score;
        document.getElementById('finalDistance').textContent = this.gameState.distance.toFixed(2);
        document.getElementById('finalGifts').textContent = this.gameState.giftsCollected;
        
        // Generate funny game over message
        const messages = [
            "Looks like you're as empty as a can of dehydrated water!",
            "Even a cursed gift would have been better than that run!",
            "The mall Santas are laughing at you now!",
            "Time to regift your running skills!",
            "The Child Chucker called - it wants its uselessness back!",
            "Better stick to gift-giving, not gift-running!"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('gameOverMessage').textContent = randomMessage;
        
        this.currentScreen = 'gameOver';
        this.showScreen('gameOver');
    }

    showTitleScreen() {
        this.gameState.reset();
        this.currentScreen = 'title';
        this.showScreen('title');
        this.audioManager.stopMusic();
        this.audioManager.playMusic('menu'); // Play menu music
    }

    showHowToPlayScreen() {
        this.currentScreen = 'howToPlay';
        this.showScreen('howToPlay');
    }

    setupSkinsStoreListeners() {
        // Skin selection buttons
        document.querySelectorAll('.skin-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skinCard = e.target.closest('.skin-card');
                const skinType = skinCard.dataset.skin;
                this.selectSkin(skinType);
            });
        });

        // Buy buttons
        document.querySelectorAll('.skin-buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skinCard = e.target.closest('.skin-card');
                const skinType = skinCard.dataset.skin;
                const price = parseFloat(e.target.dataset.price);
                
                // Always pause the game when clicking Buy Now
                if (this.gameState.isPlaying && !this.gameState.isPaused) {
                    this.gameState.isPaused = true;
                    this.audioManager.pauseMusic();
                }
                
                // Check if user is logged in
                if (!this.currentUser) {
                    this.showLoginRequiredModal();
                } else {
                    this.openPaymentModal(skinType, price);
                }
            });
        });

        // Close sidebar button
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('.skins-store-sidebar');
                if (sidebar) {
                    sidebar.classList.remove('show');
                }
            });
        }




    }

    selectSkin(skinType) {
        console.log(`selectSkin called with: ${skinType}`);
        console.log(`Current owned skins:`, this.gameState.ownedSkins);
        
        // Allow selection of any skin (default is always available)
        if (skinType === 'default' || this.gameState.ownedSkins.includes(skinType)) {
            // Update game state first
            this.gameState.currentSkin = skinType;
            console.log(`Game state current skin set to: ${skinType}`);
            
            // Update player appearance if in game
            if (this.player) {
                this.player.skinType = skinType;
                console.log(`Player skin updated to: ${skinType}`);
            }
            
            // Update UI for all skin cards
            const skinCards = document.querySelectorAll('.skin-card');
            skinCards.forEach(card => {
                const cardSkinType = card.dataset.skin;
                const selectBtn = card.querySelector('.skin-select-btn');
                const buyBtn = card.querySelector('.skin-buy-btn');
                
                if (cardSkinType === 'default' || this.gameState.ownedSkins.includes(cardSkinType)) {
                    // User owns this skin - show select button (never hide it)
                    if (selectBtn) selectBtn.style.display = 'inline-block';
                    if (buyBtn) buyBtn.style.display = 'none';
                    
                    // Update selected state
                    if (cardSkinType === skinType) {
                        if (selectBtn) selectBtn.textContent = 'SELECTED';
                        if (selectBtn) selectBtn.classList.add('selected');
                        console.log(`Set ${cardSkinType} to SELECTED`);
                    } else {
                        if (selectBtn) selectBtn.textContent = 'SELECT';
                        if (selectBtn) selectBtn.classList.remove('selected');
                        console.log(`Set ${cardSkinType} to SELECT`);
                    }
                } else {
                    // User doesn't own this skin - show buy button
                    if (selectBtn) selectBtn.style.display = 'none';
                    if (buyBtn) buyBtn.style.display = 'inline-block';
                }
            });
            
            console.log(`Skin selection complete. Current skin: ${this.gameState.currentSkin}, Player skin: ${this.player ? this.player.skinType : 'no player'}`);
        } else {
            console.log(`Cannot select skin ${skinType} - not owned`);
        }
    }

    openPaymentModal(skinType, price) {
        this.pendingPurchase = { skinType, price };
        
        // Auto-pause the game if it's running
        if (this.gameState.isPlaying && !this.gameState.isPaused) {
            this.gameState.isPaused = true;
            this.audioManager.pauseMusic();
        }
        
        // Update modal content with skin info
        const skinNames = {
            'radioactive': 'Radioactive Yeti',
            'ninja': 'Shadow Ninja Yeti', 
            'cosmic': 'Cosmic Yeti',
            'royal': 'Royal Yeti',
            'legendary': 'Legendary Yeti'
        };
        
        const skinDescriptions = {
            'radioactive': '☢️ Glowing with nuclear gift-giving power',
            'ninja': '🥷 Stealth gift delivery master',
            'cosmic': '🚀 Intergalactic gift-giving champion',
            'royal': '👑 Crowned gift-giving monarch',
            'legendary': '💎 The ultimate gift-giving deity'
        };
        
        document.getElementById('modalSkinName').textContent = skinNames[skinType];
        document.getElementById('modalSkinDescription').textContent = skinDescriptions[skinType];
        document.getElementById('modalSkinPrice').textContent = price.toFixed(2);
        
        // Set skin image with filter
        const skinImage = document.getElementById('modalSkinImage');
        skinImage.src = 'assets/images/character/yeti-runner.png';
        
        // Map skin types to their correct filter classes
        const skinFilters = {
            'radioactive': 'emerald-filter', // Radioactive Yeti uses emerald filter
            'ninja': 'ninja-filter',
            'cosmic': 'cosmic-filter',
            'royal': 'royal-filter',
            'legendary': 'legendary-filter'
        };
        
        skinImage.className = `modal-skin-img ${skinFilters[skinType] || ''}`;
        
        // Show modal
        document.getElementById('paymentModal').classList.add('active');
        
        // Create PayPal button
        this.createPayPalButton(skinType, price);
    }

    createPayPalButton(skinType, price) {
        const container = document.getElementById('paypal-button-container');
        container.innerHTML = ''; // Clear existing buttons
        
        if (window.paypal) {
            paypal.Buttons({
                createOrder: async (data, actions) => {
                    // Show promotion dialog instead of creating order
                    this.showPromotionDialog(skinType);
                    return null; // No order created
                },
                
                onApprove: async (data, actions) => {
                    // This won't be called since no order is created
                },
                
                onError: (err) => {
                    // Show promotion dialog on any error
                    this.showPromotionDialog(skinType);
                },
                
                onCancel: (data) => {
                    // Show promotion dialog on cancel
                    this.showPromotionDialog(skinType);
                }
            }).render(container);
        } else {
            // Fallback if PayPal SDK not loaded
            console.error('PayPal SDK not loaded!');
            const fallbackBtn = document.createElement('button');
            fallbackBtn.textContent = `Pay $${price.toFixed(2)} with PayPal`;
            fallbackBtn.className = 'pay-btn';
            fallbackBtn.onclick = () => this.showPromotionDialog(skinType);
            container.appendChild(fallbackBtn);
            
            // Show error message
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'PayPal is currently unavailable. Please try again later.';
            errorMsg.style.color = '#e74c3c';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.marginTop = '10px';
            container.appendChild(errorMsg);
        }
    }

    showPromotionDialog(skinType) {
        // Create promotion dialog
        const promotionDiv = document.createElement('div');
        promotionDiv.className = 'promotion-message';
        promotionDiv.innerHTML = `
            <div class="promotion-content">
                <h3>🎉 LIMITED TIME OFFER!</h3>
                <p>All Premium Skins Are <strong>100% FREE</strong></p>
                <p class="promotion-subtitle">JLS Trading Co. has stopped selling skins for money!</p>
                <p class="promotion-details">As of September 2nd, 2025, all premium skins are now completely free for all players. The good folks at JLS Trading Co. (and our CEO Johnny) will be playing this game too - we're not sponsors, we're players just like you!</p>
                <button class="promotion-claim-btn">CLAIM FREE SKIN</button>
            </div>
        `;
        
        // Style the promotion message
        promotionDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 40px;
            border-radius: 20px;
            z-index: 2000;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
            max-width: 500px;
        `;
        
        // Style the claim button
        const claimBtn = promotionDiv.querySelector('.promotion-claim-btn');
        claimBtn.style.cssText = `
            background: linear-gradient(135deg, #FFD93D, #FF6B6B);
            color: #333;
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        // Add hover effect
        claimBtn.addEventListener('mouseenter', () => {
            claimBtn.style.transform = 'translateY(-3px) scale(1.05)';
            claimBtn.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4)';
        });
        
        claimBtn.addEventListener('mouseleave', () => {
            claimBtn.style.transform = 'translateY(0) scale(1)';
            claimBtn.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
        });
        
        // Add click handler to claim the skin
        claimBtn.addEventListener('click', () => {
            console.log(`Claiming skin: ${skinType}`);
            
            // Add skin to owned skins
            if (!this.gameState.ownedSkins.includes(skinType)) {
                this.gameState.ownedSkins.push(skinType);
                console.log(`Added ${skinType} to owned skins:`, this.gameState.ownedSkins);
            }
            
            // Select the skin
            this.selectSkin(skinType);
            
            // Close payment modal
            this.closePaymentModal();
            
            // Update skin store UI
            setTimeout(() => {
                this.updateSkinStoreUI();
            }, 100);
            
            // Remove promotion message
            promotionDiv.remove();
        });
        
        document.body.appendChild(promotionDiv);
        
        // Auto-remove after 10 seconds if not claimed
        setTimeout(() => {
            if (promotionDiv.parentElement) {
                promotionDiv.remove();
            }
        }, 10000);
    }



    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('active');
        document.getElementById('paypal-button-container').innerHTML = '';
        this.pendingPurchase = null;
        
        // Resume the game if it was paused for purchase
        if (this.gameState.isPlaying && this.gameState.isPaused) {
            this.gameState.isPaused = false;
            this.audioManager.playMusic('gameplay');
        }
    }

    processPayment() {
        // Simulate payment processing
        const loadingBtn = document.querySelector('.pay-btn');
        const originalText = loadingBtn.textContent;
        loadingBtn.textContent = 'PROCESSING...';
        loadingBtn.disabled = true;

        setTimeout(() => {
            // Simulate successful payment
            if (this.pendingPurchase) {
                this.gameState.ownedSkins.push(this.pendingPurchase.skinType);
                this.selectSkin(this.pendingPurchase.skinType);
                
                // Show success message
                this.showPurchaseSuccess(this.pendingPurchase.skinType);
                
                // Force update skin store UI
                setTimeout(() => {
                    this.updateSkinStoreUI();
                }, 100);
            }
            
            this.closePaymentModal();
            loadingBtn.textContent = originalText;
            loadingBtn.disabled = false;
        }, 2000);
    }



    showPurchaseSuccess(skinType) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'purchase-success';
        notification.innerHTML = `
            <div class="success-content">
                <h3>🎉 Purchase Successful!</h3>
                <p>You now own the ${skinType} skin!</p>
                <button class="success-ok-btn" onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 2000;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        `;
        
        // Style the OK button
        const okBtn = notification.querySelector('.success-ok-btn');
        okBtn.style.cssText = `
            background: linear-gradient(135deg, #ffffff, #f0f0f0);
            color: #4CAF50;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `;
        
        // Add hover effect
        okBtn.addEventListener('mouseenter', () => {
            okBtn.style.background = 'linear-gradient(135deg, #f8f8f8, #e8e8e8)';
            okBtn.style.transform = 'translateY(-2px)';
            okBtn.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
        });
        
        okBtn.addEventListener('mouseleave', () => {
            okBtn.style.background = 'linear-gradient(135deg, #ffffff, #f0f0f0)';
            okBtn.style.transform = 'translateY(0)';
            okBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });
        
        document.body.appendChild(notification);
        
        // Force update skin store UI
        this.updateSkinStoreUI();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    updateSkinStoreUI() {
        console.log('Updating skin store UI...');
        console.log('Owned skins:', this.gameState.ownedSkins);
        console.log('Current skin:', this.gameState.currentSkin);
        
        // Force update all skin cards to show correct buttons
        const skinCards = document.querySelectorAll('.skin-card');
        console.log('Found skin cards:', skinCards.length);
        
        skinCards.forEach(card => {
            const skinType = card.dataset.skin;
            const selectBtn = card.querySelector('.skin-select-btn');
            const buyBtn = card.querySelector('.skin-buy-btn');
            
            console.log(`Skin: ${skinType}, Owned: ${this.gameState.ownedSkins.includes(skinType)}, SelectBtn: ${!!selectBtn}, BuyBtn: ${!!buyBtn}`);
            
            if (skinType === 'default' || this.gameState.ownedSkins.includes(skinType)) {
                // User owns this skin - show select button
                if (selectBtn) {
                    selectBtn.style.display = 'inline-block';
                    selectBtn.textContent = 'SELECT';
                    selectBtn.classList.remove('selected');
                    
                    // Mark as selected if it's the current skin
                    if (this.gameState.currentSkin === skinType) {
                        selectBtn.textContent = 'SELECTED';
                        selectBtn.classList.add('selected');
                    }
                    console.log(`Updated ${skinType} select button to: ${selectBtn.textContent}`);
                }
                if (buyBtn) buyBtn.style.display = 'none';
            } else {
                // User doesn't own this skin - show buy button
                if (selectBtn) selectBtn.style.display = 'none';
                if (buyBtn) buyBtn.style.display = 'inline-block';
            }
        });
    }

    startDeathAnimation() {
        this.gameState.isDying = true;
        this.gameState.isPlaying = false;
        this.audioManager.stopMusic();
        this.audioManager.playSound('gameOver');
        
        // Start death animation timer
        this.gameState.deathAnimationTime = 0;
    }

    toggleMute() {
        const isUnmuted = this.audioManager.toggleMute();
        const muteButtons = document.querySelectorAll('.mute-button');
        
        muteButtons.forEach(btn => {
            if (!this.audioManager.isMuted()) {
                btn.textContent = '🔊 MUTE';
                btn.classList.remove('muted');
            } else {
                btn.textContent = '🔇 UNMUTE';
                btn.classList.add('muted');
            }
        });
    }

    checkForBossBattle() {
        // Only check if not already in a boss battle
        if (this.gameState.isBossBattle) {
            return;
        }
        
        // Only check if game is playing
        if (!this.gameState.isPlaying) {
            return;
        }
        
        // Check if score has reached or exceeded a multiple of 50 and we haven't triggered this milestone yet
        const currentMilestone = Math.floor(this.gameState.score / 50) * 50;
        if (this.gameState.score > 0 && currentMilestone >= 50 && currentMilestone !== this.gameState.lastBossScore) {
            this.startBossBattle();
            this.gameState.lastBossScore = currentMilestone;
            return; // Exit immediately after triggering to prevent multiple calls
        }
    }

    startBossBattle() {
        this.gameState.isBossBattle = true;
        this.gameState.isPlaying = false;
        this.gameState.bossBattleTime = 0;
        this.gameState.bossMeter = 0.5; // Start in the middle
        
        // Stop gameplay music and start boss music
        this.audioManager.stopMusic();
        this.audioManager.playMusic('boss');
        
        // Position player and boss
        if (this.player) {
            this.player.x = 150; // Move player to left side
            this.player.y = this.canvas.height - this.player.height - 20; // Ensure proper Y position
        }
    }

    handleBossBattleInput() {
        // Only allow input after the countdown (9 seconds total: 4s entrance + 5s countdown)
        if (this.gameState.bossBattleTime >= 9000) {
            // Move meter towards player when input is received - NO COOLDOWN
            this.gameState.bossMeter = Math.max(0, this.gameState.bossMeter - 0.08);
            
            // Add visual feedback - flash effect
            this.gameState.tugFlashTime = 200; // Flash for 200ms
        }
    }

    updateBossBattle() {
        this.gameState.bossBattleTime += 16; // ~60fps
        
        // Update flash effect
        if (this.gameState.tugFlashTime > 0) {
            this.gameState.tugFlashTime -= 16;
        }
        
        // Only start the actual battle after entrance (4s) + countdown (5s) = 9s total
        if (this.gameState.bossBattleTime >= 9000) {
            // Boss meter naturally moves towards boss (extremely challenging)
            this.gameState.bossMeter = Math.min(1, this.gameState.bossMeter + 0.0091);
            
            // Debug meter movement
            if (this.gameState.bossBattleTime % 1000 === 0) { // Log every second
            }
            
            // Check for win/lose conditions
            if (this.gameState.bossMeter >= 1) {
                // Boss wins - steamroll effect
                this.bossWins();
            } else if (this.gameState.bossMeter <= 0.05) { // Player wins when meter is very close to 0
                // Player wins - boss dies
                this.bossLoses();
            }
        }
    }

    bossWins() {
        this.gameState.isBossBattle = false;
        this.gameState.lastBossScore = 0; // Reset boss check
        this.startDeathAnimation();
    }

    bossLoses() {
        this.gameState.isBossBattle = false;
        this.gameState.isPlaying = true;
        this.gameState.bossDeathTime = 0;
        
        // Reset boss check to allow next boss battle (but not immediately)
        this.gameState.lastBossScore = Math.floor(this.gameState.score / 50) * 50;
        
        // Stop boss music and resume gameplay music
        this.audioManager.stopMusic();
        this.audioManager.playMusic('gameplay');
        
        // Reset player position
        if (this.player) {
            this.player.x = 100;
        }
        

        
        // Show victory message briefly
        this.showBossVictoryMessage();
    }

    showBossVictoryMessage() {
        // Stop boss music and play victory music
        this.audioManager.stopMusic();
        this.audioManager.playMusic('victory');
        
        // Show victory message on screen
        this.gameState.showVictoryMessage = true;
        this.gameState.victoryMessageTime = 0;
    }

    updateVictoryMessage() {
        // Update victory message time
        this.gameState.victoryMessageTime += 16;
        
        // Show message for 3 seconds, then start field clearing period
        if (this.gameState.victoryMessageTime >= 3000) { // 3 seconds for victory message
            this.gameState.showVictoryMessage = false;
            this.gameState.fieldClearTime = 0; // Start field clearing period
            return;
        }
    }

    drawVictoryMessage() {
        // Show message for 3 seconds only
        if (this.gameState.victoryMessageTime >= 3000) {
            return; // Stop drawing after 3 seconds, field will be clear
        }
        
        // Draw victory message
        this.ctx.save();
        
        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Victory text
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.font = 'bold 48px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add dramatic shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 6;
        this.ctx.shadowOffsetY = 6;
        
        this.ctx.fillText('BOSS JOHNNY DEFEATED!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Subtitle
        this.ctx.font = 'bold 24px Fredoka, sans-serif';
        this.ctx.fillText('You won the gift-giving showdown!', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.restore();
    }

    drawCountdown(countdownTime) {
        // Calculate countdown number (5, 4, 3, 2, 1)
        const countdownNumber = Math.max(1, 5 - Math.floor(countdownTime / 1000));
        
        // Draw countdown with dramatic effect
        this.ctx.save();
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.font = 'bold 120px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add dramatic shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 8;
        this.ctx.shadowOffsetY = 8;
        
        // Scale effect based on time
        const timeInSecond = (countdownTime % 1000) / 1000;
        const scale = 1 + (timeInSecond * 0.5); // Scale from 1 to 1.5
        
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale, scale);
        
        this.ctx.fillText(countdownNumber.toString(), 0, 0);
        this.ctx.restore();
        
        // Draw "GET READY!" text
        this.ctx.save();
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.font = 'bold 36px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        
        this.ctx.fillText('GET READY!', this.canvas.width / 2, this.canvas.height / 2 + 100);
        this.ctx.restore();
    }

    showScreen(screenName) {
        // Set current screen
        this.currentScreen = screenName;
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.error(`Screen ${screenName}Screen not found`);
        }
        
        // Show/hide skins sidebar and title sidebar based on screen
        const skinsSidebar = document.querySelector('.skins-store-sidebar');
        const titleSidebar = document.querySelector('.game-title-sidebar');
        
        if (skinsSidebar) {
            if (screenName === 'game') {
                skinsSidebar.classList.add('show');
            } else {
                skinsSidebar.classList.remove('show');
            }
        }
        
        if (titleSidebar) {
            if (screenName === 'game') {
                titleSidebar.classList.add('show');
            } else {
                titleSidebar.classList.remove('show');
            }
        }
    }

    updateUI() {
        if (this.gameState.isPlaying) {
            document.getElementById('score').textContent = this.gameState.score;
            document.getElementById('distance').textContent = this.gameState.distance.toFixed(2) + 'm';
            document.getElementById('giftsCollected').textContent = this.gameState.giftsCollected;
            // Update health bar
            const healthBar = document.getElementById('healthBar');
            if (healthBar) {
                healthBar.style.width = `${(this.gameState.health / this.gameState.maxHealth) * 100}%`;
            }
        }
    }

    // Professional spawning system
    spawnObjects() {
        const currentDistance = this.gameState.distance;
        
        // Spawn gifts
        if (currentDistance - this.spawnManager.lastGiftSpawn >= this.spawnManager.minGiftDistance && 
            this.gifts.length < this.spawnManager.maxObjectsOnScreen) {
            this.spawnGift();
            this.spawnManager.lastGiftSpawn = currentDistance;
        }
        
        // Spawn obstacles
        if (currentDistance - this.spawnManager.lastObstacleSpawn >= this.spawnManager.minObstacleDistance && 
            this.obstacles.length < this.spawnManager.maxObjectsOnScreen) {
            this.spawnObstacle();
            this.spawnManager.lastObstacleSpawn = currentDistance;
        }
        
        // Spawn enemies
        if (currentDistance - this.spawnManager.lastEnemySpawn >= this.spawnManager.minEnemyDistance && 
            this.enemies.length < this.spawnManager.maxObjectsOnScreen) {
            this.spawnEnemy();
            this.spawnManager.lastEnemySpawn = currentDistance;
        }
    }

    spawnObstacle() {
        const lane = Math.floor(Math.random() * 3);
        const lanePositions = [this.canvas.width / 2 - 200, this.canvas.width / 2, this.canvas.width / 2 + 200];
        const x = this.canvas.width + 50; // Spawn off-screen to the right
        const y = this.canvas.height - 60;
        const types = ['tree', 'rock'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push(new Obstacle(this.canvas, this.assetManager, x, y, type));
    }

    spawnGift() {
        const lane = Math.floor(Math.random() * 3);
        const lanePositions = [this.canvas.width / 2 - 200, this.canvas.width / 2, this.canvas.width / 2 + 200];
        const x = this.canvas.width + 50; // Spawn off-screen to the right
        const y = this.canvas.height - 100;
        
        this.gifts.push(new Gift(this.canvas, this.assetManager, x, y));
    }

    spawnEnemy() {
        const lane = Math.floor(Math.random() * 3);
        const lanePositions = [this.canvas.width / 2 - 200, this.canvas.width / 2, this.canvas.width / 2 + 200];
        const x = this.canvas.width + 50; // Spawn off-screen to the right
        const y = this.canvas.height - 70;
        const types = ['karen', 'elf', 'reindeer'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.enemies.push(new Enemy(this.canvas, this.assetManager, x, y, type));
    }

    checkCollisions() {
        if (!this.player || !this.gameState.isPlaying || this.gameState.gameOver) return false;
        
        const playerBounds = this.player.getBounds();
        
        // Check obstacle collisions
        for (let obstacle of this.obstacles) {
            if (this.isColliding(playerBounds, obstacle.getBounds())) {
                this.gameState.health--; // Decrease health
                
                // Remove the obstacle so it doesn't keep hitting
                const obstacleIndex = this.obstacles.indexOf(obstacle);
                if (obstacleIndex > -1) {
                    this.obstacles.splice(obstacleIndex, 1);
                }
                
                if (this.gameState.health <= 0) {
                    this.gameState.health = 0;
                    this.startDeathAnimation();
                    return;
                }
                return;
            }
        }
        
        // Check enemy collisions
        for (let enemy of this.enemies) {
            if (this.isColliding(playerBounds, enemy.getBounds())) {
                // Different damage based on enemy type
                let damage = 1;
                let soundKey = 'obstacleHit';
                
                switch(enemy.type) {
                    case 'reindeer':
                        damage = 2;
                        soundKey = 'reindeerHit';
                        break;
                    case 'elf':
                        damage = 3;
                        soundKey = 'elfHit';
                        break;
                    case 'karen':
                        damage = 4;
                        soundKey = 'karenHit';
                        break;
                }
                
                // Apply skin power bonuses
                damage = this.applySkinPowerBonuses(damage, 'damage');
                
                this.audioManager.playSound(soundKey);
                this.gameState.health -= damage;
                
                // Remove the enemy so it doesn't keep hitting
                const enemyIndex = this.enemies.indexOf(enemy);
                if (enemyIndex > -1) {
                    this.enemies.splice(enemyIndex, 1);
                }
                
                if (this.gameState.health <= 0) {
                    this.gameState.health = 0;
                    this.startDeathAnimation();
                    return;
                }
                return;
            }
        }
        
        // Check gift collections - ONLY WAY TO GET POINTS
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            if (!gift.collected && this.isColliding(playerBounds, gift.getBounds())) {
                gift.collected = true;
                this.gameState.giftsCollected++;
                // Score based on gift type: 1, 2, or 3 points
                let scoreGain = gift.giftType;
                scoreGain = this.applySkinPowerBonuses(scoreGain, 'score');
                this.gameState.score += scoreGain;
                this.gifts.splice(i, 1);
                
                // Check if we just hit a boss battle trigger
                const currentMilestone = Math.floor(this.gameState.score / 50) * 50;
                this.audioManager.playSound(`gift${gift.giftType}`); // Play gift collection sound
            }
        }
        
        return false;
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    applySkinPowerBonuses(value, type) {
        const currentSkin = this.gameState.currentSkin;
        let multiplier = 1.0;
        
        // Debug: log skin power application
        if (currentSkin !== 'default') {
            console.log(`Applying skin powers for ${currentSkin}, type: ${type}, base value: ${value}`);
        }
        
        switch(currentSkin) {
            case 'radioactive': // Radioactive Yeti
                if (type === 'damage') {
                    multiplier = 0.7; // 30% damage resistance (take 70% damage)
                    console.log(`Radioactive Yeti: 30% damage resistance applied, multiplier: ${multiplier}`);
                }
                break;
            case 'ninja': // Shadow Ninja Yeti
                if (type === 'damage') {
                    // 25% chance to avoid damage completely
                    if (Math.random() < 0.25) {
                        console.log(`Ninja Yeti: 25% chance to avoid damage - SUCCESS!`);
                        return 0; // No damage taken
                    }
                }
                break;
            case 'cosmic': // Cosmic Yeti
                if (type === 'score') {
                    multiplier = 1.2; // 20% score multiplier
                    console.log(`Cosmic Yeti: 20% score multiplier applied, multiplier: ${multiplier}`);
                }
                break;
            case 'royal': // Royal Yeti
                if (type === 'health') {
                    // Health regeneration happens in update loop
                    multiplier = 1.1; // 10% bonus
                    console.log(`Royal Yeti: 10% health bonus applied, multiplier: ${multiplier}`);
                }
                break;
            case 'legendary': // Legendary Yeti
                if (type === 'damage') {
                    multiplier = 0.5; // 50% damage resistance
                    console.log(`Legendary Yeti: 50% damage resistance applied, multiplier: ${multiplier}`);
                } else if (type === 'score') {
                    multiplier = 1.5; // 50% score multiplier
                    console.log(`Legendary Yeti: 50% score multiplier applied, multiplier: ${multiplier}`);
                } else if (type === 'health') {
                    multiplier = 1.5; // 50% health bonus
                    console.log(`Legendary Yeti: 50% health bonus applied, multiplier: ${multiplier}`);
                }
                break;
        }
        
        const finalValue = Math.round(value * multiplier);
        if (currentSkin !== 'default' && finalValue !== value) {
            console.log(`Skin power result: ${value} → ${finalValue} (${multiplier}x)`);
        }
        
        return finalValue;
    }

    updateSkinPowers() {
        const currentSkin = this.gameState.currentSkin;
        
        // Health regeneration for Royal Yeti
        if (currentSkin === 'royal' && this.gameState.health < this.gameState.maxHealth) {
            // Regenerate 1 health every 5 seconds (assuming 60fps, that's 300 frames)
            if (this.gameState.frameCount % 300 === 0) {
                this.gameState.health = Math.min(this.gameState.health + 1, this.gameState.maxHealth);
            }
        }
        
        // Legendary Yeti health bonus
        if (currentSkin === 'legendary' && this.gameState.health < this.gameState.maxHealth) {
            // Regenerate 1 health every 3 seconds (180 frames)
            if (this.gameState.frameCount % 180 === 0) {
                this.gameState.health = Math.min(this.gameState.health + 1, this.gameState.maxHealth);
            }
        }
    }

    update() {
        // Handle death animation
        if (this.gameState.isDying) {
            this.gameState.deathAnimationTime += 16; // ~60fps
            if (this.gameState.deathAnimationTime >= 3000) { // 3 seconds
                this.gameOver();
            }
            return;
        }
        
        // Handle boss battle
        if (this.gameState.isBossBattle) {
            this.updateBossBattle();
            return;
        }
        
        // Handle victory message (pause gameplay)
        if (this.gameState.showVictoryMessage) {
            this.updateVictoryMessage();
            return;
        }
        
        // Handle field clearing period (clear field and prevent spawning)
        if (this.gameState.fieldClearTime < 2500) { // 2.5 seconds of clear field
            this.gameState.fieldClearTime += 16;
            
            // Clear all existing objects
            this.obstacles = [];
            this.gifts = [];
            this.enemies = [];
            
            // Resume normal gameplay music when field clearing starts (only if we're actually playing)
            if (this.gameState.fieldClearTime === 16 && this.gameState.isPlaying) { // First frame of field clearing
                this.audioManager.stopMusic();
                this.audioManager.playMusic('gameplay');
            }
            
            // Only update player and UI during clear period
            if (this.player) {
                this.player.update();
            }
            this.updateUI();
            return;
        }
        
        // Only update if game is playing
        if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.gameOver) return;
        
        // Update player
        if (this.player) {
            // Ensure player skin is always synchronized with game state
            if (this.player.skinType !== this.gameState.currentSkin) {
                this.player.skinType = this.gameState.currentSkin;
                console.log(`Game loop syncing player skin: ${this.gameState.currentSkin} (was: ${this.player.skinType})`);
            }
            this.player.update();
        }
        
        // Professional spawning system
        this.spawnObjects();
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(this.gameState.gameSpeed);
            if (this.obstacles[i].x + this.obstacles[i].width < -50) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update gifts
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            this.gifts[i].update(this.gameState.gameSpeed);
            if (this.gifts[i].x + this.gifts[i].width < -50) {
                this.gifts.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(this.gameState.gameSpeed);
            if (this.enemies[i].x + this.enemies[i].width < -50) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Update distance - VERY SLOW PROGRESSION
        this.gameState.distance += this.gameState.gameSpeed / 5000; // Much slower progression
        
        // Increment frame counter for skin powers
        this.gameState.frameCount++;
        
        // Increase game speed over time - VERY SLOW
        if (this.gameState.gameSpeed < this.gameState.maxSpeed) {
            this.gameState.gameSpeed += 0.001; // Much slower speed increase
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check for boss battle (after score updates from gift collection)
        this.checkForBossBattle();
        
        // Apply skin power effects (health regeneration, etc.)
        this.updateSkinPowers();
        
        // Update UI
        this.updateUI();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        if (this.player) {
            this.player.draw();
        }
        
        for (let obstacle of this.obstacles) {
            obstacle.draw();
        }
        
        for (let gift of this.gifts) {
            gift.draw();
        }
        
        for (let enemy of this.enemies) {
            enemy.draw();
        }
        
        // Draw death animation
        if (this.gameState.isDying) {
            this.drawDeathAnimation();
        }
        
        // Draw boss battle
        if (this.gameState.isBossBattle) {
            this.drawBossBattle();
        }
        
        // Draw victory message
        if (this.gameState.showVictoryMessage) {
            this.drawVictoryMessage();
        }
    }

    drawBackground() {
        // Reset any previous context state
        this.ctx.save();
        
        // Get main background image
        const backgroundImage = this.assetManager.getImage('background1');
        
        if (backgroundImage && this.assetManager.allLoaded) {
            // Draw background image, scaled to fit canvas
            this.ctx.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback to gradient if image not loaded
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        

        this.ctx.restore();
    }

    drawDeathAnimation() {
        const progress = this.gameState.deathAnimationTime / 3000; // 0 to 1
        
        // Animate player falling off screen
        if (this.player) {
            this.player.y += 5; // Fall down
            this.player.velocityY = 2; // Keep falling
        }
        
        // Draw "GAME OVER" text
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animate text appearance
        const textAlpha = Math.min(1, progress * 2);
        this.ctx.globalAlpha = textAlpha;
        
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 72px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add text shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Subtitle
        this.ctx.font = 'bold 24px Fredoka, sans-serif';
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.fillText('RIP Witty Yeti!', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.restore();
    }

    drawBossBattle() {
        // Save context state before boss battle drawing
        this.ctx.save();
        
        // Draw boss battle background image
        const bossBackgroundImage = this.assetManager.getImage('bossBackground');
        if (bossBackgroundImage && this.assetManager.allLoaded) {
            // Draw boss background image, scaled to fit canvas
            this.ctx.drawImage(bossBackgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback to gradient if image not loaded
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.9)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Calculate entrance animation progress (4 seconds)
        const entranceProgress = Math.min(1, this.gameState.bossBattleTime / 4000); // 4 second entrance
        
        // Draw Boss Johnny (large on the right) with smooth entrance
        const bossImage = this.assetManager.getImage('bossJohnny');
        if (bossImage && this.assetManager.allLoaded) {
            const bossWidth = 350;
            const bossHeight = 350;
            const bossX = this.canvas.width - bossWidth - 30;
            const bossY = this.canvas.height / 2 - bossHeight / 2;
            
            // Smooth entrance animation
            const bossScale = 0.3 + (entranceProgress * 0.7); // Scale from 30% to 100%
            const bossOpacity = entranceProgress;
            const bossOffsetX = (1 - entranceProgress) * 200; // Slide in from right
            
            this.ctx.save();
            this.ctx.globalAlpha = bossOpacity;
            this.ctx.translate(bossX + bossWidth/2 + bossOffsetX, bossY + bossHeight/2);
            this.ctx.scale(bossScale, bossScale);
            
            // Add glow effect
            this.ctx.shadowColor = '#FFD93D';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.drawImage(bossImage, -bossWidth/2, -bossHeight/2, bossWidth, bossHeight);
            this.ctx.restore();
        }
        
        // Draw player (smaller on the left) with entrance animation
        if (this.player) {
            this.ctx.save();
            this.ctx.globalAlpha = entranceProgress;
            this.player.draw();
            this.ctx.restore();
        }
        
        // Draw countdown or meter based on time
        if (entranceProgress >= 1) {
            // Show countdown
            const countdownTime = this.gameState.bossBattleTime - 4000; // Time after entrance
            if (countdownTime < 5000) { // 5 second countdown
                this.drawCountdown(countdownTime);
            } else {
                // Show meter after countdown
                this.drawGiftShowdownMeter();
            }
        }
        
        // Draw boss battle text with entrance animation
        this.ctx.save();
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.font = 'bold 48px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 6;
        this.ctx.shadowOffsetY = 6;
        
        // Main title with entrance animation
        const titleOpacity = Math.max(0, (entranceProgress - 0.3) / 0.7);
        this.ctx.globalAlpha = titleOpacity;
        this.ctx.fillText('GIFT-GIVING SHOWDOWN!', this.canvas.width / 2, 100);
        
        // Subtitle with delay and updated controls
        const subtitleOpacity = Math.max(0, (entranceProgress - 0.6) / 0.4);
        this.ctx.globalAlpha = subtitleOpacity;
        this.ctx.font = 'bold 28px Fredoka, sans-serif';
        this.ctx.fillText('Press LEFT ARROW or A to tug back!', this.canvas.width / 2, 160);
        
        this.ctx.restore();
        
        // Restore context state after boss battle drawing
        this.ctx.restore();
    }

    drawGiftShowdownMeter() {
        const meterWidth = 500;
        const meterHeight = 50;
        const meterX = this.canvas.width / 2 - meterWidth / 2;
        const meterY = this.canvas.height - 120;
        
        // Draw meter background with gradient
        const bgGradient = this.ctx.createLinearGradient(meterX, meterY, meterX + meterWidth, meterY);
        bgGradient.addColorStop(0, '#2c3e50');
        bgGradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Draw meter border with glow and flash effect
        this.ctx.strokeStyle = '#FFD93D';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#FFD93D';
        this.ctx.shadowBlur = 10;
        
        // Add flash effect when tugging
        if (this.gameState.tugFlashTime > 0) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.shadowColor = '#FFFFFF';
            this.ctx.shadowBlur = 20;
        }
        
        this.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        this.ctx.shadowBlur = 0;
        
        // Calculate color based on meter position (blue for player, red for boss)
        const meterPosition = this.gameState.bossMeter; // 0 = player wins, 1 = boss wins
        let fillColor1, fillColor2;
        
        if (meterPosition <= 0.5) {
            // Blue gradient for player side (0.0 to 0.5)
            const blueIntensity = 1 - (meterPosition * 2); // 1.0 to 0.0
            fillColor1 = `rgb(${Math.floor(52 * blueIntensity)}, ${Math.floor(152 * blueIntensity)}, ${Math.floor(219 * blueIntensity)})`;
            fillColor2 = `rgb(${Math.floor(41 * blueIntensity)}, ${Math.floor(128 * blueIntensity)}, ${Math.floor(185 * blueIntensity)})`;
        } else {
            // Red gradient for boss side (0.5 to 1.0)
            const redIntensity = (meterPosition - 0.5) * 2; // 0.0 to 1.0
            fillColor1 = `rgb(${Math.floor(231 * redIntensity)}, ${Math.floor(76 * redIntensity)}, ${Math.floor(60 * redIntensity)})`;
            fillColor2 = `rgb(${Math.floor(192 * redIntensity)}, ${Math.floor(57 * redIntensity)}, ${Math.floor(43 * redIntensity)})`;
        }
        
        // Draw meter fill with dynamic color gradient
        const fillWidth = meterWidth * this.gameState.bossMeter;
        const fillGradient = this.ctx.createLinearGradient(meterX, meterY, meterX + fillWidth, meterY);
        fillGradient.addColorStop(0, fillColor1);
        fillGradient.addColorStop(1, fillColor2);
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
        
        // Draw center line
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FFF';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(meterX + meterWidth / 2, meterY);
        this.ctx.lineTo(meterX + meterWidth / 2, meterY + meterHeight);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Draw labels with better styling
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.font = 'bold 20px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillText('YOU', meterX - 40, meterY + meterHeight / 2);
        this.ctx.fillText('BOSS', meterX + meterWidth + 50, meterY + meterHeight / 2 - 12);
        this.ctx.fillText('JOHNNY', meterX + meterWidth + 50, meterY + meterHeight / 2 + 12);
        this.ctx.shadowBlur = 0;
        
        // Draw tug animation effect
        const tugOffset = Math.sin(this.gameState.bossBattleTime * 0.01) * 3;
        this.ctx.strokeStyle = '#FFD93D';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(meterX + fillWidth + tugOffset, meterY);
        this.ctx.lineTo(meterX + fillWidth + tugOffset, meterY + meterHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Show tug instruction
        this.ctx.fillStyle = '#2ECC71';
        this.ctx.font = 'bold 16px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PRESS LEFT/A TO TUG!', this.canvas.width / 2, meterY - 20);
        
        // Show win condition indicator
        if (this.gameState.bossMeter <= 0.1) {
            this.ctx.fillStyle = '#F39C12';
            this.ctx.font = 'bold 18px Fredoka, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ALMOST THERE! KEEP TUGGING!', this.canvas.width / 2, meterY - 45);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WittyYetiGame();
});

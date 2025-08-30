# 🎮 Witty Yeti: The Video Game

A browser-based endless runner game featuring the beloved Witty Yeti mascot, created as a showcase project for entrepreneurial skills and creativity.

## 🚀 Live Demo

[Play the game here!](https://wittyyetigame.up.railway.app)

## 🎯 Features

- **Endless Runner Gameplay** - Temple Run-style mechanics
- **Witty Yeti Character** - Collect gag gifts while avoiding obstacles
- **Health System** - 10-notch health bar with different damage types
- **Boss Battles** - Face Boss Johnny every 50 points
- **Premium Skins** - 5 unique character skins available for purchase
- **Real PayPal Integration** - Secure payment processing for skin purchases
- **Audio System** - Background music and sound effects
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express.js
- **Payment Processing**: PayPal API
- **Deployment**: Railway
- **Audio**: HTML5 Audio API

## 🎮 How to Play

1. **Start the Game** - Click "START RUNNING"
2. **Jump** - Press SPACEBAR to jump over obstacles
3. **Collect Gifts** - Grab gift boxes for points
4. **Avoid Enemies** - Steer clear of Revenge Reindeer, Angry Elves, and Karen Claus
5. **Boss Battles** - Every 50 points, face Boss Johnny in a tug-of-war battle
6. **Buy Skins** - Purchase premium character skins with real money

## 💰 Premium Skins

- **Royal Yeti** - $1.99 - 👑 Crowned gift-giving monarch
- **Radioactive Yeti** - $2.99 - ☢️ Glowing with nuclear gift-giving power
- **Cosmic Yeti** - $3.99 - 🚀 Intergalactic gift-giving champion
- **Shadow Ninja Yeti** - $4.99 - 🥷 Stealth gift delivery master
- **Legendary Yeti** - $4.99 - 💎 The ultimate gift-giving deity

## 🔧 Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PayPal Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WittyYeti-VG
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🚀 Deployment

### Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway project**
   ```bash
   railway init
   ```

4. **Set environment variables**
   ```bash
   railway variables set PAYPAL_CLIENT_ID=your_live_paypal_client_id
   railway variables set PAYPAL_CLIENT_SECRET=your_live_paypal_client_secret
   railway variables set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## 🔒 Security Features

- **HTTPS Only** - All connections use secure protocols
- **Environment Variables** - Sensitive credentials stored securely
- **Input Validation** - Server-side validation for all inputs
- **Security Headers** - XSS protection and content type validation
- **PayPal Integration** - Secure payment processing

## 🎵 Audio Credits

- Background music and sound effects included
- Audio permission dialog for user consent
- Mute/unmute functionality on all screens

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This is a showcase project for entrepreneurial skills. Feel free to fork and modify for your own projects!

## 📄 License

This project is created for educational and showcase purposes.

## 🎯 About

Created as a demonstration of entrepreneurial skills, technical ability, and creativity. The game showcases the ability to take an idea from concept to a fully functional, monetized product.

---

**Made with ❤️ for Witty Yeti**

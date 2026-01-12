# Happy Birthday, Leena! ❤️

A romantic, interactive birthday webpage with beautiful animations and heartfelt messages.

## 🎨 Features

- **Landing Scene**: Animated gradient background with floating hearts and sparkles
- **Interactive Cake Scene**: 3D-styled cake with candles you can blow out (hold spacebar or click)
- **Romantic Reveal**: Night sky with twinkling stars, heart tree, and a personal message
- **Smooth Animations**: 60fps animations with easing for a calming, romantic feel
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## 🚀 Quick Start

1. **Add Audio Files** (Optional but recommended):
   - Place `happy-birthday.mp3` in the `/assets` folder
   - Optionally add `blow-sound.mp3` and `chime.mp3` for enhanced effects
   - See `/assets/README.md` for more details

2. **Open the Page**:
   - Simply open `index.html` in a modern web browser
   - Or use a local server (recommended for audio):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (with http-server)
     npx http-server
     ```
   - Then visit `http://localhost:8000` in your browser

## 🎮 How to Use

1. **Landing Page**: View the beautiful animated greeting
2. **Scroll Down**: Click the scroll hint or scroll to the cake scene
3. **Blow Out Candles**: 
   - Hold the **spacebar**, OR
   - Click and hold on the cake
   - Release to blow out the candles!
4. **Enjoy**: After candles are blown, the page transitions to the romantic message scene

## 🎨 Customization

### Changing the Message

Edit the message text in `index.html` (around line 50):
```html
<p class="message-text">
    Your custom message here
</p>
```

### Changing Colors

Edit the CSS variables in `style.css` (at the top of the file):
```css
:root {
    --lavender: #E6D4F7;
    --blush-pink: #FFE5E8;
    /* ... customize your colors */
}
```

### Changing Fonts

The page uses Google Fonts:
- **Heading**: Dancing Script (cursive)
- **Body**: Nunito (sans-serif)

To change fonts, update the Google Fonts link in `index.html` and the font-family in `style.css`.

## 📁 File Structure

```
lee-birthday/
├── index.html          # Main HTML structure
├── style.css           # All styles and animations
├── script.js           # Interactive functionality
├── assets/             # Media files folder
│   ├── README.md       # Asset guide
│   ├── happy-birthday.mp3
│   ├── blow-sound.mp3 (optional)
│   └── chime.mp3 (optional)
└── README.md           # This file
```

## 🎵 Audio Notes

- Audio files are optional - the page works without them
- For best results, use MP3 format
- Background music loops automatically after candles are blown
- Modern browsers may require user interaction before playing audio

## 💝 Made with Love

This page was carefully crafted with attention to:
- Smooth, calming animations
- Romantic color palette
- Emotional pacing
- Beautiful typography
- Interactive engagement

Enjoy celebrating Leena's special day! ✨

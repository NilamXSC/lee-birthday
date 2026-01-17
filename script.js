const STATE = {
    CAKE: 'cake',
    LETTER: 'letter',
    FINAL: 'final'
};

let currentState = STATE.CAKE;
let candlesBlown = false;
let isBlowing = false;
let confettiActive = false;
let envelopeOpened = false;

// imp : microphone sounddd
let microphone = null;
let audioContext = null;
let analyser = null;
let microphoneStream = null;
let isListening = false;
const BLOW_THRESHOLD = 30;
let blowVolumeCheckInterval = null;

const cakeScene = document.getElementById('scene-cake');
const letterScene = document.getElementById('scene-letter');
const finalScene = document.getElementById('scene-final');

const candles = document.querySelectorAll('.flame');
const smokeContainer = document.getElementById('smoke');
const confettiContainer = document.getElementById('confetti');
const particlesContainer = document.getElementById('particles');
const glowExpand = document.getElementById('glowExpand');
const cakeContainer = document.querySelector('.cake-container');

const envelope = document.getElementById('envelope');
const envelopeFlap = document.querySelector('.envelope-flap');
const letterPaper = document.getElementById('letterPaper');
const letterContent = document.getElementById('letterContent');
const fallingHeartsContainer = document.getElementById('fallingHearts');
const finalButtonWrapper = document.getElementById('finalButtonWrapper');
const finalButton = document.getElementById('finalButton');

const bgMusic = document.getElementById('bgMusic');
const blowSound = document.getElementById('blowSound');
const chimeSound = document.getElementById('chimeSound');


document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    createInitialParticles();
});

function initializePage() {
    showScene(STATE.CAKE);
    initializeMicrophone();
    
    setInterval(() => {
        if (currentState === STATE.CAKE && particlesContainer.children.length < 25) {
            createParticle();
        }
    }, 1500);
}

async function initializeMicrophone() {
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(microphoneStream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        startMicrophoneListening();
    } catch (error) {
        console.log('Microphone access denied or not available:', error);
    }
}

function startMicrophoneListening() {
    if (!analyser || isListening) return;
    
    isListening = true;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    blowVolumeCheckInterval = setInterval(() => {
        if (currentState !== STATE.CAKE || candlesBlown) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        if (average > BLOW_THRESHOLD) {
            if (!isBlowing) {
                startBlowing();
            }
        } else {
            if (isBlowing) {
                setTimeout(() => {
                    if (isBlowing && average < BLOW_THRESHOLD * 0.7) {
                        stopBlowing();
                    }
                }, 200);
            }
        }
    }, 100);
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && currentState === STATE.CAKE && !candlesBlown) {
            e.preventDefault();
            startBlowing();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && currentState === STATE.CAKE && !candlesBlown && isBlowing) {
            e.preventDefault();
            stopBlowing();
        }
    });
    
    if (cakeContainer) {
        cakeContainer.addEventListener('mousedown', () => {
            if (currentState === STATE.CAKE && !candlesBlown) {
                startBlowing();
            }
        });
        
        cakeContainer.addEventListener('mouseup', () => {
            if (currentState === STATE.CAKE && !candlesBlown && isBlowing) {
                stopBlowing();
            }
        });
        
        cakeContainer.addEventListener('mouseleave', () => {
            if (isBlowing) {
                stopBlowing();
            }
        });
        
        cakeContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (currentState === STATE.CAKE && !candlesBlown) {
                startBlowing();
            }
        });
        
        cakeContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (currentState === STATE.CAKE && !candlesBlown && isBlowing) {
                stopBlowing();
            }
        });
    }
    
    if (finalButton) {
        finalButton.addEventListener('click', () => {
            transitionToFinal();
        });
    }
}


function showScene(state) {
    document.querySelectorAll('.scene').forEach(scene => {
        scene.classList.remove('active');
    });
    
    let targetScene;
    switch(state) {
        case STATE.CAKE:
            targetScene = cakeScene;
            break;
        case STATE.LETTER:
            targetScene = letterScene;
            initializeLetterScene();
            break;
        case STATE.FINAL:
            targetScene = finalScene;
            break;
    }
    
    if (targetScene) {
        setTimeout(() => {
            targetScene.classList.add('active');
            currentState = state;
        }, 100);
    }
}

function transitionToLetter() {
    if (blowVolumeCheckInterval) {
        clearInterval(blowVolumeCheckInterval);
        blowVolumeCheckInterval = null;
    }
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
    }
    
    cakeScene.classList.add('transitioning');
    
    setTimeout(() => {
        showScene(STATE.LETTER);
        cakeScene.classList.remove('transitioning');
    }, 800);
}

function transitionToFinal() {
    letterScene.classList.add('transitioning');
    
    const fadeOverlay = document.createElement('div');
    fadeOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 1.5s ease-out;
    `;
    document.body.appendChild(fadeOverlay);
    
    setTimeout(() => {
        fadeOverlay.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        showScene(STATE.FINAL);
        setTimeout(() => {
            fadeOverlay.style.opacity = '0';
            setTimeout(() => {
                fadeOverlay.remove();
                initializeTreeAnimation();
            }, 1500);
        }, 500);
        letterScene.classList.remove('transitioning');
    }, 1500);
}

// candle blow code

function startBlowing() {
    if (candlesBlown || isBlowing) return;
    
    isBlowing = true;
    
    candles.forEach(flame => {
        flame.classList.add('blowing');
    });
}

function stopBlowing() {
    if (!isBlowing || candlesBlown) return;
    
    isBlowing = false;
    candlesBlown = true;
    
    if (blowSound) {
        blowSound.play().catch(e => console.log('Audio play prevented:', e));
    }
    
    candles.forEach((flame, index) => {
        setTimeout(() => {
            blowOutCandle(flame, index);
        }, index * 250);
    });
    
    setTimeout(() => {
        celebrate();
    }, candles.length * 250 + 600);
}

function blowOutCandle(flame, index) {
    flame.classList.remove('blowing');
    flame.classList.add('blown');
    createSmoke(flame, index);
}

function createSmoke(flame, candleIndex) {
    const candle = flame.closest('.candle');
    const candleRect = candle.getBoundingClientRect();
    const containerRect = smokeContainer.getBoundingClientRect();
    
    const numParticles = 6;
    
    for (let i = 0; i < numParticles; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        
        const startX = candleRect.left + candleRect.width / 2 - containerRect.left;
        const startY = candleRect.top - containerRect.top;
        const drift = (Math.random() - 0.5) * 120;
        
        smoke.style.left = startX + 'px';
        smoke.style.top = startY + 'px';
        smoke.style.setProperty('--drift', drift + 'px');
        smoke.style.animationDelay = (i * 0.15) + 's';
        
        smokeContainer.appendChild(smoke);
        
        setTimeout(() => smoke.remove(), 2500);
    }
}

function celebrate() {
    if (bgMusic) {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(e => console.log('Music play prevented:', e));
    }
    
    if (chimeSound) {
        chimeSound.volume = 0.6;
        chimeSound.play().catch(e => console.log('Chime play prevented:', e));
    }
    
    createConfetti();
    
    if (glowExpand) {
        glowExpand.classList.add('active');
    }
    
    if (cakeContainer) {
        cakeContainer.classList.add('fade-down');
    }
    
    setTimeout(() => {
        transitionToLetter();
    }, 2500);
}

function createConfetti() {
    if (confettiActive) return;
    confettiActive = true;
    
    const numPieces = 60;
    const containerRect = confettiContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    for (let i = 0; i < numPieces; i++) {
        const confetti = document.createElement('div');
        const isHeart = Math.random() > 0.5;
        
        if (isHeart) {
            confetti.className = 'confetti-piece heart';
            confetti.textContent = '❤️';
        } else {
            confetti.className = 'confetti-piece';
            const colors = ['#FF6B9D', '#FFD93D', '#FF9B71', '#E6D4F7', '#FFB8C1'];
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        }
        
        const driftX = (Math.random() - 0.5) * 500;
        
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        confetti.style.setProperty('--drift-x', driftX + 'px');
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        
        confettiContainer.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2500);
    }
}

// partcle effect

function createInitialParticles() {
    const numParticles = 20;
    
    for (let i = 0; i < numParticles; i++) {
        setTimeout(() => {
            createParticle();
        }, i * 200);
    }
}

function createParticle() {
    const particle = document.createElement('div');
    const isHeart = Math.random() > 0.6;
    
    if (isHeart) {
        particle.className = 'particle heart';
        particle.textContent = '❤️';
    } else {
        particle.className = 'particle sparkle';
    }
    
    const startX = Math.random() * 100;
    const delay = Math.random() * 3;
    
    particle.style.left = startX + '%';
    particle.style.bottom = '-20px';
    particle.style.animationDelay = delay + 's';
    
    particlesContainer.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
        }
    }, 20000);
}

// love letter code

function initializeLetterScene() {
    if (envelopeOpened) return;
    
    createFallingHearts();
    
    setTimeout(() => {
        openEnvelope();
    }, 800);
    
    // Start time counter
    startTimeCounter();
}

/**
 * Start time counter from DOB: January 15, 2002
 */
function startTimeCounter() {
    const birthDate = new Date('2002-01-15T00:00:00');

    function updateCounter() {
        const now = new Date();
        const diff = now - birthDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateCounter();
    setInterval(updateCounter, 1000);
}

function createFallingHearts() {
    const numHearts = 30;
    
    for (let i = 0; i < numHearts; i++) {
        setTimeout(() => {
            createFallingHeart();
        }, i * 500);
    }
    
    setInterval(() => {
        if (currentState === STATE.LETTER && fallingHeartsContainer.children.length < 15) {
            createFallingHeart();
        }
    }, 2000);
}

function createFallingHeart() {
    const heart = document.createElement('div');
    heart.className = 'falling-heart';
    heart.textContent = '❤️';
    
    const startX = Math.random() * 100;
    const size = 16 + Math.random() * 16;
    const driftX = (Math.random() - 0.5) * 200;
    const duration = 12 + Math.random() * 8;
    
    heart.style.left = startX + '%';
    heart.style.fontSize = size + 'px';
    heart.style.setProperty('--drift-x', driftX + 'px');
    heart.style.animationDuration = duration + 's';
    
    fallingHeartsContainer.appendChild(heart);
    
    setTimeout(() => {
        if (heart.parentNode) {
            heart.remove();
        }
    }, duration * 1000);
}

function openEnvelope() {
    if (envelopeOpened) return;
    envelopeOpened = true;
    
    console.log('📧 Opening envelope...');
    
    if (envelopeFlap) {
        envelopeFlap.classList.add('open');
    }
    
    setTimeout(() => {
        if (letterPaper) {
            letterPaper.classList.add('visible');
            console.log('📝 Letter visible');
        }
        
        
        setTimeout(() => {
            const loveMessage = document.querySelector('.love-message');
            if (loveMessage) {
                loveMessage.classList.add('visible');
                loveMessage.style.opacity = '1';
                loveMessage.style.transform = 'translateX(0)';
                loveMessage.style.display = 'block';
                console.log('💌 Love message FORCED visible');
            }
        }, 1500);
        
       
        setTimeout(() => {
            const timeCounter = document.getElementById('timeCounter');
            if (timeCounter) {
                timeCounter.classList.add('visible');
                timeCounter.style.opacity = '1';
                timeCounter.style.transform = 'translateX(0)';
                timeCounter.style.display = 'block';
                console.log('⏰ Timer FORCED visible');
            }
        }, 3000);
        
     
        setTimeout(() => {
            if (finalButtonWrapper) {
                finalButtonWrapper.classList.add('visible');
                finalButtonWrapper.style.opacity = '1';
                finalButtonWrapper.style.transform = 'translateX(0)';
                finalButtonWrapper.style.display = 'block';
                console.log('🔘 Button FORCED visible');
            }
        }, 4500);
    }, 1200);
}

// final page love tree

let tree = null;
let treeAnimationFrame = null;
let treeInitialized = false;

function initializeTreeAnimation() {
    if (treeInitialized) return;
    treeInitialized = true;
    
    console.log('🌳 Starting tree animation...');
    
    const canvas = document.getElementById('treeCanvas');
    const treeContainer = document.getElementById('treeContainer');
    
    if (!canvas || !treeContainer) {
        console.error('❌ Canvas or container not found!');
        return;
    }
    
    const containerRect = treeContainer.getBoundingClientRect();
    const actualWidth = containerRect.width || 500;
    const actualHeight = containerRect.height || 600;
    
    console.log('📐 Canvas size:', actualWidth, 'x', actualHeight);
    
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    canvas.style.width = actualWidth + 'px';
    canvas.style.height = actualHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    const w = actualWidth;
    const h = actualHeight;
    const centerX = w / 2;
    const centerY = h * 0.35;
    
    const branchStructure = [
        [centerX, h * 0.95, centerX, h * 0.75, centerX, h * 0.55, 15, 200, []],
        [centerX, h * 0.55, centerX - w * 0.15, h * 0.45, centerX - w * 0.25, centerY, 10, 150, [
            [centerX - w * 0.25, centerY, centerX - w * 0.3, centerY - h * 0.05, centerX - w * 0.33, centerY - h * 0.1, 6, 80, []],
            [centerX - w * 0.25, centerY, centerX - w * 0.28, centerY - h * 0.08, centerX - w * 0.3, centerY - h * 0.12, 5, 70, []],
            [centerX - w * 0.25, centerY, centerX - w * 0.27, centerY + h * 0.03, centerX - w * 0.28, centerY + h * 0.05, 5, 60, []],
        ]],
        [centerX, h * 0.55, centerX + w * 0.15, h * 0.45, centerX + w * 0.25, centerY, 10, 150, [
            [centerX + w * 0.25, centerY, centerX + w * 0.3, centerY - h * 0.05, centerX + w * 0.33, centerY - h * 0.1, 6, 80, []],
            [centerX + w * 0.25, centerY, centerX + w * 0.28, centerY - h * 0.08, centerX + w * 0.3, centerY - h * 0.12, 5, 70, []],
            [centerX + w * 0.25, centerY, centerX + w * 0.27, centerY + h * 0.03, centerX + w * 0.28, centerY + h * 0.05, 5, 60, []],
        ]],
        [centerX, h * 0.45, centerX - w * 0.08, centerY - h * 0.05, centerX - w * 0.1, centerY - h * 0.12, 8, 100, []],
        [centerX, h * 0.45, centerX + w * 0.08, centerY - h * 0.05, centerX + w * 0.1, centerY - h * 0.12, 8, 100, []],
        [centerX, h * 0.4, centerX, centerY - h * 0.1, centerX, centerY - h * 0.18, 7, 90, []],
    ];
    
    tree = new Tree(canvas, actualWidth, actualHeight, {
        seed: { x: actualWidth / 2, y: actualHeight * 0.95 },
        branch: branchStructure,
        bloom: {
            num: 1500,
            width: actualWidth,
            height: actualHeight
        }
    });
    
    console.log('✅ Tree created, starting growth...');
    
    setTimeout(() => {
        startTreeGrowth();
    }, 300);
}

function startTreeGrowth() {
    if (!tree) return;
    
    console.log('🌱 Growing branches FASTER...');
    
    let lastGrowthTime = Date.now();
    const growthSpeed = 20; // FASTER: was 40, now 20 (2x speed)
    
    function animateGrowth() {
        if (!tree || currentState !== STATE.FINAL) {
            return;
        }
        
        const now = Date.now();
        const needsRedraw = (now - lastGrowthTime >= growthSpeed);
        
        if (needsRedraw) {
            tree.clear();
            
            tree.branchs.forEach(branch => {
                if (branch.drawnPoints && branch.drawnPoints.length > 0) {
                    branch.redraw();
                }
            });
            
            if (tree.canGrow()) {
                tree.grow();
            }
            
            lastGrowthTime = now;
        }
        
        if (tree.canGrow()) {
            requestAnimationFrame(animateGrowth);
        } else {
            tree.clear();
            tree.branchs.forEach(branch => {
                if (branch.drawnPoints && branch.drawnPoints.length > 0) {
                    branch.redraw();
                }
            });
            console.log('✅ Branch growth complete - Starting GRADUAL BLOOM');
            
          
            setTimeout(() => {
                startHeartBloom();
            }, 500);
        }
    }
    
    animateGrowth();
}

function startHeartBloom() {
    if (!tree) return;
    
    console.log('🌸 Starting SLOW FADE-IN heart bloom...');
    
    let bloomed = 0;
    const maxBlooms = 1500;
    let waveIndex = 0;
    
    const wavePattern = [
        { hearts: 1, delay: 800 },     // 1 heart - 800ms
        { hearts: 2, delay: 800 },     // 2 more - 800ms
        { hearts: 4, delay: 700 },     // 4 more - 700ms
        { hearts: 8, delay: 700 },     // 8 more - 700ms
        { hearts: 10, delay: 600 },    // 10 more - 600ms
        { hearts: 20, delay: 500 },    // 20 more - 500ms
        { hearts: 30, delay: 400 },    // 30 more - 400ms
        { hearts: 50, delay: 350 },    // 50 more - 350ms
        { hearts: 80, delay: 300 },    // 80 more - 300ms
        { hearts: 100, delay: 250 },   // 100 more - 250ms
        { hearts: 150, delay: 200 },   // 150 more - 200ms
        { hearts: 200, delay: 150 },   // 200 more - 150ms
        { hearts: 250, delay: 100 },   // 250 more - 100ms
        { hearts: 300, delay: 80 }     // Final push
    ];
    
    function addNextWave() {
        if (bloomed >= maxBlooms || !tree.canFlower()) {
            console.log('✅ Bloom complete! Total hearts:', bloomed);
            setTimeout(() => {
                startTreeAnimationLoop();
                startFallingPetalsAnimation();
            }, 1000);
            return;
        }
        
        let currentWave;
        if (waveIndex < wavePattern.length) {
            currentWave = wavePattern[waveIndex];
        } else {
            currentWave = { hearts: 200, delay: 60 };
        }
        
        const heartsToAdd = Math.min(currentWave.hearts, maxBlooms - bloomed);
        
        if (heartsToAdd > 0) {
            tree.flower(heartsToAdd);
            bloomed += heartsToAdd;
            
            console.log('🌸 Wave', (waveIndex + 1), '- Added:', heartsToAdd, '- Total:', bloomed);
        }
        
        waveIndex++;
        
        if (bloomed < maxBlooms) {
            setTimeout(addNextWave, currentWave.delay);
        } else {
            console.log('✅ Bloom complete! Total hearts:', bloomed);
            setTimeout(() => {
                startTreeAnimationLoop();
                startFallingPetalsAnimation();
            }, 1000);
        }
    }
    
    addNextWave();
}

function startTreeAnimationLoop() {
    if (treeAnimationFrame) return;
    
    console.log('🎬 Starting animation loop...');
    
    let lastFrameTime = Date.now();
    const targetFPS = 60;
    const frameDelay = 1000 / targetFPS;
    let fallingStartTime = Date.now();
    const fallingDelay = 1000;
    
    function animate() {
        if (currentState !== STATE.FINAL || !tree) {
            if (treeAnimationFrame) {
                cancelAnimationFrame(treeAnimationFrame);
                treeAnimationFrame = null;
            }
            return;
        }
        
        const now = Date.now();
        if (now - lastFrameTime < frameDelay) {
            treeAnimationFrame = requestAnimationFrame(animate);
            return;
        }
        lastFrameTime = now;
        
        tree.clear();
        
        tree.branchs.forEach(branch => {
            if (branch.drawnPoints && branch.drawnPoints.length > 0) {
                branch.redraw();
            }
        });
        
        var blooms = tree.blooms;
        for (var i = 0; i < blooms.length; i++) {
            blooms[i].draw();
        }
        
        if (now - fallingStartTime > fallingDelay) {
            tree.jump();
        }
        
        treeAnimationFrame = requestAnimationFrame(animate);
    }
    
    animate();
}

function startFallingPetalsAnimation() {
    console.log('🍂 Starting MORE falling petals...');
    if (!treeAnimationFrame) {
        startTreeAnimationLoop();
    }
}

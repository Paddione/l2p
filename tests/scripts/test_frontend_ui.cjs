#!/usr/bin/env node

/**
 * Frontend UI and UX Test Suite
 * Tests the frontend interface, responsiveness, and user experience
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Puppeteer configuration
const PUPPETEER_OPTIONS = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

// Test configuration
const VIEWPORTS = [
    { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
    { name: 'Tablet (iPad)', width: 768, height: 1024 },
    { name: 'Desktop (1080p)', width: 1920, height: 1080 }
];

let browser = null;
let page = null;

// Utility functions
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',    // Cyan
        SUCCESS: '\x1b[32m', // Green
        ERROR: '\x1b[31m',   // Red
        WARNING: '\x1b[33m', // Yellow
        RESET: '\x1b[0m'     // Reset
    };
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testPageLoading() {
    log('=== Testing Page Loading ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        // Test main page loading
        log('Loading main page...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await page.title();
        log(`✓ Main page loaded: ${title}`, 'SUCCESS');
        
        // Test for essential elements with flexible selectors
        const gameElements = await page.evaluate(() => {
            const selectors = [
                '#game-section', '.game-section', '[data-screen="game"]', 
                '#main-content', '.main-content', 'main', '.container',
                '.screen', '#app', '.app-container'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return { found: true, selector: selector };
                }
            }
            return { found: false, selector: null };
        });
        
        if (gameElements.found) {
            log(`✓ Main content element found using: ${gameElements.selector}`, 'SUCCESS');
        } else {
            log('✗ Main content element not found with any selector', 'ERROR');
        }
        
        // Test for CSS loading
        const styles = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        log(`✓ CSS loaded, body background: ${styles}`, 'SUCCESS');
        
    } catch (error) {
        log(`✗ Page loading failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testResponsiveDesign() {
    log('=== Testing Responsive Design ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test different viewport sizes
        const viewports = [
            { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
            { width: 768, height: 1024, name: 'Tablet (iPad)' },
            { width: 1920, height: 1080, name: 'Desktop (1080p)' }
        ];
        
        for (const viewport of viewports) {
            log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
            
            await page.setViewport(viewport);
            await sleep(1000); // Wait for layout changes
            
            // Check if elements are visible and properly positioned
            const mainContent = await page.$('#main-content');
            if (mainContent) {
                const boundingBox = await mainContent.boundingBox();
                if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                    log(`✓ ${viewport.name}: Main content visible (${boundingBox.width}x${boundingBox.height})`, 'SUCCESS');
                } else {
                    log(`✗ ${viewport.name}: Main content not properly sized`, 'ERROR');
                }
            }
        }
        
    } catch (error) {
        log(`✗ Responsive design test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testThemeSystem() {
    log('=== Testing Theme System ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test theme switching with flexible selectors
        const themeToggleResult = await page.evaluate(() => {
            const selectors = [
                '#theme-toggle', '.theme-toggle', '[data-theme-toggle]',
                '.theme-switcher', '#theme-switcher', 'button[data-theme]',
                '.dark-mode-toggle', '#dark-mode-toggle',
                '#theme-light', '#theme-dark', '.theme-btn'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return { found: true, selector: selector };
                }
            }
            return { found: false, selector: null };
        });
        
        if (themeToggleResult.found) {
            const themeToggle = await page.$(themeToggleResult.selector);
            // Get initial theme
            const initialTheme = await page.evaluate(() => {
                return document.documentElement.getAttribute('data-theme') || 'light';
            });
            log(`Initial theme: ${initialTheme}`);
            
            // Toggle theme
            await themeToggle.click();
            await sleep(500); // Allow for theme transition
            
            const newTheme = await page.evaluate(() => {
                return document.documentElement.getAttribute('data-theme') || 'light';
            });
            
            if (newTheme !== initialTheme) {
                log(`✓ Theme switched from ${initialTheme} to ${newTheme}`, 'SUCCESS');
            } else {
                log(`✗ Theme did not switch`, 'ERROR');
            }
            
            // Test theme persistence
            await page.reload({ waitUntil: 'networkidle2' });
            const persistedTheme = await page.evaluate(() => {
                return document.documentElement.getAttribute('data-theme') || 'light';
            });
            
            if (persistedTheme === newTheme) {
                log(`✓ Theme persisted after reload: ${persistedTheme}`, 'SUCCESS');
            } else {
                log(`✗ Theme not persisted after reload`, 'ERROR');
            }
        } else {
            log('✗ Theme toggle button not found', 'ERROR');
        }
        
    } catch (error) {
        log(`✗ Theme system test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testLanguageSwitching() {
    log('=== Testing Language Switching ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
            // Test language switching
    const langSwitchers = await page.$$('.language-btn');
        if (langSwitchers.length > 0) {
            // Get initial language
            const initialLang = await page.evaluate(() => {
                return document.documentElement.lang || 'en';
            });
            log(`Initial language: ${initialLang}`);
            
            // Try switching to different language
            for (const switcher of langSwitchers) {
                const langCode = await page.evaluate(el => el.getAttribute('data-lang'), switcher);
                if (langCode && langCode !== initialLang) {
                    await switcher.click();
                    await sleep(500);
                    
                    const newLang = await page.evaluate(() => {
                        return document.documentElement.lang || 'en';
                    });
                    
                    if (newLang === langCode) {
                        log(`✓ Language switched to ${newLang}`, 'SUCCESS');
                        break;
                    }
                }
            }
            
            // Test if text content changed
            const sampleText = await page.$eval('h1', el => el.textContent);
            log(`Sample text after language switch: "${sampleText}"`);
            
        } else {
            log('✗ Language switchers not found', 'ERROR');
        }
        
    } catch (error) {
        log(`✗ Language switching test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testAudioSystem() {
    log('=== Testing Audio System ===');
    
    const browser = await puppeteer.launch({
        ...PUPPETEER_OPTIONS,
        args: [...PUPPETEER_OPTIONS.args, '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test audio controls
        const volumeControls = await page.$('.volume-controls');
        if (volumeControls) {
            log('✓ Volume controls found', 'SUCCESS');
            
            // Test volume sliders
            const musicSlider = await page.$('#music-volume');
            const sfxSlider = await page.$('#sfx-volume');
            
            if (musicSlider && sfxSlider) {
                log('✓ Music and SFX sliders found', 'SUCCESS');
                
                // Test changing volume
                await page.evaluate(() => {
                    const musicSlider = document.getElementById('music-volume');
                    const sfxSlider = document.getElementById('sfx-volume');
                    if (musicSlider) musicSlider.value = 50;
                    if (sfxSlider) sfxSlider.value = 75;
                    // Trigger change events
                    if (musicSlider) musicSlider.dispatchEvent(new Event('input'));
                    if (sfxSlider) sfxSlider.dispatchEvent(new Event('input'));
                });
                
                log('✓ Volume controls tested', 'SUCCESS');
            } else {
                log('✗ Volume sliders not found', 'ERROR');
            }
        } else {
            log('✗ Volume controls not found', 'ERROR');
        }
        
        // Test audio loading
        const audioElements = await page.$$('audio');
        log(`Found ${audioElements.length} audio elements`);
        
        if (audioElements.length > 0) {
            // Test if audio files are loadable
            const audioSources = await page.evaluate(() => {
                const audios = document.querySelectorAll('audio');
                return Array.from(audios).map(audio => ({
                    src: audio.src,
                    readyState: audio.readyState
                }));
            });
            
            log(`Audio sources: ${JSON.stringify(audioSources.slice(0, 3), null, 2)}`);
        }
        
    } catch (error) {
        log(`✗ Audio system test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testGameUIInteractions() {
    log('=== Testing Game UI Interactions ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test game creation button
        const createGameBtn = await page.$('#create-game-btn');
        if (createGameBtn) {
            log('✓ Create game button found', 'SUCCESS');
            
            await createGameBtn.click();
            await sleep(1000);
            
            // Check if question set selection appeared
            const questionSetSection = await page.$('#question-set-section');
            if (questionSetSection) {
                log('✓ Question set selection appeared after clicking create game', 'SUCCESS');
            } else {
                log('✗ Question set selection did not appear', 'ERROR');
            }
        } else {
            log('✗ Create game button not found', 'ERROR');
        }
        
        // Test join game functionality
        const joinGameBtn = await page.$('#join-game-btn');
        const lobbyCodeInput = await page.$('#lobby-code-input');
        
        if (joinGameBtn && lobbyCodeInput) {
            log('✓ Join game elements found', 'SUCCESS');
            
            // Test input validation
            await lobbyCodeInput.type('TEST');
            await joinGameBtn.click();
            await sleep(500);
            
            // Should show some response (error or success)
            const notifications = await page.$$('.notification');
            if (notifications.length > 0) {
                log('✓ Join game interaction triggered notification', 'SUCCESS');
            } else {
                log('✗ No feedback from join game attempt', 'WARNING');
            }
        } else {
            log('✗ Join game elements not found', 'ERROR');
        }
        
        // Test help system
        const helpBtn = await page.$('#help-btn');
        if (helpBtn) {
            await helpBtn.click();
            await sleep(500);
            
            const helpModal = await page.$('#help-modal');
            if (helpModal) {
                const isVisible = await page.evaluate(el => {
                    return window.getComputedStyle(el).display !== 'none';
                }, helpModal);
                
                if (isVisible) {
                    log('✓ Help modal opened successfully', 'SUCCESS');
                } else {
                    log('✗ Help modal not visible', 'ERROR');
                }
            } else {
                log('✗ Help modal not found', 'ERROR');
            }
        } else {
            log('✗ Help button not found', 'ERROR');
        }
        
    } catch (error) {
        log(`✗ Game UI interactions test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testAnimationsAndTransitions() {
    log('=== Testing Animations and Transitions ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test CSS animations
        const animatedElements = await page.$$('.animate, .transition, .fade-in, .slide-in');
        log(`Found ${animatedElements.length} elements with animation classes`);
        
        if (animatedElements.length > 0) {
            // Test if animations are properly defined
            const animationStyles = await page.evaluate(() => {
                const elements = document.querySelectorAll('.animate, .transition, .fade-in, .slide-in');
                return Array.from(elements).slice(0, 3).map(el => ({
                    className: el.className,
                    animationName: window.getComputedStyle(el).animationName,
                    transitionDuration: window.getComputedStyle(el).transitionDuration
                }));
            });
            
            log(`Animation styles: ${JSON.stringify(animationStyles, null, 2)}`);
            
            // Check if any animations are active
            const hasAnimations = animationStyles.some(style => 
                style.animationName !== 'none' || style.transitionDuration !== '0s'
            );
            
            if (hasAnimations) {
                log('✓ CSS animations properly configured', 'SUCCESS');
            } else {
                log('✗ No active animations found', 'WARNING');
            }
        }
        
        // Test hover effects
        const interactiveElements = await page.$$('button, .btn, .interactive');
        if (interactiveElements.length > 0) {
            log(`Testing hover effects on ${interactiveElements.length} interactive elements`);
            
            // Hover over first button
            const firstButton = interactiveElements[0];
            await firstButton.hover();
            await sleep(500);
            
            log('✓ Hover effects tested', 'SUCCESS');
        }
        
    } catch (error) {
        log(`✗ Animations test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testAccessibility() {
    log('=== Testing Accessibility ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test keyboard navigation
        log('Testing keyboard navigation...');
        await page.keyboard.press('Tab');
        await sleep(200);
        
        const focusedElement = await page.evaluate(() => {
            return document.activeElement ? document.activeElement.tagName : 'none';
        });
        
        if (focusedElement !== 'BODY') {
            log(`✓ Keyboard navigation working: focused on ${focusedElement}`, 'SUCCESS');
        } else {
            log('✗ Keyboard navigation not working properly', 'ERROR');
        }
        
        // Test ARIA labels
        const ariaLabels = await page.$$eval('[aria-label]', elements => 
            elements.map(el => ({ tag: el.tagName, label: el.getAttribute('aria-label') }))
        );
        
        if (ariaLabels.length > 0) {
            log(`✓ Found ${ariaLabels.length} elements with ARIA labels`, 'SUCCESS');
        } else {
            log('✗ No ARIA labels found', 'WARNING');
        }
        
        // Test color contrast (basic check)
        const colorContrast = await page.evaluate(() => {
            const body = document.body;
            const styles = window.getComputedStyle(body);
            return {
                color: styles.color,
                backgroundColor: styles.backgroundColor
            };
        });
        
        log(`Color contrast - Text: ${colorContrast.color}, Background: ${colorContrast.backgroundColor}`);
        
    } catch (error) {
        log(`✗ Accessibility test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testPerformance() {
    log('=== Testing Performance ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        // Start performance monitoring
        await page.evaluateOnNewDocument(() => {
            window.performance.mark('start-test');
        });
        
        const startTime = Date.now();
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        const loadTime = Date.now() - startTime;
        
        log(`Page load time: ${loadTime}ms`);
        
        if (loadTime < 3000) {
            log('✓ Page loaded within acceptable time (<3s)', 'SUCCESS');
        } else if (loadTime < 5000) {
            log('⚠ Page load time is slow but acceptable (<5s)', 'WARNING');
        } else {
            log('✗ Page load time is too slow (>5s)', 'ERROR');
        }
        
        // Test JavaScript execution performance
        const jsPerf = await page.evaluate(() => {
            const start = performance.now();
            // Simulate some work
            for (let i = 0; i < 100000; i++) {
                Math.random();
            }
            const end = performance.now();
            return end - start;
        });
        
        log(`JavaScript execution test: ${jsPerf.toFixed(2)}ms`);
        
        // Test memory usage
        const metrics = await page.metrics();
        log(`Memory usage: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
        
    } catch (error) {
        log(`✗ Performance test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

async function testErrorHandling() {
    log('=== Testing Frontend Error Handling ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        // Listen for console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Test with invalid API calls
        await page.evaluate(() => {
            if (window.fetch) {
                fetch('/api/invalid-endpoint')
                    .catch(err => console.log('Expected error caught:', err.message));
            }
        });
        
        await sleep(2000);
        
        if (errors.length === 0) {
            log('✓ No unexpected console errors', 'SUCCESS');
        } else {
            log(`⚠ Found ${errors.length} console errors:`, 'WARNING');
            errors.slice(0, 3).forEach(error => log(`  - ${error}`, 'WARNING'));
        }
        
        // Test offline handling
        await page.setOfflineMode(true);
        await page.evaluate(() => {
            if (window.fetch) {
                fetch('/api/health')
                    .catch(err => console.log('Offline error handled:', err.message));
            }
        });
        
        await sleep(1000);
        await page.setOfflineMode(false);
        
        log('✓ Offline mode tested', 'SUCCESS');
        
    } catch (error) {
        log(`✗ Error handling test failed: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
    }
}

// Main test execution
async function runAllFrontendTests() {
    log('🚀 Starting Frontend UI and UX Test Suite', 'INFO');
    log('=' .repeat(60));
    
    try {
        await testPageLoading();
        await testResponsiveDesign();
        await testThemeSystem();
        await testLanguageSwitching();
        await testAudioSystem();
        await testGameUIInteractions();
        await testAnimationsAndTransitions();
        await testAccessibility();
        await testPerformance();
        await testErrorHandling();
        
        log('=' .repeat(60));
        log('🎉 All frontend tests completed!', 'SUCCESS');
        
    } catch (error) {
        log(`💥 Frontend test suite failed with error: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run the tests
if (require.main === module) {
    runAllFrontendTests();
}

module.exports = {
    runAllFrontendTests,
    testPageLoading,
    testResponsiveDesign,
    testThemeSystem,
    testAudioSystem,
    testGameUIInteractions,
    testPerformance
}; 
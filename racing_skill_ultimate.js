// ==UserScript==
// @name         Racing Skill Display Ultimate
// @namespace    https://github.com/qaimali7-web
// @version      2.1
// @description  Auto-prompts for API key once on load. Shows RS from page, RP from API.
// @author       Qaim
// @match        https://www.torn.com/page.php?sid=racing*
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.torn.com
// @homepageURL  https://github.com/qaimali7-web/Racing-Skill-Display-New
// @updateURL    https://raw.githubusercontent.com/qaimali7-web/Racing-Skill-Display-New/main/racing_skill.user.js
// @downloadURL  https://raw.githubusercontent.com/qaimali7-web/Racing-Skill-Display-New/main/racing_skill.user.js
// ==/UserScript==

(function() {
    'use strict';

    const API_KEY_STORAGE = 'torn_racing_api_key';
    const POS_TOP_STORAGE = 'torn_racing_pos_top';
    const POS_LEFT_STORAGE = 'torn_racing_pos_left';
    
    // Flag to ensure we only prompt once per page load
    let hasPrompted = false;

    // --- 1. HELPER: Calculate Next Class Requirements ---
    function getPointsNextClass(currentPoints) {
        const pts = parseInt(currentPoints, 10);
        if (isNaN(pts)) return '?';

        if (pts < 25) return `+${25 - pts} (D)`;   // Aiming for Class D
        if (pts < 100) return `+${100 - pts} (C)`; // Aiming for Class C
        if (pts < 250) return `+${250 - pts} (B)`; // Aiming for Class B
        if (pts < 475) return `+${475 - pts} (A)`; // Aiming for Class A
        return 'Max'; // Already Class A
    }

    // --- 2. DOM SCRAPER: Get Racing Skill Only ---
    function getSkillFromPage() {
        const labels = Array.from(document.querySelectorAll('.skill-desc'));
        const targetLabel = labels.find(el => el.textContent.trim() === 'RACING SKILL');

        if (targetLabel && targetLabel.nextElementSibling && targetLabel.nextElementSibling.classList.contains('skill')) {
            return targetLabel.nextElementSibling.textContent.trim();
        }
        return null;
    }

    // --- 3. DATA FETCHING ---
    function getStoredApiKey() {
        let key = GM_getValue(API_KEY_STORAGE);
        if (key && key.length === 16) return key;
        return null;
    }

    function promptForKey() {
        // Prevent multiple prompts
        if (hasPrompted) return;
        hasPrompted = true;

        let key = prompt("Enter Torn Public API Key (16 chars):");
        
        if (key !== null && key.length === 16) {
            GM_setValue(API_KEY_STORAGE, key);
            alert("API Key saved. Refreshing page...");
            location.reload();
        } else if (key === null) {
            // User cancelled - Show the bar text instead
            displayBox("Enter Public API key (Click to Fix)", true);
        } else {
            alert("Invalid Key length.");
            displayBox("Invalid Key. Click to Fix.", true);
        }
    }

    function fetchAndDisplayData(key) {
        const url = `https://api.torn.com/user/?selections=personalstats&key=${key}&time=${Date.now()}`;
        
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    
                    if (data.error && data.error.code === 2) {
                        GM_setValue(API_KEY_STORAGE, ''); // Clear invalid key
                        displayBox("Invalid Key. Click to fix.", true);
                        return;
                    } 
                    
                    if (data.personalstats) {
                        const rp = data.personalstats.racingpoints || 0;
                        
                        // Prefer Page Skill, fallback to API Skill
                        const pageSkill = getSkillFromPage();
                        const apiSkill = parseFloat(data.personalstats.racingskill).toFixed(2);
                        const finalSkill = pageSkill ? pageSkill : apiSkill;

                        updateDisplay(finalSkill, rp);
                    }
                } catch (e) { console.error(e); }
            }
        });
    }

    // --- 4. UI: DRAG & DROP ---
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onStart = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;
            element.style.cursor = 'grabbing';
        };

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            element.style.left = `${initialLeft + (clientX - startX)}px`;
            element.style.top = `${initialTop + (clientY - startY)}px`;
        };

        const onEnd = () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                GM_setValue(POS_LEFT_STORAGE, element.style.left);
                GM_setValue(POS_TOP_STORAGE, element.style.top);
            }
        };

        element.addEventListener('mousedown', (e) => {
            if(e.target.tagName !== 'SPAN' || e.target.id !== 'enter-key-btn') {
                onStart(e.clientX, e.clientY);
                e.preventDefault();
            }
        });
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);

        element.addEventListener('touchstart', (e) => {
            if(e.target.tagName !== 'SPAN' || e.target.id !== 'enter-key-btn') {
                const touch = e.touches[0];
                onStart(touch.clientX, touch.clientY);
                e.preventDefault();
            }
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            onMove(touch.clientX, touch.clientY);
        }, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    // --- 5. UI: DISPLAY BOX ---
    function updateDisplay(rs, rp) {
        const nextClassText = getPointsNextClass(rp);
        const html = `
            🏁 RS: <span style="color:#00ff00;">${rs}</span> 
            <span style="color:#888;">|</span> 
            RP: <span style="color:#00ccff;">${rp}</span> 
            <span style="font-size: 0.9em; color:#ffff00;">(${nextClassText})</span>
        `;
        displayBox(html, false);
    }

    function displayBox(contentHtml, isClickableSetup) {
        let box = document.getElementById('rs-display-box');

        if (!box) {
            const target = document.querySelector('.racing-main-wrap');
            if (!target) return;

            if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

            box = document.createElement('div');
            box.id = 'rs-display-box';
            box.style.cssText = `
                position: absolute;
                top: ${GM_getValue(POS_TOP_STORAGE, '95px')};
                left: ${GM_getValue(POS_LEFT_STORAGE, '26px')};
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 6px 10px;
                border-radius: 6px;
                font-weight: bold;
                border: 1px solid #555;
                z-index: 99999;
                font-size: 13px;
                cursor: move;
                user-select: none;
                touch-action: none;
                white-space: nowrap;
                font-family: Arial, sans-serif;
            `;
            target.appendChild(box);
            makeDraggable(box);
        }

        if (isClickableSetup) {
            box.innerHTML = `<span id="enter-key-btn" style="color: #ff9900; cursor: pointer; text-decoration: underline;">${contentHtml}</span>`;
            const btn = document.getElementById('enter-key-btn');
            if(btn) {
                // Clicking the text triggers the prompt again manually
                btn.onclick = function(e) { 
                    e.stopPropagation(); 
                    hasPrompted = false; // Reset so prompt can appear again
                    promptForKey(); 
                };
                btn.ontouchstart = function(e) { e.stopPropagation(); }
            }
        } else {
            box.innerHTML = contentHtml;
        }
    }

    // --- 6. MAIN LOOP ---
    const observer = new MutationObserver(() => {
        if (document.querySelector('.racing-main-wrap') && !document.getElementById('rs-display-box')) {
            
            const key = getStoredApiKey();
            
            if (key) {
                // Has key -> Run Logic
                fetchAndDisplayData(key);
            } else {
                // No Key -> Prompt ONCE
                if (!hasPrompted) {
                    promptForKey();
                } else {
                    // Already prompted and cancelled? Show button.
                    displayBox("Enter Public API key (Click to Fix)", true);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();

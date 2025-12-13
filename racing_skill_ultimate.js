// ==UserScript==
// @name         Racing Skill Display Ultimate
// @namespace    https://github.com/qaimali7-web
// @version      2.2
// @description  A draggable overlay displaying accurate Racing Skill, Points.
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

    let hasPrompted = false;
    
    // Global State
    let globalState = {
        rs: '...',       
        rp: '...',       
        tp: '...',       
        needed: '...',   
        targetClass: '...' 
    };

    // --- 1. LOGIC: Next Class Calculation ---
    function updateClassData(totalEarned) {
        const pts = parseInt(totalEarned, 10);
        if (isNaN(pts)) {
            globalState.needed = '?';
            globalState.targetClass = '?';
            return;
        }

        if (pts < 25) {
            globalState.needed = 25 - pts;
            globalState.targetClass = 'Class D';
        } else if (pts < 100) {
            globalState.needed = 100 - pts;
            globalState.targetClass = 'Class C';
        } else if (pts < 250) {
            globalState.needed = 250 - pts;
            globalState.targetClass = 'Class B';
        } else if (pts < 475) {
            globalState.needed = 475 - pts;
            globalState.targetClass = 'Class A';
        } else {
            globalState.needed = 0;
            globalState.targetClass = 'Max';
        }
    }

    // --- 2. SCRAPERS ---
    function getRpFromFooter() {
        // Scans specifically for "You have X racing points available"
        const bodyText = document.body.innerText || ""; 
        const match = bodyText.match(/You have\s+(\d+)\s+racing points/i);
        if (match && match[1]) return match[1];
        return null;
    }

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
        if (hasPrompted) return;
        hasPrompted = true;

        let key = prompt("Enter Torn Public API Key (16 chars):");
        if (key !== null && key.length === 16) {
            GM_setValue(API_KEY_STORAGE, key);
            alert("API Key saved. Refreshing page...");
            location.reload();
        } else if (key === null) {
            displayBox("Enter Public API key (Click to Fix)", true);
        } else {
            alert("Invalid Key length.");
            displayBox("Invalid Key. Click to Fix.", true);
        }
    }

    function fetchApiData(key) {
        const url = `https://api.torn.com/user/?selections=personalstats&key=${key}&time=${Date.now()}`;
        
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error && data.error.code === 2) {
                        GM_setValue(API_KEY_STORAGE, '');
                        displayBox("Invalid Key. Click to fix.", true);
                        return;
                    } 
                    if (data.personalstats) {
                        // 1. Total Points & Class Logic
                        const totalEarned = data.personalstats.racingpointsearned;
                        if (totalEarned !== undefined) {
                            globalState.tp = totalEarned;
                            updateClassData(totalEarned);
                        }

                        // 2. Skill (Backup if page read fails)
                        globalState.rs = parseFloat(data.personalstats.racingskill).toFixed(2);
                        
                        // 3. Current RP (Backup ONLY if footer not found)
                        if (globalState.rp === '...') {
                            globalState.rp = data.personalstats.racingpoints || 0;
                        }
                        
                        refreshDisplay();
                    }
                } catch (e) { console.error(e); }
            }
        });
    }

    // --- 4. CONTINUOUS CHECK LOOP ---
    function refreshDisplay() {
        renderBox(globalState);
    }

    function scanDomUpdates() {
        // Priority 1: Visual Racing Skill
        const pageSkill = getSkillFromPage();
        if (pageSkill) globalState.rs = pageSkill;

        // Priority 2: Footer Authority for Racing Points
        // If found, this overrides any API data immediately
        const footerRp = getRpFromFooter();
        if (footerRp) {
            globalState.rp = footerRp; 
        }
        
        refreshDisplay();
    }

    // --- 5. UI RENDERER ---
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
                onStart(e.clientX, e.clientY); e.preventDefault();
            }
        });
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);
        element.addEventListener('touchstart', (e) => {
            if(e.target.tagName !== 'SPAN' || e.target.id !== 'enter-key-btn') {
                const touch = e.touches[0]; onStart(touch.clientX, touch.clientY); e.preventDefault();
            }
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0]; onMove(touch.clientX, touch.clientY);
        }, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    function renderBox(state) {
        const html = `
            <div style="margin-bottom: 2px;">
                🏁 RS: <span style="color:#00ff00;">${state.rs}</span> 
                <span style="color:#666;">|</span> 
                RP: <span style="color:#00ccff;">${state.rp}</span>
                <span style="color:#666;">|</span> 
                TP: <span style="color:#ff66ff;">${state.tp}</span>
            </div>
            <div style="font-size: 0.9em; border-top: 1px solid #444; padding-top: 2px; color:#ddd;">
                RP Needed: <span style="color:#ff3333;">${state.needed}</span> 
                <span style="color:#666;">|</span> 
                Next Class: <span style="color:#ffd700;">${state.targetClass}</span>
            </div>
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
                background: rgba(0, 0, 0, 0.92);
                color: #fff;
                padding: 8px 10px;
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
                line-height: 1.4;
                text-align: left;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5);
            `;
            target.appendChild(box);
            makeDraggable(box);
        }
        
        if (isClickableSetup) {
            box.innerHTML = `<span id="enter-key-btn" style="color: #ff9900; cursor: pointer; text-decoration: underline;">${contentHtml}</span>`;
            const btn = document.getElementById('enter-key-btn');
            if(btn) {
                btn.onclick = function(e) { e.stopPropagation(); hasPrompted = false; promptForKey(); };
                btn.ontouchstart = function(e) { e.stopPropagation(); }
            }
        } else {
            box.innerHTML = contentHtml;
        }
    }

    // --- 6. INITIALIZATION ---
    const observer = new MutationObserver(() => {
        if (document.querySelector('.racing-main-wrap')) {
            if (!document.getElementById('rs-display-box')) {
                const key = getStoredApiKey();
                if (key) {
                    fetchApiData(key);
                    
                    // Continuous Check: Runs every 1s for 10s to catch delayed footer loading
                    let checks = 0;
                    const interval = setInterval(() => {
                        scanDomUpdates();
                        checks++;
                        if (checks > 10) clearInterval(interval);
                    }, 1000);
                } else {
                    if (!hasPrompted) promptForKey();
                    else displayBox("Enter Public API key (Click to Fix)", true);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();

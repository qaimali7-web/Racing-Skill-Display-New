// ==UserScript==
// @name         Racing Skill Display
// @namespace    https://github.com/qaimali7-web
// @version      3.0
// @description  Shows Racing Skill with 2 decimals. Works on PC and Torn PDA (Mobile).
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
    let userCancelled = false;

    function getApiKey() {
        let key = GM_getValue(API_KEY_STORAGE);
        if (key && key.length === 16) return key;
        if (userCancelled) return null;

        key = prompt("Enter Torn Public API Key (16 chars):");

        if (key === null) {
            userCancelled = true;
            return null;
        }
        if (key.length === 16) {
            GM_setValue(API_KEY_STORAGE, key);
            return key;
        }
        alert("Invalid Key.");
        userCancelled = true;
        return null;
    }

    function fetchRacingSkill(key) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.torn.com/user/?selections=personalstats&key=${key}`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error && data.error.code === 2) {
                        GM_setValue(API_KEY_STORAGE, '');
                        alert("Invalid Key. Refresh.");
                    } else {
                        displayRacingSkill(parseFloat(data.personalstats.racingskill).toFixed(2));
                    }
                } catch (e) { console.error(e); }
            }
        });
    }

    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            element.style.left = `${initialLeft + (e.clientX - startX)}px`;
            element.style.top = `${initialTop + (e.clientY - startY)}px`;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                GM_setValue(POS_LEFT_STORAGE, element.style.left);
                GM_setValue(POS_TOP_STORAGE, element.style.top);
            }
        });

        element.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;

            e.preventDefault(); 
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];

            if (e.cancelable) e.preventDefault(); 
            
            element.style.left = `${initialLeft + (touch.clientX - startX)}px`;
            element.style.top = `${initialTop + (touch.clientY - startY)}px`;
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                GM_setValue(POS_LEFT_STORAGE, element.style.left);
                GM_setValue(POS_TOP_STORAGE, element.style.top);
            }
        });
    }

    function displayRacingSkill(skill) {
        if (document.getElementById('rs-display-box')) return;

        const target = document.querySelector('.racing-main-wrap');
        if (!target) return;

        if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

        const box = document.createElement('div');
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
            font-size: 14px;
            cursor: move;
            user-select: none;
            touch-action: none; /* Helps browser know this is a draggable area */
        `;

        box.innerHTML = `🏁 RS: <span style="color:#00ff00;">${skill}</span>`;
        target.appendChild(box);
        makeDraggable(box);
    }

    const observer = new MutationObserver(() => {
        if (userCancelled) return;
        if (document.querySelector('.racing-main-wrap') && !document.getElementById('rs-display-box')) {
            if (!userCancelled) {
                const key = getApiKey();
                if (key) fetchRacingSkill(key);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();

// ==UserScript==
// @name         Racing Skill Display New
// @namespace    https://github.com/qaimali7-web
// @version      2.0
// @description  Shows your own Racing Skill on the racing page using the Torn API.
// @author       Qaim [2370947]
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
    let userCancelled = false; // Flag to prevent spamming prompts if user cancels

    // Helper to get API Key
    function getApiKey() {
        let key = GM_getValue(API_KEY_STORAGE);

        // 1. If we already have a valid key saved, return it.
        if (key && key.length === 16) {
            return key;
        }

        // 2. If the user already clicked 'Cancel' this session, do not ask again.
        if (userCancelled) {
            return null;
        }

        // 3. Prompt the user
        key = prompt("Please enter your Torn Public API Key (16 characters) to see your Racing Skill:");

        // 4. Handle User Actions
        if (key === null) {
            // User clicked "Cancel"
            console.log("Racing Skill: User cancelled API prompt. Will not ask again this session.");
            userCancelled = true;
            return null;
        }

        if (key.length === 16) {
            // User entered a valid-length key
            GM_setValue(API_KEY_STORAGE, key);
            return key;
        } else {
            // User entered invalid data
            alert("Invalid API Key length. Script paused for this session.");
            userCancelled = true; // Stop asking to prevent alert loops
            return null;
        }
    }

    // Helper to fetch Racing Skill from Torn API
    function fetchRacingSkill(key) {
        const url = `https://api.torn.com/user/?selections=personalstats&key=${key}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error) {
                        console.error("Torn API Error:", data.error.error);
                        // If key is invalid (code 2), clear it so user can re-enter NEXT time (but not immediately to avoid loop)
                        if (data.error.code === 2) {
                             GM_setValue(API_KEY_STORAGE, '');
                             alert("API Key invalid or expired. Please refresh to try again.");
                             userCancelled = true; // Stop trying for now
                        }
                        return;
                    }

                    // Extract Racing Skill
                    const rs = data.personalstats.racingskill;
                    displayRacingSkill(rs);

                } catch (e) {
                    console.error("Error parsing Torn API response", e);
                }
            }
        });
    }

    // Helper to inject HTML into the page
    function displayRacingSkill(skill) {
        // Prevent duplicate boxes
        if (document.getElementById('rs-display-box')) return;

        // Try to find the racing header
        const target = document.querySelector('.content-title') || document.querySelector('.racing-main-wrap');

        if (target) {
            // Ensure parent allows for absolute positioning of child
            if(getComputedStyle(target).position === 'static') {
                target.style.position = 'relative';
            }

            const displayDiv = document.createElement('div');
            displayDiv.id = 'rs-display-box';
            
            // Centered CSS
            displayDiv.style.cssText = `
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                top: 7px;
                background: #333;
                color: #fff;
                padding: 4px 12px;
                border-radius: 5px;
                font-weight: bold;
                border: 1px solid #555;
                z-index: 9999;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                font-size: 14px;
            `;
            
            displayDiv.innerHTML = `🏁 RS: <span style="color: #00ff00;">${parseFloat(skill).toFixed(2)}</span>`;

            // Insert into DOM
            if (target.classList.contains('content-title')) {
                 target.appendChild(displayDiv);
            } else {
                 target.parentNode.insertBefore(displayDiv, target);
            }
        }
    }

    // Main Execution Function
    function init() {
        // If we already cancelled, don't run init logic
        if (userCancelled) return;

        const key = getApiKey();
        if (key) {
            fetchRacingSkill(key);
        }
    }

    // Observer to handle Torn's dynamic page loading
    const observer = new MutationObserver((mutations) => {
        // Optimization: If user cancelled, stop checking DOM to save performance
        if (userCancelled) return;

        // Check if we are on the racing page and the box isn't there yet
        if (document.querySelector('.racing-main-wrap') && !document.getElementById('rs-display-box')) {
            init();
        }
    });

    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });

})();

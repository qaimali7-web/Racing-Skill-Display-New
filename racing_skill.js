// ==UserScript==
// @name         Racing Skill Display New
// @namespace    https://github.com/qaimali7-web
// @version      2.1
// @description  Shows your own Racing Skill on the racing page using the Torn API.
// @author       Qaim [2370947]
// @match        https://www.torn.com/page.php?sid=racing*
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.torn.com
// @homepageURL  https://github.com/qaimali7-web/Racing-Skill-Display-New
// @updateURL    https://raw.githubusercontent.com/qaimali7-web/Racing-Skill-Display-New/main/racing_skill.js
// @downloadURL  https://raw.githubusercontent.com/qaimali7-web/Racing-Skill-Display-New/main/racing_skill.js
// ==/UserScript==

(function() {
    'use strict';

    const API_KEY_STORAGE = 'torn_racing_api_key';

    // Helper to get API Key
    function getApiKey() {
        let key = GM_getValue(API_KEY_STORAGE);
        // Basic validation: must be 16 chars
        if (!key || key.length !== 16) {
            key = prompt("Please enter your Torn Public API Key (16 characters) to see your Racing Skill:");
            if (key && key.length === 16) {
                GM_setValue(API_KEY_STORAGE, key);
                return key;
            } else {
                alert("Invalid API Key. Script cannot run.");
                return null;
            }
        }
        return key;
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
                        // If key is invalid (code 2), clear it so user can re-enter
                        if (data.error.code === 2) {
                             GM_setValue(API_KEY_STORAGE, '');
                             alert("API Key invalid or expired. Please refresh.");
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
            const displayDiv = document.createElement('div');
            displayDiv.id = 'rs-display-box';
            // Styling for the display box
            displayDiv.style.cssText = `
                float: right;
                background: #333;
                color: #fff;
                padding: 5px 10px;
                border-radius: 5px;
                font-weight: bold;
                border: 1px solid #555;
                margin-top: -30px;
                margin-right: 10px;
                z-index: 9999;
                position: relative;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
            `;
            
            // Format to 2 decimal places
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
        const key = getApiKey();
        if (key) {
            fetchRacingSkill(key);
        }
    }

    // Observer to handle Torn's dynamic page loading (Single Page Application behavior)
    const observer = new MutationObserver((mutations) => {
        // Check if we are on the racing page and the box isn't there yet
        if (document.querySelector('.racing-main-wrap') && !document.getElementById('rs-display-box')) {
            init();
        }
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });

})();

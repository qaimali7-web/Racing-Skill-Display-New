# 🏁 Racing Skill Display Ultimate

**Racing Skill Display Ultimate** is a feature-rich UserScript for the text-based RPG **Torn City**. It provides a real-time, drag-and-drop overlay that displays your **Racing Skill (RS)**, **Racing Points (RP)**, and the exact points needed to advance to the next Racing Class.

It uses a **Hybrid Data Strategy** to ensure accuracy and speed while strictly adhering to Torn's scripting rules.

## ✨ Features

* **Hybrid Data Fetching:**
    * **Racing Skill (RS):** Reads directly from the page for 100% accuracy (matches what you see visually). Falls back to API if invisible.
    * **Racing Points (RP):** Fetches securely via the official Torn API.
* **Next Class Calculator:** Automatically calculates how many points you need to reach Class D, C, B, or A.
* **Drag & Drop UI:** Move the stats box anywhere on your screen (PC & Mobile/PDA friendly). Saves position automatically.
* **Smart API Handling:** Prompts for an API key *only once*. If cancelled, it provides a non-intrusive "Click to Fix" button.
* **Visual Cues:**
    * <span style="color:#00ff00">Green</span>: Racing Skill
    * <span style="color:#00ccff">Blue</span>: Racing Points
    * <span style="color:#ffff00">Yellow</span>: Points needed for upgrade

## 🚀 Installation

1.  **Install a Script Manager:**
    * [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Safari, Firefox)
    * [Violentmonkey](https://violentmonkey.github.io/) (Open Source alternative)
    * **Torn PDA:** This script is compatible with the Torn PDA mobile app.

2.  **Install the Script:**
    * [**Click Here to Install**](https://raw.githubusercontent.com/qaimali7-web/Racing-Skill-Display-New/main/racing_skill.user.js)
    * *Or manually copy the code into a new script.*

## 🛡️ Safety & Compliance

This script is designed to be **100% compliant** with Torn City's scripting rules.

* ✅ **Official API Only:** All external data is fetched strictly via `api.torn.com`.
* ✅ **No Hidden Requests:** It never makes background "non-API" requests to Torn.
* ✅ **Active Page Only:** It only reads data from the page you are currently viewing (`.skill-desc` classes). It does not scrape pages in the background.
* ✅ **Efficient:** It triggers only **one** API call per page load to prevent server spamming.

## 📖 How to Use

1.  **Navigate to Racing:** Go to the Racing page in Torn.
2.  **Enter API Key:** On the first load, the script will ask for your **Public API Key**.
    * *If you don't have one, find it in your [Torn Preferences](https://www.torn.com/preferences.php).*
3.  **View Stats:** The box will appear showing your stats.
    * **Format:** `RS: [Skill] | RP: [Points] (+[Needed for Next Class])`
4.  **Move It:** Click and drag the box to your preferred location.

## 🛠️ Troubleshooting

* **"Invalid Key":** If you entered a wrong key, click the "Invalid Key" text on the overlay to re-enter it.
* **Box Disappeared:** If the box goes off-screen, you can reset it by clearing your script storage or reinstalling.
* **Not Updating:** The script updates when you refresh the page.

## 📜 Changelog

### v2.1 (Current)
* **Feature:** Added automatic "Next Class" calculator (e.g., `+12 (B)`).
* **Fix:** Script now prioritizes reading RS from the screen for visual accuracy.
* **UX:** Improved "One-time" prompt logic. If cancelled, shows a button instead of spamming alerts.

---

*Disclaimer: This script is a third-party tool and is not affiliated with Torn City. Use at your own discretion.*

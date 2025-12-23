⌨️ Typing Speed Test V1
=======================

A sleek, dark-themed typing speed application built with **Vanilla JavaScript**. This project was designed to test typing proficiency through various difficulty levels and modes, featuring real-time feedback and persistent high scores.

🚀 Features
-----------

*   **Dynamic Passage Loading**: Fetches typing passages from a JSON data source based on selected difficulty (Easy, Medium, Hard).
    
*   **Two Test Modes**:
    
    *   **Timed (60s)**: A classic countdown mode to see how much you can type in one minute.
        
    *   **Passage**: A marathon mode that tracks how long it takes you to finish a specific text.
        
*   **Real-time Visual Feedback**:
    
    *   Letters turn **Yellow** for correct inputs.
        
    *   Letters turn **Red** for mistakes.
        
    *   A custom vertical cursor tracks your current position.
        
*   **Smart Backspace**: Correcting mistakes removes the error state and correctly calculate the mistake counter to ensure 100% accuracy is still possible.
    
*   **Persistent Personal Best**: Saves your highest WPM and corresponding Accuracy to localStorage, so your record stays even after a refresh.
    
*   **Custom Interactive Cursor**: A bespoke "ring and dot" cursor that reacts to clicks and hovers across the UI.
    

📊 The Math Behind the Stats
----------------------------

To ensure the test is accurate to industry standards, I worked with Gemini to refine the following logic:

*   **Words Per Minute (WPM)**: Calculated using the standard formula where 5 characters equal one word.
    
*   **Accuracy**: Calculated based on net correct characters vs. total attempted characters. The logic was adjusted so that fixed errors (backspaced) do not permanently penalize the final score.
    
*   **Timer Logic**: Implemented a "safety lock" to prevent multiple intervals from running simultaneously, ensuring the clock stays synced.
    

🛠️ Built With
--------------

*   **HTML & CSS**: Custom properties for the dark/gold theme and CSS transitions for the typing animations.
    
*   **JavaScript**: Async/Await for data fetching, DOM manipulation, and Event Listeners for keyboard input.
    
*   **JSON**: Structured data for difficulty-based typing passages.
    

📝 How to Use
-------------

1.  Select your **Difficulty** and **Mode**.
    
2.  Click anywhere on the start modal to begin.
    
3.  The timer starts automatically when you type the first character.
    
4.  Hit Backspace to fix errors or Escape to quickly reset the test.

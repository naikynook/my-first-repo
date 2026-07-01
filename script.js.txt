document.addEventListener('DOMContentLoaded', function() {  // Wait for HTML to fully load before running code
    console.log('JavaScript is now running!');              // Print message to browser console for debugging
    
    // Find HTML elements by their IDs
    const button = document.getElementById('demoButton');      // Get the button element by its ID
    const messageArea = document.getElementById('messageDisplay');  // Get the message area element by its ID
    
    // Add click event listener to the button
    button.addEventListener('click', function() {              // Listen for clicks on the button
        console.log('Button was clicked!');                    // Print message to console when button is clicked
        
        // Create a message with current time
        const currentTime = new Date().toLocaleTimeString();   // Get current time as a readable string
        const message = 'Hello! You clicked the button at ' + currentTime;  // Create message combining text and time
        
        // Display the message in our HTML
        messageArea.textContent = message;                     // Put the message text into the HTML element
        
        // Change button text temporarily
        button.textContent = 'Thanks for clicking!';           // Change what the button displays
        
        // Reset button text after 2 seconds
        setTimeout(function() {                                // Run a function after a delay
            button.textContent = 'Click Me!';                  // Change button text back to original
        }, 2000);                                              // Wait 2000 milliseconds (2 seconds)
    });
});
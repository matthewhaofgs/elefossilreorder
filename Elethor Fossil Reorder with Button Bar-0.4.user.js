// ==UserScript==
// @name         Elethor Fossil Reorder with Button Bar
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Adds a button in a bar at the top of the page to reorder fossils by preservation stat in Elethor game, shifting the page content down, and removes the bar when not on the fossils page.
// @author       You
// @match        https://elethor.com/*
// @grant        GM_xmlhttpRequest
// @connect      elethor.com
// ==/UserScript==

(function() {
    'use strict';

    // Function to create and insert the button bar
    function addButtonBar() {
        if (document.querySelector('#fossil-reorder-bar')) return;

        // Create a bar to contain the button
        const bar = document.createElement('div');
        bar.id = 'fossil-reorder-bar';
        bar.style.width = '100%';
        bar.style.backgroundColor = '#f1f1f1';
        bar.style.padding = '10px';
        bar.style.boxShadow = '0px 4px 2px -2px gray';
        bar.style.position = 'relative';
        bar.style.zIndex = 1000;

        // Create the button
        const button = document.createElement('button');
        button.textContent = 'Reorder Fossils by Preservation';
        button.style.padding = '10px 20px';
        button.style.fontSize = '16px';

        // Add the button to the bar
        bar.appendChild(button);

        // Insert the bar at the top of the body
        document.body.insertBefore(bar, document.body.firstChild);

        // Button click event handler
        button.addEventListener('click', function() {
            // Fetch the fossil data from the API
            fetch('/game/fossils', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                // Extract fossils array from the data
                let fossils = data.fossils;

                // Reorder fossils by preservation stat
                fossils.sort((a, b) => {
                    let preservationA = getModifierValue(a, 'preservation');
                    let preservationB = getModifierValue(b, 'preservation');
                    return preservationB - preservationA; // Descending order
                });

                // Update the 'order' parameter for each fossil based on sorted position
                fossils.forEach((fossil, index) => {
                    fossil.order = index + 1; // Set order based on the new sorted index
                });

                // Prepare the reordered fossils data for POST
                let postData = JSON.stringify({ fossils: fossils });

                // Send the POST request to reorder fossils
                fetch('/game/fossils/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getCookieValue('XSRF-TOKEN')
                    },
                    credentials: 'same-origin',
                    body: postData
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Fossils reordered successfully.');
                    location.reload();  // Reload the page to reflect the changes
                })
                .catch(error => {
                    console.error('Error in POST request:', error);
                });
            })
            .catch(error => {
                console.error('Error fetching fossils data:', error);
            });
        });
    }

    // Function to remove the button bar
    function removeButtonBar() {
        const bar = document.querySelector('#fossil-reorder-bar');
        if (bar) {
            bar.remove();
        }
    }

    // Helper function to get the value of the preservation modifier
    function getModifierValue(fossil, modifierName) {
        let modifier = fossil.modifiers.find(m => m.name === modifierName);
        return modifier ? modifier.boost : 0;
    }

    // Helper function to get a cookie value by name
    function getCookieValue(name) {
        let matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    // Function to observe page changes and manage the button bar
    function observePageChanges() {
        const observer = new MutationObserver(() => {
            if (window.location.pathname === '/mine/fossils') {
                addButtonBar();
            } else {
                removeButtonBar();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Start observing page changes
    observePageChanges();
})();

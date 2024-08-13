// ==UserScript==
// @name         Elethor Fossil Reorder with Button
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Adds a button under the "MY FOSSILS" heading to reorder fossils by preservation stat in Elethor game, and removes it when not on the fossils page.
// @author       You
// @match        https://elethor.com/*
// @grant        GM_xmlhttpRequest
// @connect      elethor.com
// ==/UserScript==

(function() {
    'use strict';

    // Function to create and insert the button
    function addButton() {
        if (document.querySelector('#fossil-reorder-button')) return;

        // Find the "MY FOSSILS" heading
        const heading = Array.from(document.querySelectorAll('h4.title.is-4.mb-0')).find(h => h.textContent.trim() === 'MY FOSSILS');
        if (!heading) {
            console.log('Heading "MY FOSSILS" not found.');
            return;
        }

        // Create the button
        const button = document.createElement('button');
        button.textContent = 'Reorder Fossils by Preservation';
        button.id = 'fossil-reorder-button';
        button.className = 'button is-info is-small';
        button.style.marginTop = '10px';

        // Add the button after the heading
        heading.parentNode.insertBefore(button, heading.nextSibling);

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

    // Function to remove the button
    function removeButton() {
        const button = document.querySelector('#fossil-reorder-button');
        if (button) {
            button.remove();
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

    // Function to observe page changes and manage the button
    function observePageChanges() {
        const observer = new MutationObserver(() => {
            console.log('Page change detected.');
            if (window.location.pathname === '/mine/fossils') {
                addButton();
            } else {
                removeButton();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Start observing page changes
    observePageChanges();

    // Initial check to handle page load
    document.addEventListener('DOMContentLoaded', function() {
        if (window.location.pathname === '/mine/fossils') {
            addButton();
        }
    });
})();

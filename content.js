// ==UserScript==
// @name         Elethor Fossil Reorder
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Order fossils by experience, geodata and preservation.
// @author       Original- Starcore , Forked by Eugene
// @match        https://elethor.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addButton(id, text, modifierName) {
        if (document.querySelector(`#${id}`)) return;

        const heading = Array.from(document.querySelectorAll('h4.title.is-4.mb-0')).find(h => h.textContent.trim() === 'MY FOSSILS');
        if (!heading) {
            console.log('Heading "MY FOSSILS" not found.');
            return;
        }

        const button = document.createElement('button');
        button.textContent = text;
        button.id = id;
        button.className = 'button is-info is-small';
        button.style.marginTop = '10px';

        heading.parentNode.insertBefore(button, heading.nextSibling);

        const lineBreak = document.createElement('br');
        heading.parentNode.insertBefore(lineBreak, button.nextSibling);

        button.addEventListener('click', function() {
            reorderFossils(modifierName);
        });
    }

    function reorderFossils(modifierName) {
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
            let fossils = data.fossils;
            fossils.sort((a, b) => {
                let valueA = getModifierValue(a, modifierName);
                let valueB = getModifierValue(b, modifierName);
                return valueB - valueA;
            });

            fossils.forEach((fossil, index) => {
                fossil.order = index + 1;
            });

            let postData = JSON.stringify({ fossils: fossils });

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
                location.reload();
            })
            .catch(error => {
                console.error('Error in POST request:', error);
            });
        })
        .catch(error => {
            console.error('Error fetching fossils data:', error);
        });
    }

    function removeButtons() {
        const buttons = ['#fossil-reorder-button', '#geodata-reorder-button', '#xp-reorder-button'];
        buttons.forEach(buttonId => {
            const button = document.querySelector(buttonId);
            if (button) {
                button.remove();
            }
        });
    }

    function getModifierValue(fossil, modifierName) {
        let modifier = fossil.modifiers.find(m => m.name === modifierName);
        return modifier ? modifier.boost : 0;
    }

    function getCookieValue(name) {
        let matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function observePageChanges() {
        const observer = new MutationObserver(() => {
            console.log('Page change detected.');
            if (window.location.pathname === '/mine/fossils') {
                addButton('fossil-reorder-button', 'Reorder Fossils by Preservation', 'preservation');
                addButton('geodata-reorder-button', 'Reorder Fossils by Geodata', 'geodata_drop_rate');
                addButton('xp-reorder-button', 'Reorder Fossils by Experience', 'experience');
            } else {
                removeButtons();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    observePageChanges();

    document.addEventListener('DOMContentLoaded', function() {
        if (window.location.pathname === '/mine/fossils') {
            addButton('fossil-reorder-button', 'Reorder Fossils by Preservation', 'preservation');
            addButton('geodata-reorder-button', 'Reorder Fossils by Geodata', 'geodata_drop_rate');
            addButton('xp-reorder-button', 'Reorder Fossils by Experience', 'experience');
        }
    });
})();

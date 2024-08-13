(function() {
    'use strict';

    function addButton() {
        if (document.querySelector('#fossil-reorder-button')) return;

        const heading = Array.from(document.querySelectorAll('h4.title.is-4.mb-0')).find(h => h.textContent.trim() === 'MY FOSSILS');
        if (!heading) {
            console.log('Heading "MY FOSSILS" not found.');
            return;
        }

        const button = document.createElement('button');
        button.textContent = 'Reorder Fossils by Preservation';
        button.id = 'fossil-reorder-button';
        button.className = 'button is-info is-small';
        button.style.marginTop = '10px';

        heading.parentNode.insertBefore(button, heading.nextSibling);

        button.addEventListener('click', function() {
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
                    let preservationA = getModifierValue(a, 'preservation');
                    let preservationB = getModifierValue(b, 'preservation');
                    return preservationB - preservationA;
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
        });
    }

    function removeButton() {
        const button = document.querySelector('#fossil-reorder-button');
        if (button) {
            button.remove();
        }
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
                addButton();
            } else {
                removeButton();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    observePageChanges();

    document.addEventListener('DOMContentLoaded', function() {
        if (window.location.pathname === '/mine/fossils') {
            addButton();
        }
    });
})();
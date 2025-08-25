import { sleep ,callable} from '@steambrew/client';

const deletegame = callable<[{ message: string; }], boolean>('Backend.delete_game');
let lasturl="";

export default async function PluginMain() {
    try {


        while (true) {
            while (typeof (window as any).MainWindowBrowserManager === "undefined") {
                await sleep(100);
            }

            while (!MainWindowBrowserManager.m_lastLocation.pathname.startsWith("/library/app/")) {
                await sleep(100);
            }
            await sleep(20);
            if (lasturl === MainWindowBrowserManager.m_lastLocation.pathname) continue;
            lasturl = MainWindowBrowserManager.m_lastLocation.pathname
            let documentt = g_PopupManager.GetExistingPopup("SP Desktop_uid0").window.document;


            const spans = documentt.querySelectorAll('span');
            let targetSpan = null;
            spans.forEach(span => {
                if (span.textContent.trim() === 'Support') {
                    targetSpan = span;
                }
            });

            if (targetSpan) {
                console.log('Found span:', targetSpan);

                // Get the structure using parent navigation - no hardcoded classes
                const buttonElement = targetSpan.closest('[role="button"]');
                const buttonContainer = buttonElement.parentElement;
                const panel = buttonContainer.parentElement;

                // Check if Delete button already exists
                const existingDeleteButton = Array.from(panel.querySelectorAll('span')).find(span =>
                    span.textContent.trim() === 'Delete'
                );

                if (existingDeleteButton) {
                    existingDeleteButton.remove();
                    console.log('Delete button already exists, skipping creation');
                    lasturl = "";
                    continue;
                }

                // Clone the Store Page button structure
                const deleteButtonContainer = buttonContainer.cloneNode(true);

                // Update the text to "Delete"
                const deleteSpan = deleteButtonContainer.querySelector('span');
                deleteSpan.textContent = 'Delete';

                // Position it after the last button (adjust left position)
                const newLeft = (Number(targetSpan.parentElement.parentElement.parentElement.style.left.replace("px", ""))) + 120; // Adjust spacing as needed
                console.log(newLeft);
                deleteButtonContainer.style.left = newLeft + 'px';

                // Add the delete button to the panel
                panel.appendChild(deleteButtonContainer);

                // Get the clickable element (the one with role="button")
                const deleteButton = deleteButtonContainer.querySelector('[role="button"]');

                // Add the click event
                deleteButton.addEventListener('click', function() {
                    console.log('pressed');
                });

            } else {
                console.log('Span with text "Store Page" not found.');
                lasturl=""
            }

        }
    }catch{}
}

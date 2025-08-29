import { sleep, callable, showModal, ConfirmModal } from '@steambrew/client';

const deletegame = callable<[{ id: string; }], boolean>('Backend.deletelua');
const receiveFrontendMethod = callable<[{ message: string; }], boolean>('Backend.receive_frontend_message');
const restartt = callable<[], boolean>('Backend.restart');

let lasturl="";
async function waitForXPath(doc: Document, xpath: string, interval = 100) {
    while (true) {
        const result = doc.evaluate(
            xpath,
            doc,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );
        if (result.singleNodeValue) return result.singleNodeValue;
        await new Promise(r => setTimeout(r, interval));
    }
}

async function waitForSelector(doc: Document, selector: string, interval = 100) {
    while (true) {
        const el = doc.querySelector(selector);
        if (el) return el;
        await new Promise(r => setTimeout(r, interval));
    }
}

async function waitForSteamLoaded() {
    // Already loaded?
    if (document.readyState === "complete" && document.querySelector("#root")) {
        return;
    }

    // Wait for document to be "complete"
    if (document.readyState !== "complete") {
        await new Promise<void>(resolve => {
            const check = () => {
                if (document.readyState === "complete") {
                    document.removeEventListener("readystatechange", check);
                    resolve();
                }
            };
            document.addEventListener("readystatechange", check);
        });
    }

    // Now wait for React / Steam UI root to mount
    if (!document.querySelector("#root")) {
        await new Promise<void>(resolve => {
            const observer = new MutationObserver(() => {
                if (document.querySelector("#root")) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}

async function restart(){
    await receiveFrontendMethod({ message: "restart" });
    return true;
}

export default async function PluginMain() {
        while (true) {
            while (typeof (window as any).MainWindowBrowserManager === "undefined") {
                await sleep(100);
            }

            while (!MainWindowBrowserManager.m_lastLocation.pathname.startsWith("/library/app/")) {
                await sleep(100);
            }
            await sleep(20);
            if (lasturl === MainWindowBrowserManager.m_lastLocation.pathname || !MainWindowBrowserManager.m_lastLocation.pathname.startsWith("/library/app/")) {
                var docc = g_PopupManager.GetExistingPopup("SP Desktop_uid0").window.document
                const deletee = docc.evaluate(
                    "//span[normalize-space(text())='Delete']",
                    docc,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );
                if (deletee.singleNodeValue!=null){
                    const support = docc.evaluate(
                        "//span[normalize-space(text())='Support']",
                        docc,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    );
                    if (support.singleNodeValue!=null){
                        const numberr = (Number(support.singleNodeValue.parentElement.parentElement.parentElement.style.left.replace("px", ""))) + 120; // Adjust spacing as needed
                        deletee.singleNodeValue.parentElement.parentElement.parentElement.style.left = `${numberr}px`;
                    }
                }
                continue;
            }
            lasturl = MainWindowBrowserManager.m_lastLocation.pathname
            let documentt = g_PopupManager.GetExistingPopup("SP Desktop_uid0").window.document;

            await waitForSteamLoaded();
            let rightmostSpan: HTMLElement | null = null;
            //await sleep(550);

            const buttonContainer = await waitForSelector(documentt, "div[class*='Panel'][style*='height: 33px']");
            if (buttonContainer) {
                // 2. Get all spans inside
                const divs = Array.from(buttonContainer.querySelectorAll("div[style*='left']"));

                let minLeft = Infinity;

                divs.forEach(div => {
                    // Must contain a span (nested anywhere inside)
                    if (div.querySelector("span")) {
                        const leftValue = parseFloat(div.style.left.replace("px", ""));
                        if (!isNaN(leftValue) && leftValue < minLeft) {
                            minLeft = leftValue;
                            rightmostSpan = div;
                        }
                    }
                });

            }
            const existingDeleteButton = Array.from(buttonContainer.querySelectorAll('span')).find(span => span.textContent.trim() === 'Delete'
            );
            if (existingDeleteButton) {
                existingDeleteButton.remove();
                console.log('Delete button already exists, skipping creation');
                lasturl = "";
                continue;
            }
            // Clone the Store Page button structure
            const deleteButtonContainer = rightmostSpan.cloneNode(true);
            // Update the text to "Delete"
            const deleteSpan = deleteButtonContainer.querySelector('span');
            if (deleteSpan === null){
                lasturl = "";
                continue;
            }

            deleteSpan.textContent = 'Delete';
            // Position it after the last button (adjust left position)
            const newLeft = (Number(rightmostSpan.style.left.replace("px", ""))) + 120; // Adjust spacing as needed
            console.log(newLeft);
            deleteButtonContainer.style.left = newLeft + 'px';
            // Add the delete button to the panel
            buttonContainer.appendChild(deleteButtonContainer);
            // Get the clickable element (the one with role="button")
            const deleteButton = deleteButtonContainer.querySelector('[role="button"]');
            // Add the click event
            deleteButton.addEventListener('click', function() {
                console.log('pressed');
                const path = MainWindowBrowserManager.m_lastLocation.pathname;
                const appId = path.split("/library/app/")[1];
                deletegame({id:appId}).then((r) => {if (r){
                    const onOK = () => {
                        restartt()
                    }
                    MILLENNIUM_API.showModal(
                        SP_REACT.createElement(MILLENNIUM_API.ConfirmModal, { strTitle: 'Succesfully removed game', strDescription: 'You need to restart for it to take effect, do you want to do it now?',onOK:onOK),
                        g_PopupManager.GetExistingPopup('SP Desktop_uid0').window
                    )
                }
                });
            });
        }
}

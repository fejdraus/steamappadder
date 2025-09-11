import { sleep, callable, showModal, ConfirmModal } from '@steambrew/client';

const deletegame = callable<[{ id: string; }], boolean>('Backend.deletelua');
const restartt = callable<[], boolean>('Backend.restart');



async function waitForSelector(doc: Document, selector: string, interval = 100) {
    while (true) {
        const el = doc.querySelector(selector);
        if (el) return el;
        await new Promise(r => setTimeout(r, interval));
    }
}

function rightdiv(panel){
    const divs = Array.from(panel.querySelectorAll("div[style*='left']"));

    let maxLeft = -Infinity;
    let rightmostDiv: HTMLElement | null = null;

    divs.forEach(div => {
        // Must contain a span (nested anywhere inside)
        const spanInside = div.querySelector("span");
        if (!spanInside) return;

        // Exclude if this div already has a "Delete" button
        const hasDelete = div.querySelector("span")?.textContent?.trim() === "Delete";
        if (hasDelete) return;

        const left = parseFloat(div.style.left.replace("px", ""));
        if (!isNaN(left) && left > maxLeft) {
            maxLeft = left;
            rightmostDiv = div;
        }
    });
    return rightmostDiv;
}

export default async function PluginMain() {
        while (true) {
            try {
                await sleep(10);
                if (g_PopupManager.GetExistingPopup("SP Desktop_uid0") == null) continue
                let documentt = g_PopupManager.GetExistingPopup("SP Desktop_uid0").window.document;
                const buttonContainer = await waitForSelector(documentt, "div[class*='Panel'][style*='height: 33px']");
                let rightmostSpan: HTMLElement | null = null;

                if (buttonContainer) {
                    rightmostSpan=rightdiv(buttonContainer);
                }
                const existingDeleteButton = Array.from(buttonContainer.querySelectorAll('span')).find(span => span.textContent.trim() === 'Delete');
                if (existingDeleteButton) {
                    let rightnum=(Number(rightmostSpan.style.left.replace("px", ""))) + 120;
                    existingDeleteButton.parentElement.parentElement.parentElement.style.left=rightnum+"px";
                    continue;
                }


                const deleteButtonContainer = rightmostSpan.cloneNode(true);
                const deleteSpan = deleteButtonContainer.querySelector('span');

                deleteSpan.textContent = 'Delete';
                const newLeft = (Number(rightmostSpan.style.left.replace("px", ""))) + 120; // Adjust spacing as needed
                console.log(newLeft);
                deleteButtonContainer.style.left = newLeft + 'px';
                buttonContainer.appendChild(deleteButtonContainer);
                //const deleteButton = sdeleteButtonContainer.querySelector('[role="button"]');
                deleteButtonContainer.addEventListener('click', function() {
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
            } catch (e){console.error("An error occurred:", e.message); //ignore}
        }

}

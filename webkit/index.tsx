// @ts-ignore
import {ShowMessageBox , callable } from '@steambrew/webkit';

const receiveFrontendMethod = callable<[{ message: string; }], boolean>('Backend.receive_frontend_message');
const deletegame = callable<[{ id: string; }], boolean>('Backend.deletelua');
const checkPirated = callable<[{ id: string; }], boolean>('Backend.checkpirated');
const restartt = callable<[], boolean>('Backend.restart');


export default function WebkitMain() {
  if (!/^https:\/\/store\.steampowered\.com\/app\//.test(location.href)) return;

  const ADD_BTN_ID = "add-app-to-library-btn";
  const REMOVE_BTN_ID = "remove-app-from-library-btn";

  const waitForEl = (selector: string, timeout = 20000) => new Promise((resolve, reject) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error("timeout")); }, timeout);
  });

  const getAppId = (): string | null => {
    const match = location.href.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  };

  const insertButtons = async () => {
    try {
      const container = await waitForEl(".apphub_OtherSiteInfo") as HTMLElement;
      const appId = getAppId();
      if (!appId) return;

      // Check if game is already added
      const isPirated = await checkPirated({ id: appId });

      // Remove existing buttons to avoid duplicates
      document.getElementById(ADD_BTN_ID)?.remove();
      document.getElementById(REMOVE_BTN_ID)?.remove();

      if (isPirated) {
        // Show REMOVE button
        const removeBtn = document.createElement("button");
        removeBtn.id = REMOVE_BTN_ID;
        removeBtn.type = "button";
        removeBtn.style.marginRight = "3px";
        removeBtn.className = "btnv6_red_hoverfade btn_medium";
        removeBtn.innerHTML = `<span>Remove from library</span>`;

        removeBtn.addEventListener("click", async (e) => {
          e.preventDefault();

          if (!confirm("Are you sure you want to remove this game from your library?")) {
            return;
          }

          removeBtn.disabled = true;
          removeBtn.innerHTML = `<span>Removing...</span>`;

          try {
            const success = await deletegame({ id: appId });
            if (success) {
              const restart = confirm("Game removed successfully! Steam needs to restart. Restart now?");
              if (restart) {
                await restartt();
              } else {
                // Refresh buttons
                await insertButtons();
              }
            } else {
              alert("Failed to remove the game!");
              removeBtn.disabled = false;
              removeBtn.innerHTML = `<span>Remove from library</span>`;
            }
          } catch (err) {
            alert("Error: " + (err?.message ?? err));
            removeBtn.disabled = false;
            removeBtn.innerHTML = `<span>Remove from library</span>`;
          }
        });

        const last = container.lastElementChild;
        if (last) {
          container.insertBefore(removeBtn, last);
        } else {
          container.appendChild(removeBtn);
        }

      } else {
        // Show ADD button
        const addBtn = document.createElement("button");
        addBtn.id = ADD_BTN_ID;
        addBtn.type = "button";
        addBtn.style.marginRight = "3px";
        addBtn.className = "btnv6_blue_hoverfade btn_medium";
        addBtn.innerHTML = `<span>Add to library</span>`;

        addBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          addBtn.disabled = true;
          addBtn.innerHTML = `<span>Adding...</span>`;

          try {
            const success = await receiveFrontendMethod({ message: window.location.href });
            if (success) {
              const restart = confirm("The app was successfully added! Do you want to restart now?");
              if (restart) {
                await restartt();
              } else {
                // Refresh buttons
                await insertButtons();
              }
            } else {
              alert("The app was not added!");
              addBtn.disabled = false;
              addBtn.innerHTML = `<span>Add to library</span>`;
            }
          } catch (err) {
            alert("Error: " + (err?.message ?? err));
            addBtn.disabled = false;
            addBtn.innerHTML = `<span>Add to library</span>`;
          }
        });

        const last = container.lastElementChild;
        if (last) {
          container.insertBefore(addBtn, last);
        } else {
          container.appendChild(addBtn);
        }
      }

    } catch {
      setTimeout(insertButtons, 1000);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertButtons, { once: true });
  } else {
    insertButtons();
  }

  const keepAlive = new MutationObserver(() => {
    const appId = getAppId();
    if (appId && !document.getElementById(ADD_BTN_ID) && !document.getElementById(REMOVE_BTN_ID)) {
      insertButtons();
    }
  });

  keepAlive.observe(document.body, { childList: true, subtree: true });
}
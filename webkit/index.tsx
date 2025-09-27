// @ts-ignore
import {ShowMessageBox , callable } from '@steambrew/webkit';

const receiveFrontendMethod = callable<[{ message: string; }], boolean>('Backend.receive_frontend_message');
const restartt = callable<[], boolean>('Backend.restart');


export default function WebkitMain() {
  if (!/^https:\/\/store\.steampowered\.com\/app\//.test(location.href)) return;

  const BTN_ID = "add-app-to-library-btn";
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

  const insertBtn = async () => {
    try {
      const container = await waitForEl(".apphub_OtherSiteInfo") as HTMLElement;
      if (document.getElementById(BTN_ID)) return;

      const btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.type = "button";
      btn.style.marginRight = "3px";

      btn.className = "btnv6_blue_hoverfade btn_medium";
      btn.innerHTML = `<span>Add to library</span>`;

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        btn.remove();
        try {
          const success = await receiveFrontendMethod({ message: window.location.href });
          if (success) {
            const restart=window.confirm("The app was successfully added! Do you want to restart now?");
            if (restart){
              await restartt();
            }
          } else {
            alert("The app was not added!");
          }
        } catch (err) {
          alert(err?.response ?? err);
        }
      });

      const last = container.lastElementChild;
      if (last) {
        container.insertBefore(btn, last);
      } else {
        container.appendChild(btn);
      }
    } catch {
      setTimeout(insertBtn, 1000);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertBtn, { once: true });
  } else {
    insertBtn();
  }

  const keepAlive = new MutationObserver(() => {
    if (!document.getElementById(BTN_ID)) insertBtn();
  });

  keepAlive.observe(document.body, { childList: true, subtree: true });
}
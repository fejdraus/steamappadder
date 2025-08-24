import { Millennium, callable } from '@steambrew/webkit';

const receiveFrontendMethod = callable<[{ message: string; }], boolean>('Backend.receive_frontend_message');
export default async function WebkitMain() {
  if (!/^https:\/\/store\.steampowered\.com\/app\//.test(location.href)) return;

  const BTN_ID = "add-to-library-btn";
  const container = (await Millennium.findElement(document, ".apphub_OtherSiteInfo"))[0];
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
	btn.style.marginRight = "3px";
  btn.className = "btnv6_blue_hoverfade btn_medium";
  btn.innerHTML = `<span>Add to Library</span>`;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const success = await receiveFrontendMethod({ message: window.location.href });
      alert(success ? "Successfully added to the library!" : "Failed to add app.");
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
}
const MILLENNIUM_IS_CLIENT_MODULE = false;
const pluginName = "steam-app-adder";
function InitializePlugins() {
    var _a, _b;
    /**
     * This function is called n times depending on n plugin count,
     * Create the plugin list if it wasn't already created
     */
    (_a = (window.PLUGIN_LIST || (window.PLUGIN_LIST = {})))[pluginName] || (_a[pluginName] = {});
    (_b = (window.MILLENNIUM_PLUGIN_SETTINGS_STORE || (window.MILLENNIUM_PLUGIN_SETTINGS_STORE = {})))[pluginName] || (_b[pluginName] = {});
    window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS || (window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS = {});
    /**
     * Accepted IPC message types from Millennium backend.
     */
    let IPCType;
    (function (IPCType) {
        IPCType[IPCType["CallServerMethod"] = 0] = "CallServerMethod";
    })(IPCType || (IPCType = {}));
    let MillenniumStore = window.MILLENNIUM_PLUGIN_SETTINGS_STORE[pluginName];
    let IPCMessageId = `Millennium.Internal.IPC.[${pluginName}]`;
    let isClientModule = MILLENNIUM_IS_CLIENT_MODULE;
    const ComponentTypeMap = {
        DropDown: ['string', 'number', 'boolean'],
        NumberTextInput: ['number'],
        StringTextInput: ['string'],
        FloatTextInput: ['number'],
        CheckBox: ['boolean'],
        NumberSlider: ['number'],
        FloatSlider: ['number'],
    };
    MillenniumStore.ignoreProxyFlag = false;
    function DelegateToBackend(pluginName, name, value) {
        return MILLENNIUM_BACKEND_IPC.postMessage(IPCType.CallServerMethod, {
            pluginName,
            methodName: '__builtins__.__update_settings_value__',
            argumentList: { name, value },
        });
    }
    async function ClientInitializeIPC() {
        /** Wait for the MainWindowBrowser to not be undefined */
        while (typeof MainWindowBrowserManager === 'undefined') {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        MainWindowBrowserManager?.m_browser?.on('message', (messageId, data) => {
            if (messageId !== IPCMessageId) {
                return;
            }
            const { name, value } = JSON.parse(data);
            MillenniumStore.ignoreProxyFlag = true;
            MillenniumStore.settingsStore[name] = value;
            DelegateToBackend(pluginName, name, value);
            MillenniumStore.ignoreProxyFlag = false;
        });
    }
    async function WebkitInitializeIPC() {
        let intervalId = null;
        const maxWaitTime = 10000; // 10 seconds
        intervalId = setInterval(() => {
            if (typeof SteamClient === 'undefined') {
                return;
            }
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            SteamClient.BrowserView?.RegisterForMessageFromParent((messageId, data) => {
                if (messageId !== IPCMessageId) {
                    return;
                }
                const payload = JSON.parse(data);
                MillenniumStore.ignoreProxyFlag = true;
                MillenniumStore.settingsStore[payload.name] = payload.value;
                MillenniumStore.ignoreProxyFlag = false;
            });
        }, 100);
        setTimeout(() => {
            if (intervalId) {
                clearInterval(intervalId);
                console.warn('%c Millennium %c Failed to find SteamClient after 10000ms', 'background:rgb(37, 105, 184); color: white;', 'background: transparent;');
            }
        }, maxWaitTime);
    }
    isClientModule ? ClientInitializeIPC() : WebkitInitializeIPC();
    const StartSettingPropagation = (name, value) => {
        if (MillenniumStore.ignoreProxyFlag) {
            return;
        }
        if (isClientModule) {
            DelegateToBackend(pluginName, name, value);
            /** If the browser doesn't exist yet, no use sending anything to it. */
            if (typeof MainWindowBrowserManager !== 'undefined') {
                MainWindowBrowserManager?.m_browser?.PostMessage(IPCMessageId, JSON.stringify({ name, value }));
            }
        }
        else {
            /** Send the message to the SharedJSContext */
            SteamClient.BrowserView.PostMessageToParent(IPCMessageId, JSON.stringify({ name, value }));
        }
    };
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    const DefinePluginSetting = (obj) => {
        return new Proxy(obj, {
            set(target, property, value) {
                if (!(property in target)) {
                    throw new TypeError(`Property ${String(property)} does not exist on plugin settings`);
                }
                const settingType = ComponentTypeMap[target[property].type];
                const range = target[property]?.range;
                /** Clamp the value between the given range */
                if (settingType.includes('number') && typeof value === 'number') {
                    if (range) {
                        value = clamp(value, range[0], range[1]);
                    }
                    value || (value = 0); // Fallback to 0 if the value is undefined or null
                }
                /** Check if the value is of the proper type */
                if (!settingType.includes(typeof value)) {
                    throw new TypeError(`Expected ${settingType.join(' or ')}, got ${typeof value}`);
                }
                target[property].value = value;
                StartSettingPropagation(String(property), value);
                return true;
            },
            get(target, property) {
                if (property === '__raw_get_internals__') {
                    return target;
                }
                if (property in target) {
                    return target[property].value;
                }
                return undefined;
            },
        });
    };
    MillenniumStore.DefinePluginSetting = DefinePluginSetting;
    MillenniumStore.settingsStore = DefinePluginSetting({});
}
InitializePlugins()
const __call_server_method__ = (methodName, kwargs) => Millennium.callServerMethod(pluginName, methodName, kwargs)
const __wrapped_callable__ = (route) => MILLENNIUM_API.callable(__call_server_method__, route)
let PluginEntryPointMain = function() { var millennium_main = (function (exports, webkit) {
    'use strict';

    // @ts-ignore
    const receiveFrontendMethod = __wrapped_callable__('Backend.receive_frontend_message');
    const restartt = __wrapped_callable__('Backend.restart');
    function WebkitMain() {
        if (!/^https:\/\/store\.steampowered\.com\/app\//.test(location.href))
            return;
        const BTN_ID = "add-app-to-library-btn";
        const waitForEl = (selector, timeout = 20000) => new Promise((resolve, reject) => {
            const found = document.querySelector(selector);
            if (found)
                return resolve(found);
            const obs = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => { obs.disconnect(); reject(new Error("timeout")); }, timeout);
        });
        const insertBtn = async () => {
            try {
                const container = await waitForEl(".apphub_OtherSiteInfo");
                if (document.getElementById(BTN_ID))
                    return;
                const btn = document.createElement("button");
                btn.id = BTN_ID;
                btn.type = "button";
                btn.style.marginRight = "3px";
                btn.className = "btnv6_blue_hoverfade btn_medium";
                btn.innerHTML = `<span>Add to library</span>`;
                btn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    btn.style.display = "none";
                    try {
                        const success = await receiveFrontendMethod({ message: window.location.href });
                        if (success) {
                            const restart = window.confirm("The app was successfully added! Do you want to restart now?");
                            if (restart) {
                                await restartt();
                            }
                        }
                        else {
                            alert("The app was not added!");
                        }
                    }
                    catch (err) {
                        alert(err?.response ?? err);
                    }
                });
                const last = container.lastElementChild;
                if (last) {
                    container.insertBefore(btn, last);
                }
                else {
                    container.appendChild(btn);
                }
            }
            catch {
                setTimeout(insertBtn, 1000);
            }
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", insertBtn, { once: true });
        }
        else {
            insertBtn();
        }
        const keepAlive = new MutationObserver(() => {
            if (!document.getElementById(BTN_ID))
                insertBtn();
        });
        keepAlive.observe(document.body, { childList: true, subtree: true });
    }

    exports.default = WebkitMain;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, window.MILLENNIUM_API);
 return millennium_main; };
function ExecutePluginModule() {
    let MillenniumStore = window.MILLENNIUM_PLUGIN_SETTINGS_STORE[pluginName];
    function OnPluginConfigChange(key, __, value) {
        if (key in MillenniumStore.settingsStore) {
            MillenniumStore.ignoreProxyFlag = true;
            MillenniumStore.settingsStore[key] = value;
            MillenniumStore.ignoreProxyFlag = false;
        }
    }
    /** Expose the OnPluginConfigChange so it can be called externally */
    MillenniumStore.OnPluginConfigChange = OnPluginConfigChange;
    MILLENNIUM_BACKEND_IPC.postMessage(0, { pluginName: pluginName, methodName: '__builtins__.__millennium_plugin_settings_parser__' }).then(async (response) => {
        /**
         * __millennium_plugin_settings_parser__ will return false if the plugin has no settings.
         * If the plugin has settings, it will return a base64 encoded string.
         * The string is then decoded and parsed into an object.
         */
        if (typeof response.returnValue === 'string') {
            MillenniumStore.ignoreProxyFlag = true;
            /** Initialize the settings store from the settings returned from the backend. */
            MillenniumStore.settingsStore = MillenniumStore.DefinePluginSetting(Object.fromEntries(JSON.parse(atob(response.returnValue)).map((item) => [item.functionName, item])));
            MillenniumStore.ignoreProxyFlag = false;
        }
        /** @ts-ignore: call the plugin main after the settings have been parsed. This prevent plugin settings from being undefined at top level. */
        let PluginModule = PluginEntryPointMain();
        /** Assign the plugin on plugin list. */
        Object.assign(window.PLUGIN_LIST[pluginName], {
            ...PluginModule,
            __millennium_internal_plugin_name_do_not_use_or_change__: pluginName,
        });
        /** Run the rolled up plugins default exported function */
        let pluginProps = await PluginModule.default();
        function isValidSidebarNavComponent(obj) {
            return obj && obj.title !== undefined && obj.icon !== undefined && obj.content !== undefined;
        }
        if (pluginProps && isValidSidebarNavComponent(pluginProps)) {
            window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS[pluginName] = pluginProps;
        }
        else {
            console.warn(`Plugin ${pluginName} does not contain proper SidebarNavigation props and therefor can't be mounted by Millennium. Please ensure it has a title, icon, and content.`);
            return;
        }
        /** If the current module is a client module, post message id=1 which calls the front_end_loaded method on the backend. */
        if (MILLENNIUM_IS_CLIENT_MODULE) {
            MILLENNIUM_BACKEND_IPC.postMessage(1, { pluginName: pluginName });
        }
    });
}
ExecutePluginModule()
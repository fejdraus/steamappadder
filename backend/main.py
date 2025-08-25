import Millennium, PluginUtils
import requests
import winreg
import re, os, shutil, zipfile
import subprocess
logger = PluginUtils.Logger()
class Backend:

    @staticmethod
    def print(message:str):
        logger.log(message)
        return True

    @staticmethod
    def checkpirated(id:str):
        steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
        stplugin = os.path.join(steampath, "config\\stplug-in")
        lua = os.path.join(stplugin, id+".lua")
        return os.path.exists(lua)

    @staticmethod
    def deletelua(id:str):
        steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
        stplugin = os.path.join(steampath, "config\\stplug-in")
        lua = os.path.join(stplugin, id+".lua")
        if os.path.exists(lua):
            os.remove(lua)

    @staticmethod 
    def receive_frontend_message(message: str):
        if message== "restart":
            steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
            cmd = f'taskkill /f /im steam.exe && start "" "{steampath}\\steam.exe"'
            DETACHED_PROCESS   = 0x00000008
            CREATE_NO_WINDOW   = 0x08000000
            flags = DETACHED_PROCESS | CREATE_NO_WINDOW

            subprocess.Popen(cmd, shell=True, creationflags=flags)
            return True
        logger.log(f"received: {message}")
        try:
            try:
                steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
                logger.log(steampath)
            except FileNotFoundError:
                logger.log("SteamPath not found")
                return False
            m = re.search(r"store\.steampowered\.com/app/(\d+)/", message)
            if not m:
                return False
            app_id = m.group(1)
            logger.log(f"app_id: {app_id}")
            disk = (str(os.environ["SYSTEMDRIVE"]))
            tmp = rf"{disk}\temp\steam_mods"
            os.makedirs(tmp, exist_ok=True)
            zip_url = f"https://raw.githubusercontent.com/sushi-dev55/sushitools-games-repo/refs/heads/main/{app_id}.zip"
            zip_path = os.path.join(tmp, f"{app_id}.zip")
            logger.log(f"1")
            if requests.head(zip_url).status_code != 200:
                logger.log(f"Game not found")
                return False
            with requests.get(zip_url, stream=True) as r, open(zip_path, "wb") as f:
                shutil.copyfileobj(r.raw, f)
            logger.log(f"2")
            try:
                with zipfile.ZipFile(zip_path) as z:
                    z.extractall(tmp)
                for root, _, files in os.walk(tmp):
                    for file in files:
                        if file.endswith(".lua"):
                            shutil.move(os.path.join(root, file),
                                        os.path.join(rf"{steampath}\config\stplug-in", file))
            except Exception as e:
                logger.log(f"Exception: {e}")
            shutil.rmtree(tmp, ignore_errors=True)
            return True
        except Exception as e:
            logger.log(e)
        return False


class Plugin:
    def _front_end_loaded(self):
        logger.log("Frontend loaded!")

    def _load(self):
        logger.log("Backend loaded")
        logger.log(f"Plugin base dir: {PLUGIN_BASE_DIR}")
        Millennium.ready()

    def _unload(self):
        logger.log("unloading")
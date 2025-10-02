import Millennium, PluginUtils
import requests
import winreg
import re, os, shutil, zipfile
import subprocess
from io import BytesIO
logger = PluginUtils.Logger()

def getSteamPath() -> str:
    return Millennium.steam_path()
    #Need to check if that first one really returns the correct path
    #(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])

def download_and_extract(url, lua_folder, manifest_folder) -> bool:
    try:
        disk = (str(os.environ["SYSTEMDRIVE"]))
        temp_folder = rf"{disk}\temp\steam_mods"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/138.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9"
        }

        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()  # error if download failed
        with zipfile.ZipFile(BytesIO(response.content)) as z:
            z.extractall(temp_folder)
        for root, _, files in os.walk(temp_folder):
            for file in files:
                src_path = os.path.join(root, file)

                if file.endswith(".lua"):
                    dest_path = os.path.join(lua_folder, file)
                elif "manifest" in file.lower():
                    dest_path = os.path.join(manifest_folder, file)
                else:
                    continue
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                shutil.move(src_path, dest_path)
        shutil.rmtree(temp_folder)
        return True
    except Exception as e:
        logger.log(e)
        return False


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
        logger.log(id)
        steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
        stplugin = os.path.join(steampath, "config\\stplug-in")
        lua = os.path.join(stplugin, id+".lua")
        if os.path.exists(lua):
            os.remove(lua)
            return True
        return False

    @staticmethod
    def restart():
        steampath=(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])
        cmd = f'taskkill /f /im steam.exe && start "" "{steampath}\\steam.exe"'
        DETACHED_PROCESS   = 0x00000008
        CREATE_NO_WINDOW   = 0x08000000
        flags = DETACHED_PROCESS | CREATE_NO_WINDOW
        subprocess.Popen(cmd, shell=True, creationflags=flags)
        return True

    @staticmethod 
    def receive_frontend_message(message: str):
        logger.log(f"received: {message}")
        m = re.search(r"store\.steampowered\.com/app/(\d+)/", message)
        if not m:
            return False
        luas=os.path.join(getSteamPath(),"config","stplug-in")
        manifests = os.path.join(getSteamPath(), "config","manifests")
        url = str(f"https://mellyiscoolaf.pythonanywhere.com/{int(m.group(1))}")
        logger.log(url)
        return download_and_extract(url,luas,manifests)
    




class Plugin:
    def _front_end_loaded(self):
        logger.log("Frontend loaded!")

    def _load(self):
        logger.log("Backend loaded")
        logger.log(f"Plugin base dir: {PLUGIN_BASE_DIR}")
        Millennium.ready()

    def _unload(self):

        logger.log("unloading")

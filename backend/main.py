import Millennium, PluginUtils
import requests
import winreg
import re, os, shutil, zipfile
import subprocess
from io import BytesIO
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
        return checker(int(m.group(1)),luas,manifests)




def checker(app_id:int,luas,manifests) -> bool:
    if requests.get(f"https://mellyiscoolaf.pythonanywhere.com/{app_id}").status_code==200:
        logger.log(f"downloading {app_id} from https://mellyiscoolaf.pythonanywhere.com/{app_id}")
        return mellyRyuu(app_id,luas,manifests)
    if requests.get(f"https://raw.githubusercontent.com/sushi-dev55/sushitools-games-repo/refs/heads/main/{app_id}.zip")==200:
        logger.log(f"downloading {app_id} from https://raw.githubusercontent.com/sushi-dev55/sushitools-games-repo/refs/heads/main/{app_id}.zip")
        return sushi(app_id,luas,manifests)
    if requests.get(f"https://cdn.jsdmirror.cn/gh/SteamAutoCracks/ManifestHub@{app_id}/{app_id}.lua")==200:
        logger.log(f"downloading {app_id} from https://cdn.jsdmirror.cn/gh/SteamAutoCracks/ManifestHub@{app_id}/{app_id}.lua")
        return china(app_id,luas)
    return False

def getSteamPath() -> str:
    return Millennium.steam_path()
    #Need to check if that first one really returns the correct path
    #(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam"), "SteamPath")[0])

def download_and_extract(url, lua_folder, manifest_folder):
    try:
        disk = (str(os.environ["SYSTEMDRIVE"]))
        temp_folder = rf"{disk}\temp\steam_mods"
        response = requests.get(url, stream=True)
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


def mellyRyuu(app_id:int,luas,manifests) -> bool:
    return download_and_extract(f"https://mellyiscoolaf.pythonanywhere.com/{app_id}", luas, manifests)

def china (app_id:int,luas) -> bool:
    url = f"https://cdn.jsdmirror.cn/gh/SteamAutoCracks/ManifestHub@{app_id}/{app_id}.lua"
    logger.log(url)
    r = requests.get(url)
    if r.status_code == 200:
        pathf = os.path.join(luas,f"{app_id}.lua")
        with open(pathf, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                return True
    return False


def sushi(app_id:int,luas,manifests) -> bool:
    return download_and_extract(f"https://raw.githubusercontent.com/sushi-dev55/sushitools-games-repo/refs/heads/main/{app_id}.zip", luas, manifests)
class Plugin:
    def _front_end_loaded(self):
        logger.log("Frontend loaded!")

    def _load(self):
        logger.log("Backend loaded")
        logger.log(f"Plugin base dir: {PLUGIN_BASE_DIR}")
        Millennium.ready()

    def _unload(self):
        logger.log("unloading")
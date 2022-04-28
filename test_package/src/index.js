import { initializeBabylonApp } from "app_package";

let assetsHostUrl;
if (DEV_BUILD) {
    assetsHostUrl = "";
} else {
    assetsHostUrl = "";
}
initializeBabylonApp({ assetsHostUrl: assetsHostUrl });

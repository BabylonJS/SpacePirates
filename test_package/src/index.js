import { initializeBabylonApp } from "app_package";
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://use.typekit.net/njr1oia.css";
document.head.appendChild(link);

let assetsHostUrl;
if (DEV_BUILD) {
    assetsHostUrl = "";
} else {
    assetsHostUrl = "";
}
initializeBabylonApp({ assetsHostUrl: assetsHostUrl });


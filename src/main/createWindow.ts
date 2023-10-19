import { BrowserWindow, app, dialog } from "electron";
import windowStateKeeper from "electron-window-state";
import path from "path";
import { configureNativeTheme } from "./setup/theme";
import { configureIPCs } from "./setup/configureIPCs";
import configureRedirect from "./setup/configureRedirect";
import onDevTools from "./setup/onDevTools";
import onReadyToShow from "./setup/onReadyToShow";
import onClose from "./setup/onClose";
import Window from "./managers/Window";
import { configureUSB } from "./setup/configureUSB";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const createWindow = () => {
  // Create the browser window.
  console.log("BEFORE windowos state keeper");
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 900,
  });
  console.log("BEFORE windowos new browser window");
  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 650,
    minHeight: 570,
    resizable: true,
    icon: path.join("../renderer/static", "/logo.png"),
    show: false,
    backgroundColor: "#2e2c29",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  console.log("BEFORE configure ipcs");

  configureIPCs();
  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  console.log("BEFORE CREATING WINDOWWW");
  console.log(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  console.log("AFTER CREATING WINDOWWW");

  mainWindow.webContents.on("render-process-gone", (event, details) => {
    console.log("Renderer process crashed or was terminated:");
    console.log(details);

    // Show an alert dialog with the error message
    dialog.showErrorBox("Renderer Process Error", `The renderer process has  crashed or was terminated. ${details.reason}`);

    // You can take further actions as needed, such as restarting the renderer process or closing the window.
  });

  console.log("1");

  Window.getInstance(); // init Windows manager
  console.log("2");
  Window.setWindow(mainWindow);
  if (!app.isPackaged) {
    // Open the DevTools if we are in development mode
    mainWindow.webContents.openDevTools();
  }

  console.log("3");
  configureNativeTheme();
  console.log("4");
  configureRedirect();
  console.log("5");
  onReadyToShow();
  console.log("6");
  onDevTools();
  console.log("7");
  onClose();
  console.log("8");
  configureUSB();
};

export default createWindow;

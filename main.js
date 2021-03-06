const {app, BrowserWindow} = require('electron');
var initNode = require(`./src/initNode.js`);
const appPath = app.getAppPath();
//todo uncomment on release const docPath = app.getPath('documents');
const docPath = 'F:/articlesTest';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

//makes sure no scrapes are running concurrently
exports.existingScrape = false;

function createWindow() {
  //check if the needed json files exist
  let dataFolder = `${docPath}/oden`;
  initNode.checkFolderExists(dataFolder, () => {
    initNode.checkFolderExists(`${dataFolder}/articles`, () => {});
    initNode.checkFolderExists(`${dataFolder}/json`, () => {
      initNode.checkFileExists(`${dataFolder}/json/category.json`, `${appPath}/json/category.json`);
      initNode.checkFileExists(`${dataFolder}/json/directory.json`, `${appPath}/json/directory.json`);
      initNode.checkFileExists(`${dataFolder}/json/rss.json`, `${appPath}/json/rss.json`);
      //initNode.checkFileExists(`$${dataFolder}/oden/json/settings.json`, `${appPath}/json/settings.json`);
    });
  });

  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600
  });

  //win.setMenu(null); turn on for build

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //win.webContents.openDevTools(); turn off for build
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

exports.openWindow = function(name) {
  let newWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      javascript: false
    }
  });
  newWin.loadURL(`${docPath}/oden/articles/${name}/index.html`);
  //newWin.webContents.openDevTools();
};

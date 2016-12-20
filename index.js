const { BrowserWindow, app, globalShortcut, ipcMain } = require('electron')
const { readFileSync, writeFile } = require('fs')
const { join } = require('path')
const pug = require('pug')
const stylus = require('stylus')
const url = require('url')

let win

app.commandLine.appendSwitch('enable-web-bluetooth')

app.on('ready', go)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    go()
  }
})

ipcMain.on('reload', () => {
  win.reload()
})

function go () {
  compilePage(function (err) {
    if (err) console.error(err)
    createWindow()
  })
}

function createWindow () {
  win = new BrowserWindow({
    webPreferences: {
      devTools: true
    },
    width: 800,
    height: 600
  })

  win.loadURL(url.format({
    pathname: join(__dirname, 'build', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools()
    } else {
      win.webContents.openDevTools()
    }
  })

  win.webContents.on('dom-ready', function () {
    win.webContents.send('ready')
  })

  win.on('closed', () => {
    win = null
  })
}

function compilePage (cb) {
  stylus(readFileSync(join(__dirname, 'src', 'index.styl')).toString(), {
    filename: 'index.css',
    paths: [join(__dirname, 'src')]
  })
  .define('url', stylus.resolver())
  .render((err, css) => {
    let html = false
    if (err) return cb(err)
    try {
      html = pug.compileFile(join(__dirname, 'src', 'index.pug'))({
        debug: process.env.ENV === 'development', css
      })
    } catch (err) {
      return cb(err)
    }
    writeFile(
      join(__dirname, 'build', 'index.html'),
      html,
      (err) => {
        cb(err, html)
      }
    )
  })
}

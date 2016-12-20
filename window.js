const { ipcRenderer } = require('electron')
const { join } = require('path')

function init () {
  let Puck = require(join(__dirname, 'lib', 'puck'))
  let puck = new Puck()
  window.puck = puck
  console.log(window.puck)
  // let puck = new Puck()
  // // puck.connect(function () {
  // //   console.log(arguments)
  // // })
  // console.log(puck.connect)
}

ipcRenderer.on('ready', init)

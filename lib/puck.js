const _ = require('lodash')
const { EventEmitter } = require('events')

const debug = function (msg) {
  console.log(msg)
}

class Connection extends EventEmitter {
  constructor (opts) {
    super()
    this.opts = _.defaultsDeep(opts, {
      SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
      TX: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
      RX: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
      CHUNKSIZE: 16
    })
    this.isOpen = false
    this.isOpening = true
    this.txInProgress = false
    this.server
    this.tx
    this.rx
  }

  connect () {
    if (noWorkey) return noWorkey
    let _this = this
    this.txDataQueue = []
    this.isOpening = true
    this.emit('opening')
    navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'Puck.js' },
        { namePrefix: 'Espruino' },
        { services: [ this.opts.SERVICE ] }
      ],
      optionalServices: [ this.opts.SERVICE ]
    })
    .then(function (device) {
      _this.emit('device', device)
      device.addEventListener('gattserverdisconnected', function () {
        _this.emit('disconnected', 'gattserverdisconnected')
        _this.close()
      })
      return device.gatt.connect()
    })
    .then(function (server) {
      _this.emit('connected')
      _this.server = server
      return server.getPrimaryService(_this.opts.SERVICE)
    })
    .then(function (service) {
      _this.emit('service', service)
      _this.service = service
      return _this.service.getCharacteristic(_this.opts.RX)
    })
    .then(function (characteristic) {
      _this.rx = characteristic
      _this.emit('rx', _this.rx)
      _this.rx.addEventListener('characteristicvaluechanged', function (event) {
        var value = event.target.value.buffer
        _this.emit('data', ab2str(value))
      })
      return _this.rx.startNotifications()
    })
    .then(function () {
      return _this.service.getCharacteristic(_this.opts.TX)
    })
    .then(function (characteristic) {
      _this.tx = characteristic
    })
    .then(function () {
      _this.txInProgress = false
      _this.isOpen = true
      _this.isOpening = false
      _this.emit('open')
      _this.write()
    })
    .catch(function (err) {
      _this.emit('error', err)
      _this.close()
    })
    return this
  }
  close () {
    this.isOpening = false
    if (this.isOpen) {
      this.isOpen = false
      this.emit('close')
    }
    if (this.server) {
      this.server.disconnect()
      this.server = undefined
      this.tx = undefined
      this.rx = undefined
    }
  }

  write (data, cb) {
    if (data) this.txDataQueue.push({ data, cb })
    if (this.isOpen && !this.txInProgress) {
      this._writeChunk()
    }
  }

  _writeChunk () {
    let _this = this
    var chunk
    if (!this.txDataQueue.length) return
    var txItem = this.txDataQueue[0]
    if (txItem.data.length <= this.opts.CHUNKSIZE) {
      chunk = txItem.data
      txItem.data = undefined
    } else {
      chunk = txItem.data.substr(0, this.opts.CHUNKSIZE)
      txItem.data = txItem.data.substr(this.opts.CHUNKSIZE)
    }
    this.txInProgress = true
    _this.emit('tx', _this.txInProgress)
    this.tx.writeValue(str2ab(chunk)).then(function () {
      debug('Sent')
      _this.emit('write', chunk)
      if (!txItem.data) {
        _this.tx.shift()
        if (txItem.cb) {
          txItem.cb()
        }
      }
      _this.txInProgress = false
      _this.emit('tx', _this.txInProgress)
      _this._writeChunk()
    }).catch(function (err) {
      _this.emit('error', err)
      _this.txDataQueue = []
      _this.close()
    })
  }
}

// inherits(Connection, EventEmitter)

const noWorkey = checkCapabilities()

function checkCapabilities () {
  let err = null
  if (_.isUndefined(navigator)) {
    err = new Error('You have no navigator object')
    return err
  }
  if (!navigator.bluetooth) {
    err = new Error('You dont have a navigator.bluetooth object')
  }
  return err
}

function ab2str (buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

function str2ab (str) {
  var buf = new ArrayBuffer(str.length)
  var bufView = new Uint8Array(buf)
  let strLen = str.length
  for (let i = 0; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

module.exports = Connection

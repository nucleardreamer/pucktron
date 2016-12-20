const { join } = require('path')
const Puck = require(join(__dirname, 'puck'))
const { debug, error } = console
const app = window.angular.module('puck', ['ngMaterial'])

app.controller('puck-controller', function ($scope, $timeout) {
  $scope.devices = {}
  $scope.status = 'none'
  $scope.puck = new Puck()
  $scope.search = function () {
    debug($scope.puck)
    $scope.puck.connect(function (err, ok) {
      $timeout(function () {
        if (err) error(err)
        debug.log(ok)
      })
    })
  }
  $scope.setStatus = function (name, val) {
    $timeout(function () {
      $scope.statusName = name
      $scope.statusValue = val
    })
  }
  $scope.puck.on('error', function () { $scope.setStatus('error', ...arguments) })
  $scope.puck.on('open', function () { $scope.setStatus('open', ...arguments) })
  $scope.puck.on('opening', function () { $scope.setStatus('opening', ...arguments) })
  $scope.puck.on('data', function () { $scope.setStatus('data', ...arguments) })
  $scope.puck.on('device', function () { $scope.setStatus('device', ...arguments) })
  $scope.puck.on('connected', function () { $scope.setStatus('connected', ...arguments) })
  $scope.puck.on('rx', function () { $scope.setStatus('rx', ...arguments) })
  $scope.puck.on('tx', function () { $scope.setStatus('tx', ...arguments) })
})

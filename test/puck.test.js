process.env.NODE_ENV = 'test'

const { join } = require('path')
const test = require('tape')
const puckPath = join(__dirname, '..', 'lib', 'puck')

test('*** lib/puck', function (t) {
  t.plan(1)
  try {
    require(puckPath)
  } catch (e) {
    if (e) {
      t.equal(typeof e, 'object')
    } else {
      t.fail()
    }
  }
  t.end()
})

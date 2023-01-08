const fc = require('fast-check')
const { jestSnapshotPlugin } = require('mocha-chai-jest-snapshot')
const chai = require('chai')

fc.configureGlobal({ numRuns: 5 })

BigInt.prototype.toJSON = function () {
  return this.toString()
}

chai.use(jestSnapshotPlugin())

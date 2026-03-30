/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { challenges } from '../../data/datacache'
import { type Challenge } from 'data/types'
import { checkKeys, nftUnlocked } from '../../routes/checkKeys'

const expect = chai.expect
chai.use(sinonChai)

describe('checkKeys', () => {
  let req: any
  let res: any
  let save: any

  beforeEach(() => {
    req = { body: {} }
    res = { json: sinon.spy(), status: sinon.stub().returns({ json: sinon.spy() }) }
    save = () => ({
      then () { }
    })
    challenges.nftUnlockChallenge = { solved: false, save } as unknown as Challenge
  })

  afterEach(() => {
    sinon.restore()
    Object.defineProperty(challenges, 'nftUnlockChallenge', {
      value: { solved: false, save },
      writable: true,
      configurable: true
    })
  })

  it('should return 500 with generic error message when an error occurs', () => {
    Object.defineProperty(challenges, 'nftUnlockChallenge', {
      get: () => { throw new Error('test error') },
      configurable: true
    })

    checkKeys()(req, res)

    expect(res.status).to.have.been.calledWith(500)
    const jsonSpy = res.status.returnValues[0].json
    const responseBody = jsonSpy.firstCall.args[0]
    expect(responseBody).to.deep.equal({ error: 'An unexpected error occurred.' })
  })

  it('should not expose error details or stack traces in error response', () => {
    Object.defineProperty(challenges, 'nftUnlockChallenge', {
      get: () => { throw new Error('sensitive internal details') },
      configurable: true
    })

    checkKeys()(req, res)

    const jsonSpy = res.status.returnValues[0].json
    const responseBody = JSON.stringify(jsonSpy.firstCall.args[0])
    expect(responseBody).to.not.include('sensitive internal details')
    expect(responseBody).to.not.include('at ')
    expect(responseBody).to.not.include('node_modules')
  })
})

describe('nftUnlocked', () => {
  let req: any
  let res: any

  beforeEach(() => {
    req = {}
    res = { json: sinon.spy(), status: sinon.stub().returns({ json: sinon.spy() }) }
  })

  it('should return 500 with generic error message when an error occurs', () => {
    challenges.nftUnlockChallenge = undefined as unknown as Challenge

    nftUnlocked()(req, res)

    expect(res.status).to.have.been.calledWith(500)
    const jsonSpy = res.status.returnValues[0].json
    const responseBody = jsonSpy.firstCall.args[0]
    expect(responseBody).to.deep.equal({ error: 'An unexpected error occurred.' })
  })

  it('should not expose error details or stack traces in error response', () => {
    challenges.nftUnlockChallenge = undefined as unknown as Challenge

    nftUnlocked()(req, res)

    const jsonSpy = res.status.returnValues[0].json
    const responseBody = JSON.stringify(jsonSpy.firstCall.args[0])
    expect(responseBody).to.not.include('Cannot read properties')
    expect(responseBody).to.not.include('at ')
    expect(responseBody).to.not.include('node_modules')
  })
})

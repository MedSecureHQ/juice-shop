/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { serveLogFiles } from '../../routes/logfileServer'
const expect = chai.expect
chai.use(sinonChai)

describe('logfileServer', () => {
  let req: any
  let res: any
  let next: any

  beforeEach(() => {
    req = { params: { } }
    res = { sendFile: sinon.spy(), status: sinon.spy() }
    next = sinon.spy()
  })

  it('should serve requested file from folder /logs', () => {
    req.params.file = 'test.log'

    serveLogFiles()(req, res, next)

    expect(res.sendFile).to.have.been.calledWith(sinon.match(/logs[/\\]test.log/))
  })

  it('should raise error for slashes in filename', () => {
    req.params.file = '../../../../nice.try'

    serveLogFiles()(req, res, next)

    expect(res.sendFile).to.have.not.been.calledWith(sinon.match.any)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
  })

  it('should block path traversal via dot-dot that resolves outside logs directory', () => {
    req.params.file = '..'

    serveLogFiles()(req, res, next)

    expect(res.sendFile).to.have.not.been.calledWith(sinon.match.any)
    expect(res.status).to.have.been.calledWith(403)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
  })

  it('should block path traversal via encoded slashes resolved by Express', () => {
    req.params.file = '../../etc/passwd'

    serveLogFiles()(req, res, next)

    expect(res.sendFile).to.have.not.been.calledWith(sinon.match.any)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
  })
})

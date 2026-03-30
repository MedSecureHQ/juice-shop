/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import * as models from '../../models/index'
import * as security from '../../lib/insecurity'

const expect = chai.expect
chai.use(sinonChai)

describe('login', () => {
  let queryStub: sinon.SinonStub

  beforeEach(() => {
    queryStub = sinon.stub(models.sequelize, 'query')
  })

  afterEach(() => {
    queryStub.restore()
  })

  it('should use parameterized replacements instead of string interpolation', async () => {
    queryStub.resolves(null)

    const { login } = await import('../../routes/login')
    const handler = login()

    const req: any = {
      body: { email: 'admin@juice-sh.op', password: 'admin123' }
    }
    const res: any = {
      status: sinon.stub().returnsThis(),
      send: sinon.spy(),
      json: sinon.spy(),
      __: sinon.stub().returnsArg(0)
    }
    const next = sinon.spy()

    handler(req, res, next)

    await new Promise(resolve => { setTimeout(resolve, 50) })

    expect(queryStub.callCount).to.equal(1)

    const callArgs = queryStub.firstCall.args
    const sql = callArgs[0]
    const options = callArgs[1]

    expect(sql).to.equal('SELECT * FROM Users WHERE email = :email AND password = :password AND deletedAt IS NULL')
    expect(options).to.have.property('replacements')
    expect(options.replacements).to.have.property('email', 'admin@juice-sh.op')
    expect(options.replacements).to.have.property('password', security.hash('admin123'))
  })

  it('should not include user input directly in the SQL query string', async () => {
    queryStub.resolves(null)

    const { login } = await import('../../routes/login')
    const handler = login()

    const maliciousEmail = "' OR 1=1--"
    const req: any = {
      body: { email: maliciousEmail, password: 'test' }
    }
    const res: any = {
      status: sinon.stub().returnsThis(),
      send: sinon.spy(),
      json: sinon.spy(),
      __: sinon.stub().returnsArg(0)
    }
    const next = sinon.spy()

    handler(req, res, next)

    await new Promise(resolve => { setTimeout(resolve, 50) })

    expect(queryStub.callCount).to.equal(1)

    const callArgs = queryStub.firstCall.args
    const sql = callArgs[0]
    const options = callArgs[1]

    expect(sql).to.not.contain(maliciousEmail)
    expect(sql).to.equal('SELECT * FROM Users WHERE email = :email AND password = :password AND deletedAt IS NULL')
    expect(options.replacements.email).to.equal(maliciousEmail)
  })

  it('should default to empty strings when email and password are not provided', async () => {
    queryStub.resolves(null)

    const { login } = await import('../../routes/login')
    const handler = login()

    const req: any = {
      body: {}
    }
    const res: any = {
      status: sinon.stub().returnsThis(),
      send: sinon.spy(),
      json: sinon.spy(),
      __: sinon.stub().returnsArg(0)
    }
    const next = sinon.spy()

    handler(req, res, next)

    await new Promise(resolve => { setTimeout(resolve, 50) })

    expect(queryStub.callCount).to.equal(1)

    const options = queryStub.firstCall.args[1]
    expect(options.replacements.email).to.equal('')
    expect(options.replacements.password).to.equal(security.hash(''))
  })
})

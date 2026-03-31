/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import * as models from '../../models/index'
import { searchProducts } from '../../routes/search'
const expect = chai.expect
chai.use(sinonChai)

describe('searchProducts', () => {
  let req: any
  let res: any
  let next: any
  let queryStub: sinon.SinonStub

  beforeEach(() => {
    req = { query: {}, __: sinon.stub().returnsArg(0) }
    res = { json: sinon.spy() }
    next = sinon.spy()
    queryStub = sinon.stub(models.sequelize, 'query')
  })

  afterEach(() => {
    queryStub.restore()
  })

  it('should use parameterized replacements instead of string interpolation', async () => {
    queryStub.resolves([[], []])
    req.query.q = 'apple'

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[0]).to.equal(
      'SELECT * FROM Products WHERE ((name LIKE \'%:criteria%\' OR description LIKE \'%:criteria%\') AND deletedAt IS NULL) ORDER BY name'
    )
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: 'apple' } })
  })

  it('should not interpolate SQL injection payload into the query string', async () => {
    queryStub.resolves([[], []])
    req.query.q = "' OR 1=1--"

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[0]).to.not.contain("' OR 1=1--")
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: "' OR 1=1--" } })
  })

  it('should pass empty string criteria when query is undefined', async () => {
    queryStub.resolves([[], []])
    req.query.q = 'undefined'

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: '' } })
  })

  it('should truncate criteria to 200 characters', async () => {
    queryStub.resolves([[], []])
    req.query.q = 'a'.repeat(300)

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[1].replacements.criteria).to.have.lengthOf(200)
  })

  it('should coerce array query parameter to first element string', async () => {
    queryStub.resolves([[], []])
    req.query.q = ['apple', 'banana']

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: 'apple' } })
  })

  it('should handle empty array query parameter gracefully', async () => {
    queryStub.resolves([[], []])
    req.query.q = []

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: '' } })
  })

  it('should coerce numeric query parameter to string', async () => {
    queryStub.resolves([[], []])
    req.query.q = 123 as any

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(queryStub).to.have.been.calledOnce // eslint-disable-line @typescript-eslint/no-unused-expressions
    const callArgs = queryStub.firstCall.args
    expect(callArgs[1]).to.deep.include({ replacements: { criteria: '123' } })
  })

  it('should call next with error parent on query failure', async () => {
    const parentError = new Error('db error')
    const error = Object.assign(new Error('query failed'), { parent: parentError })
    queryStub.rejects(error)
    req.query.q = 'test'

    searchProducts()(req, res, next)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(next).to.have.been.calledWith(parentError)
  })
})

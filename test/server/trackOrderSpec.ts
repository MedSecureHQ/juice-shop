/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { challenges } from '../../data/datacache'
import type { Challenge } from 'data/types'
import * as db from '../../data/mongodb'
import { trackOrder } from '../../routes/trackOrder'

const expect = chai.expect
chai.use(sinonChai)

describe('trackOrder', () => {
  let req: any
  let res: any
  let save: any

  beforeEach(() => {
    req = { params: {} }
    res = { json: sinon.spy(), status: sinon.stub().returnsThis() }
    save = () => ({
      then () { }
    })
  })

  it('uses parameterized query instead of $where to prevent code injection', () => {
    challenges.reflectedXssChallenge = { solved: false, save } as unknown as Challenge
    challenges.noSqlOrdersChallenge = { solved: false, save } as unknown as Challenge
    req.params.id = "test-order-id'; process.exit(); '"

    const findStub = sinon.stub(db.ordersCollection, 'find').returns({
      then (resolve: (value: never[]) => void) {
        resolve([])
        return { then () {} }
      }
    } as any)

    trackOrder()(req, res)

    expect(findStub.calledOnce).to.equal(true)
    const query = findStub.firstCall.args[0]
    expect(query).to.have.property('orderId')
    expect(query).to.not.have.property('$where')

    findStub.restore()
  })

  it('does not use $where operator in the MongoDB query', () => {
    challenges.reflectedXssChallenge = { solved: false, save } as unknown as Challenge
    challenges.noSqlOrdersChallenge = { solved: false, save } as unknown as Challenge
    req.params.id = 'abc123'

    const findStub = sinon.stub(db.ordersCollection, 'find').returns({
      then (resolve: (value: never[]) => void) {
        resolve([])
        return { then () {} }
      }
    } as any)

    trackOrder()(req, res)

    const query = findStub.firstCall.args[0]
    expect(query).to.deep.equal({ orderId: 'abc123' })
    expect(query).to.not.have.property('$where')

    findStub.restore()
  })

  it('returns order data for a valid order ID', () => {
    challenges.reflectedXssChallenge = { solved: false, save } as unknown as Challenge
    challenges.noSqlOrdersChallenge = { solved: false, save } as unknown as Challenge
    req.params.id = 'valid-order-123'

    const mockOrder = [{ orderId: 'valid-order-123', totalPrice: 10 }]
    const findStub = sinon.stub(db.ordersCollection, 'find').returns({
      then (resolve: (value: Array<{ orderId: string, totalPrice: number }>) => void) {
        resolve(mockOrder)
        return { then () {} }
      }
    } as any)

    trackOrder()(req, res)

    expect(res.json.calledOnce).to.equal(true)

    findStub.restore()
  })

  it('returns error response for invalid query', () => {
    challenges.reflectedXssChallenge = { solved: false, save } as unknown as Challenge
    challenges.noSqlOrdersChallenge = { solved: false, save } as unknown as Challenge
    req.params.id = 'bad-id'

    const findStub = sinon.stub(db.ordersCollection, 'find').returns({
      then (_resolve: (value: never[]) => void, reject: (err: Error) => void) {
        reject(new Error('query failed'))
        return { then () {} }
      }
    } as any)

    trackOrder()(req, res)

    expect(res.status).to.have.been.calledWith(400)
    expect(res.json).to.have.been.calledWith({ error: 'Wrong Param' })

    findStub.restore()
  })
})

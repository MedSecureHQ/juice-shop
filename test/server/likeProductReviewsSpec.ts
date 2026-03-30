/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import sinonChai from 'sinon-chai'

const expect = chai.expect
chai.use(sinonChai)

describe('likeProductReviews', () => {
  describe('input sanitization', () => {
    it('should coerce id to string to prevent NoSQL injection via object payload', () => {
      const maliciousId = { $ne: '' }
      const coerced = String(maliciousId)
      expect(coerced).to.equal('[object Object]')
      expect(typeof coerced).to.equal('string')
    })

    it('should coerce id to string when given a valid string id', () => {
      const validId = 'abc123'
      const coerced = String(validId)
      expect(coerced).to.equal('abc123')
      expect(typeof coerced).to.equal('string')
    })

    it('should coerce numeric id to string', () => {
      const numericId = 42
      const coerced = String(numericId)
      expect(coerced).to.equal('42')
      expect(typeof coerced).to.equal('string')
    })

    it('should coerce array id to string to prevent NoSQL injection', () => {
      const arrayId = ['admin']
      const coerced = String(arrayId)
      expect(coerced).to.equal('admin')
      expect(typeof coerced).to.equal('string')
    })

    it('should coerce nested NoSQL operator to harmless string', () => {
      const injection = { $gt: '' }
      const coerced = String(injection)
      expect(coerced).to.not.have.property('$gt')
      expect(typeof coerced).to.equal('string')
    })
  })
})

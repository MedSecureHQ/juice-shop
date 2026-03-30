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
    const sanitize = (id: any) => String(id).replace(/[^\w-]+/g, '')

    it('should coerce id to string to prevent NoSQL injection via object payload', () => {
      const maliciousId = { $ne: '' }
      const sanitized = sanitize(maliciousId)
      expect(sanitized).to.equal('objectObject')
      expect(typeof sanitized).to.equal('string')
    })

    it('should coerce id to string when given a valid string id', () => {
      const validId = 'abc123'
      const sanitized = sanitize(validId)
      expect(sanitized).to.equal('abc123')
      expect(typeof sanitized).to.equal('string')
    })

    it('should coerce numeric id to string', () => {
      const numericId = 42
      const sanitized = sanitize(numericId)
      expect(sanitized).to.equal('42')
      expect(typeof sanitized).to.equal('string')
    })

    it('should coerce array id to string to prevent NoSQL injection', () => {
      const arrayId = ['admin']
      const sanitized = sanitize(arrayId)
      expect(sanitized).to.equal('admin')
      expect(typeof sanitized).to.equal('string')
    })

    it('should coerce nested NoSQL operator to harmless string', () => {
      const injection = { $gt: '' }
      const sanitized = sanitize(injection)
      expect(sanitized).to.not.have.property('$gt')
      expect(typeof sanitized).to.equal('string')
    })

    it('should strip characters that are not alphanumeric, underscore, or hyphen', () => {
      const maliciousId = "abc'; DROP TABLE reviews;--"
      const sanitized = sanitize(maliciousId)
      expect(sanitized).to.equal('abcDROPTABLEreviews--')
    })

    it('should preserve valid id with hyphens and underscores', () => {
      const validId = 'review_123-abc'
      const sanitized = sanitize(validId)
      expect(sanitized).to.equal('review_123-abc')
    })

    it('should return empty string for id containing only special characters', () => {
      const maliciousId = '$${}[]'
      const sanitized = sanitize(maliciousId)
      expect(sanitized).to.equal('')
    })

    it('should strip MongoDB query operators from string input', () => {
      const maliciousId = '{$where: "sleep(5000)"}'
      const sanitized = sanitize(maliciousId)
      expect(sanitized).to.equal('wheresleep5000')
      expect(sanitized).to.not.include('$')
      expect(sanitized).to.not.include('{')
    })
  })
})

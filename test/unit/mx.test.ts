import { describe, expect, it } from 'vitest'
import { isCLABE, isCURP, isNSS, isPostalCode, isRFC, normalize } from '../../src/mx'

describe('validadores de México', () => {
  it('RFC: moral y física, con fecha válida', () => {
    expect(isRFC('PEM840101AB3')).toBe(true)
    expect(isRFC('merl900312qx4')).toBe(true)
    expect(isRFC(' GODE561231GR8 ')).toBe(true)
    expect(isRFC('PEM841301AB3')).toBe(false) // mes 13
    expect(isRFC('PEM840230AB3')).toBe(false) // 30 de febrero
    expect(isRFC('PEM84010AB3')).toBe(false)
  })

  it('CURP: ejemplos publicados y dígito verificador', () => {
    for (const c of ['LORX350217HNEPDV08', 'PELJ900515HJCRPN03', 'GOMC850315HDFMNR07']) expect(isCURP(c)).toBe(true)
    expect(isCURP('PELJ900515HJCRPN04')).toBe(false) // dígito verificador
    expect(isCURP('PELJ900515HZZRPN03')).toBe(false) // estado inexistente
    expect(isCURP('PELJ901315HJCRPN03')).toBe(false) // mes 13
  })

  it('NSS: 11 dígitos con Luhn', () => {
    expect(isNSS('12169012346')).toBe(true)
    expect(isNSS('12169012345')).toBe(false)
    expect(isNSS('1216901234')).toBe(false)
  })

  it('CLABE: 18 dígitos con dígito de control', () => {
    expect(isCLABE('002010077777777771')).toBe(true)
    expect(isCLABE('002 010 077777777771')).toBe(true)
    expect(isCLABE('002010077777777772')).toBe(false)
  })

  it('código postal', () => {
    expect(isPostalCode('06600')).toBe(true)
    expect(isPostalCode('00600')).toBe(false)
    expect(isPostalCode('6600')).toBe(false)
    expect(normalize(' ab c ')).toBe('ABC')
  })
})

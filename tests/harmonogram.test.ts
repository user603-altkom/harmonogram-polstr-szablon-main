import { describe, expect, it } from 'vitest';
import { policzHarmonogram } from '../src/domena/harmonogram';

const stalaSeria = [{ od: '2026-01-01', stopa: 0.0355 }];

const parametryKontrolne = {
  kwotaGr: 40_000_000,
  liczbaRat: 300,
  marza: 0.0211,
  typRat: 'rowne' as const,
  wskaznik: 'POLSTR_1M' as const,
  pierwszaRata: '2026-10-01',
};

describe('policzHarmonogram', () => {
  it('oblicza ratę kontrolną i wyrównuje ostatnią ratę', () => {
    const harmonogram = policzHarmonogram(parametryKontrolne, stalaSeria);

    expect(harmonogram.raty).toHaveLength(300);
    expect(harmonogram.pierwszaRataGr).toBe(249_472);
    expect(harmonogram.ostatniaRataGr).toBe(249_253);
    expect(harmonogram.raty.at(-1)?.saldoPoSplacieGr).toBe(0);
    expect(harmonogram.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr, 0)).toBe(40_000_000);
  });

  it('zwraca raty z wymaganymi polami i datami miesięcznymi', () => {
    const harmonogram = policzHarmonogram(parametryKontrolne, stalaSeria);
    const pierwsza = harmonogram.raty[0];

    expect(pierwsza).toMatchObject({
      numer: 1,
      data: '2026-10-01',
      rataGr: 249_472,
      saldoPoSplacieGr: 39_939_195,
    });
    expect(harmonogram.raty.at(-1)?.numer).toBe(300);
    expect(harmonogram.sumaOdsetekGr).toBeGreaterThan(0);
  });

  it('przechodzi z grudnia do stycznia przy końcu miesiąca', () => {
    const harmonogram = policzHarmonogram({ ...parametryKontrolne, pierwszaRata: '2026-12-31', liczbaRat: 2 }, stalaSeria);

    expect(harmonogram.raty.map((rata) => rata.data)).toEqual(['2026-12-31', '2027-01-31']);
  });

  it('oblicza malejące części kapitałowe', () => {
    const harmonogram = policzHarmonogram({
      ...parametryKontrolne,
      kwotaGr: 10_000_00,
      liczbaRat: 4,
      typRat: 'malejace',
    }, stalaSeria);
    const pierwsza = harmonogram.raty[0];
    const ostatnia = harmonogram.raty[3];

    expect(harmonogram.raty.map((rata) => rata.czescKapitalowaGr)).toEqual([250_000, 250_000, 250_000, 250_000]);
    expect(pierwsza?.rataGr).toBeGreaterThan(ostatnia?.rataGr ?? 0);
  });

  it('zmienia odsetki po zmianie wskaźnika i używa ostatniej znanej wartości', () => {
    const seria = [
      { od: '2026-01-01', stopa: 0.03 },
      { od: '2027-01-01', stopa: 0.04 },
    ];
    const harmonogram = policzHarmonogram({
      ...parametryKontrolne,
      kwotaGr: 10_000_00,
      liczbaRat: 3,
      pierwszaRata: '2026-12-01',
    }, seria);
    const pierwsza = harmonogram.raty[0];
    const druga = harmonogram.raty[1];
    const trzecia = harmonogram.raty[2];

    expect(druga?.czescOdsetkowaGr).toBe(Math.round((pierwsza?.saldoPoSplacieGr ?? 0) * 0.0611 / 12));
    expect(trzecia?.czescOdsetkowaGr).toBe(Math.round((druga?.saldoPoSplacieGr ?? 0) * 0.0611 / 12));
  });

  it('obsługuje nadpłatę obniżającą ratę bez zmiany okresu', () => {
    const harmonogram = policzHarmonogram({
      ...parametryKontrolne,
      kwotaGr: 10_000_00,
      liczbaRat: 4,
      nadplaty: [{ miesiac: 1, kwotaGr: 100_000, tryb: 'obniz_rate' }],
    }, stalaSeria);
    const pierwsza = harmonogram.raty[0];
    const druga = harmonogram.raty[1];

    expect(harmonogram.raty).toHaveLength(4);
    expect(pierwsza?.nadplataGr).toBe(100_000);
    expect(druga?.rataGr).toBeLessThan(pierwsza?.rataGr ?? 0);
  });

  it('obsługuje nadpłatę skracającą okres i odrzuca nadpłatę ponad saldo', () => {
    const harmonogram = policzHarmonogram({
      ...parametryKontrolne,
      kwotaGr: 10_000_00,
      liczbaRat: 4,
      nadplaty: [{ miesiac: 1, kwotaGr: 300_000, tryb: 'skroc_okres' }],
    }, stalaSeria);

    expect(harmonogram.raty.length).toBeLessThan(4);
    expect(() => policzHarmonogram({
      ...parametryKontrolne,
      kwotaGr: 10_000_00,
      liczbaRat: 4,
      nadplaty: [{ miesiac: 1, kwotaGr: 10_000_00, tryb: 'obniz_rate' }],
    }, stalaSeria)).toThrow('nadpłata');
  });

  it.each([
    ['kwotaGr', { kwotaGr: 0 }],
    ['liczbaRat', { liczbaRat: 0 }],
    ['marza', { marza: -0.01 }],
    ['pierwszaRata', { pierwszaRata: '2026-02-30' }],
  ])('odrzuca niepoprawne pole %s', (_pole, zmiana) => {
    expect(() => policzHarmonogram({ ...parametryKontrolne, ...zmiana }, stalaSeria)).toThrow();
  });
});
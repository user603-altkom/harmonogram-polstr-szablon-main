'use client';

import { useState, type FormEvent } from 'react';
import type { Harmonogram, Nadplata } from '../src/domena/harmonogram';

type OdpowiedzBledu = { blad: string };
type WierszNadplaty = { miesiac: string; kwota: string; tryb: Nadplata['tryb'] };

const DANE_POCZATKOWE = {
  kwota: '400000',
  liczbaRat: '300',
  marza: '2.11',
  wskaznik: 'POLSTR_1M',
  typRat: 'rowne',
  pierwszaRata: '2026-10-01',
};

function formatujKwote(grosze: number): string {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(grosze / 100);
}

function formatujLiczbe(grosze: number): string {
  return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grosze / 100);
}

function jestBledem(odpowiedz: Harmonogram | OdpowiedzBledu): odpowiedz is OdpowiedzBledu {
  return 'blad' in odpowiedz;
}

function zbudujSciezke(raty: Harmonogram['raty'], szerokosc: number, wysokosc: number): string {
  if (raty.length === 0) return '';
  const pierwsza = raty[0];
  if (!pierwsza) return '';
  const maksSaldo = pierwsza.saldoPoSplacieGr + pierwsza.czescKapitalowaGr + pierwsza.nadplataGr;
  return raty.map((rata, index) => {
    const x = raty.length === 1 ? szerokosc : (index / (raty.length - 1)) * szerokosc;
    const y = wysokosc - (rata.saldoPoSplacieGr / maksSaldo) * wysokosc;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function pobierzCsv(harmonogram: Harmonogram): void {
  const wiersze = [
    ['Numer', 'Data', 'Kapitał (gr)', 'Odsetki (gr)', 'Rata (gr)', 'Nadpłata (gr)', 'Saldo (gr)'],
    ...harmonogram.raty.map((rata) => [rata.numer, rata.data, rata.czescKapitalowaGr, rata.czescOdsetkowaGr, rata.rataGr, rata.nadplataGr, rata.saldoPoSplacieGr]),
    [],
    ['Suma odsetek (gr)', harmonogram.sumaOdsetekGr],
  ];
  const zawartosc = wiersze.map((wiersz) => wiersz.join(';')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\uFEFF${zawartosc}`], { type: 'text/csv;charset=utf-8' }));
  link.download = 'harmonogram.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Strona() {
  const [formularz, setFormularz] = useState(DANE_POCZATKOWE);
  const [nadplaty, setNadplaty] = useState<WierszNadplaty[]>([]);
  const [wynik, setWynik] = useState<Harmonogram | null>(null);
  const [blad, setBlad] = useState('');
  const [ladowanie, setLadowanie] = useState(false);
  const [otwarteLata, setOtwarteLata] = useState<number[]>([]);

  function zmienPole(pole: keyof typeof formularz, wartosc: string) {
    setFormularz((poprzedni) => ({ ...poprzedni, [pole]: wartosc }));
  }

  function zmienNadplate(index: number, pole: keyof WierszNadplaty, wartosc: string) {
    setNadplaty((poprzednie) => poprzednie.map((nadplata, numer) => numer === index ? { ...nadplata, [pole]: wartosc } : nadplata));
  }

  function ustawLata(lata: number) {
    zmienPole('liczbaRat', String(lata * 12));
  }

  async function oblicz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLadowanie(true);
    setBlad('');
    const parametry = new URLSearchParams(formularz);
    const nadplatyDoWyslania = nadplaty
      .filter((nadplata) => nadplata.miesiac !== '' || nadplata.kwota !== '')
      .map((nadplata) => ({ miesiac: Number(nadplata.miesiac), kwotaGr: Math.round(Number(nadplata.kwota) * 100), tryb: nadplata.tryb }));
    if (nadplatyDoWyslania.length > 0) parametry.set('nadplaty', JSON.stringify(nadplatyDoWyslania));

    try {
      const odpowiedz = await fetch(`/api/harmonogram?${parametry.toString()}`);
      const dane: Harmonogram | OdpowiedzBledu = await odpowiedz.json();
      if (!odpowiedz.ok || jestBledem(dane)) {
        setWynik(null);
        setBlad(jestBledem(dane) ? dane.blad : 'Nie udało się obliczyć harmonogramu.');
      } else {
        setWynik(dane);
        const pierwsza = dane.raty[0];
        setOtwarteLata(pierwsza ? [new Date(`${pierwsza.data}T00:00:00`).getFullYear()] : []);
      }
    } catch {
      setWynik(null);
      setBlad('Nie udało się połączyć z kalkulatorem.');
    } finally {
      setLadowanie(false);
    }
  }

  const lata = wynik ? [...new Set(wynik.raty.map((rata) => Number(rata.data.slice(0, 4))))] : [];
  const sumaKapitalu = wynik?.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr + rata.nadplataGr, 0) ?? 0;
  const sumaWplat = wynik ? sumaKapitalu + wynik.sumaOdsetekGr : 0;
  const procentKapitalu = sumaWplat > 0 ? Math.round((sumaKapitalu / sumaWplat) * 100) : 0;
  const sciezka = wynik ? zbudujSciezke(wynik.raty, 600, 150) : '';
  const pierwszaRata = wynik?.raty[0];
  const ostatniaRata = wynik?.raty.at(-1);
  const aktywneLata = otwarteLata.length > 0 ? otwarteLata : lata;

  return (
    <main className="min-h-screen bg-[var(--kolor-tla)] text-[var(--kolor-tekst)]">
      <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <span className="font-serif text-[24px] font-bold tracking-[-0.04em]">rata<span className="text-[var(--kolor-cyjan)]">.</span></span>
        <span className="rounded-full bg-[var(--kolor-cyjan-jasny)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kolor-cyjan-ciemny)]">POLSTR 1M już dostępny</span>
      </nav>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-5 pb-24 pt-3 lg:grid-cols-[minmax(360px,480px)_minmax(0,1fr)] lg:gap-16 lg:px-8">
        <form onSubmit={oblicz} className="flex max-w-[480px] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-[clamp(40px,4.8vw,64px)] font-semibold leading-[0.96] tracking-[-0.045em]">Policz swój kredyt w minutę.</h1>
            <p className="max-w-[420px] text-[17px] leading-7 text-[color-mix(in_srgb,var(--kolor-tekst)_75%,transparent)]">Przesuń suwaki, sprawdź wynik i zobacz, co dają zmiany wskaźnika oraz nadpłaty.</p>
          </div>

          <section className="flex flex-col gap-3">
            <label htmlFor="kwota" className="etykieta">Kwota kredytu</label>
            <div className="flex items-baseline gap-2">
              <input id="kwota" className="w-full min-w-0 border-0 bg-transparent p-0 font-serif text-[44px] font-semibold tracking-[-0.04em] outline-offset-4" inputMode="decimal" value={formularz.kwota} onChange={(event) => zmienPole('kwota', event.target.value)} />
              <span className="font-serif text-[22px] font-semibold">zł</span>
            </div>
            <input className="suwak" type="range" min="50000" max="2000000" step="10000" aria-label="Kwota kredytu" value={Math.min(2000000, Math.max(50000, Number(formularz.kwota) || 50000))} onChange={(event) => zmienPole('kwota', event.target.value)} />
            <div className="flex flex-wrap gap-2">
              {[300000, 400000, 500000, 750000].map((kwota) => <button className="pastylka" type="button" key={kwota} onClick={() => zmienPole('kwota', String(kwota))}>{formatujKwote(kwota * 100).replace(',00 zł', ' zł')}</button>)}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3"><span className="etykieta">Okres spłaty</span><span className="font-serif text-[22px] font-semibold">{Math.round(Number(formularz.liczbaRat) / 12)} lat</span></div>
            <input className="suwak" type="range" min="1" max="35" step="1" aria-label="Okres w latach" value={Math.min(35, Math.max(1, Math.round(Number(formularz.liczbaRat) / 12)))} onChange={(event) => ustawLata(Number(event.target.value))} />
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 25, 30].map((lata) => <button className="pastylka" type="button" key={lata} onClick={() => ustawLata(lata)}>{lata} lat</button>)}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="pole">Liczba rat<input className="input-papier" inputMode="numeric" value={formularz.liczbaRat} onChange={(event) => zmienPole('liczbaRat', event.target.value)} /></label>
              <label className="pole">Pierwsza rata<input className="input-papier" type="date" value={formularz.pierwszaRata} onChange={(event) => zmienPole('pierwszaRata', event.target.value)} /></label>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <span className="etykieta">Oprocentowanie</span>
            <div className="segmenty">
              {([['POLSTR_1M', 'POLSTR 1M'], ['WIBOR_3M', 'WIBOR 3M']] as const).map(([wartosc, etykieta]) => <label className="segment" key={wartosc}><input type="radio" name="wskaznik" value={wartosc} checked={formularz.wskaznik === wartosc} onChange={(event) => zmienPole('wskaznik', event.target.value)} />{etykieta}</label>)}
            </div>
            <div className="flex items-center justify-between gap-3 pt-2"><label htmlFor="marza">Marża banku</label><div className="flex items-center gap-1"><input id="marza" className="input-papier w-20 text-right" inputMode="decimal" value={formularz.marza} onChange={(event) => zmienPole('marza', event.target.value)} /><span className="text-sm">pp</span></div></div>
            <input className="suwak" type="range" min="0" max="4" step="0.01" aria-label="Marża banku" value={Math.min(4, Math.max(0, Number(formularz.marza) || 0))} onChange={(event) => zmienPole('marza', event.target.value)} />
            <p className="m-0 text-sm leading-6 text-[color-mix(in_srgb,var(--kolor-tekst)_74%,transparent)]">Wartość wskaźnika zmienia się zgodnie z serią danych dla wybranego terminu raty.</p>
          </section>

          <section className="flex flex-col gap-3">
            <span className="etykieta">Rodzaj rat</span>
            <div className="segmenty">
              {([['rowne', 'Równe'], ['malejace', 'Malejące']] as const).map(([wartosc, etykieta]) => <label className="segment" key={wartosc}><input type="radio" name="typRat" value={wartosc} checked={formularz.typRat === wartosc} onChange={(event) => zmienPole('typRat', event.target.value)} />{etykieta}</label>)}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3"><span className="etykieta">Nadpłaty</span><button className="przycisk-wtorny" type="button" onClick={() => setNadplaty((poprzednie) => [...poprzednie, { miesiac: '', kwota: '', tryb: 'skroc_okres' }])}>＋ Dodaj nadpłatę</button></div>
            {nadplaty.length === 0 && <p className="m-0 text-sm leading-6 text-[color-mix(in_srgb,var(--kolor-tekst)_72%,transparent)]">Dodaj nadpłatę i zobacz, ile odsetek oszczędzasz.</p>}
            {nadplaty.map((nadplata, index) => <div className="grid grid-cols-[76px_minmax(0,1fr)_minmax(0,1.1fr)_32px] items-end gap-2" key={`${index}-${nadplata.miesiac}`}>
              <label className="pole">Po racie<input className="input-papier" inputMode="numeric" value={nadplata.miesiac} onChange={(event) => zmienNadplate(index, 'miesiac', event.target.value)} /></label>
              <label className="pole">Kwota<input className="input-papier" inputMode="decimal" value={nadplata.kwota} onChange={(event) => zmienNadplate(index, 'kwota', event.target.value)} /></label>
              <label className="pole">Efekt<select className="input-papier" value={nadplata.tryb} onChange={(event) => zmienNadplate(index, 'tryb', event.target.value as Nadplata['tryb'])}><option value="skroc_okres">Skróć okres</option><option value="obniz_rate">Obniż ratę</option></select></label>
              <button className="przycisk-ikonowy" type="button" aria-label="Usuń nadpłatę" onClick={() => setNadplaty((poprzednie) => poprzednie.filter((_, numer) => numer !== index))}>×</button>
            </div>)}
          </section>

          {blad && <p className="m-0 text-sm text-[var(--kolor-magenta-ciemny)]" role="alert">{blad}</p>}
          <button className="przycisk-glowny" type="submit" disabled={ladowanie}>{ladowanie ? 'Liczenie...' : 'Policz'}</button>
        </form>

        <section className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="etykieta">Twoja rata</span>
            {wynik && pierwszaRata ? <div className="flex flex-wrap items-end gap-3"><span className="font-serif text-[clamp(76px,10vw,142px)] font-semibold leading-[0.85] tracking-[-0.055em]">{formatujLiczbe(pierwszaRata.rataGr)}</span><span className="pb-2 font-serif text-3xl font-semibold">zł</span></div> : <div className="font-serif text-[clamp(58px,8vw,110px)] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--kolor-tekst-jasny)]">—</div>}
            <p className="m-0 max-w-[560px] text-[17px] leading-7 text-[color-mix(in_srgb,var(--kolor-tekst)_78%,transparent)]">{wynik && pierwszaRata ? `Pierwsza rata według wybranego scenariusza. Ostatnia wynosi ${formatujKwote(ostatniaRata?.rataGr ?? 0)}.` : 'Wypełnij parametry po lewej i uruchom obliczenie, aby zobaczyć scenariusz.'}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="metryka"><span>Ostatnia rata</span><strong>{wynik ? formatujKwote(ostatniaRata?.rataGr ?? 0) : '—'}</strong><small>{ostatniaRata?.data ?? '—'}</small></div>
            <div className="metryka"><span>Suma odsetek</span><strong className="text-[var(--kolor-magenta-ciemny)]">{wynik ? formatujKwote(wynik.sumaOdsetekGr) : '—'}</strong><small>{wynik ? `${wynik.raty.length} rat` : 'Wynik po obliczeniu'}</small></div>
            <div className="metryka"><span>Łącznie oddasz</span><strong>{wynik ? formatujKwote(sumaWplat) : '—'}</strong><small>{ostatniaRata ? `do ${ostatniaRata.data}` : '—'}</small></div>
          </div>

          {wynik && <>
            <div className="flex flex-col gap-3">
              <h2 className="m-0 font-serif text-[26px] font-semibold tracking-[-0.02em]">Gdzie idą twoje pieniądze</h2>
              <div className="flex h-[18px] overflow-hidden rounded-[3px]"><div className="bg-[var(--kolor-tekst)]" style={{ width: `${procentKapitalu}%` }} /><div className="flex-1 bg-[var(--kolor-magenta)]" /></div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[var(--kolor-tekst)]" />Kapitał {procentKapitalu}%</span><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[var(--kolor-magenta)]" />Odsetki {100 - procentKapitalu}%</span></div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="m-0 font-serif text-[26px] font-semibold tracking-[-0.02em]">Ile zostało do spłaty</h2><span className="text-sm text-[color-mix(in_srgb,var(--kolor-tekst)_70%,transparent)]">{wynik.raty.length} okresów</span></div>
              <div className="wykres"><svg viewBox="0 0 600 150" preserveAspectRatio="none" role="img" aria-label="Wykres malejącego salda kredytu"><path d={`${sciezka} L 600 150 L 0 150 Z`} fill="var(--kolor-cyjan-jasny)" /><path d={sciezka} fill="none" stroke="var(--kolor-cyjan-ciemny)" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div>
              <div className="flex justify-between text-xs tabular-nums"><span>{wynik.raty[0]?.data}</span><span>{wynik.raty.at(Math.floor(wynik.raty.length / 2))?.data}</span><span>{ostatniaRata?.data}</span></div>
            </div>
          </>}
        </section>

        {wynik && <section className="col-span-full flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="m-0 font-serif text-[32px] font-semibold tracking-[-0.025em]">Harmonogram spłat</h2><p className="m-0 mt-1 text-sm text-[color-mix(in_srgb,var(--kolor-tekst)_70%,transparent)]">Kwoty w groszach przeliczone na złote. Rozwiń rok, aby zobaczyć raty.</p></div><button className="przycisk-wtorny" type="button" onClick={() => pobierzCsv(wynik)}>↓ Eksport CSV</button></div>
          <div className="flex flex-col">
            {lata.map((rok) => {
              const wiersze = wynik.raty.filter((rata) => Number(rata.data.slice(0, 4)) === rok);
              const otwarte = aktywneLata.includes(rok);
              return <div className="border-b border-[var(--kolor-linia)]" key={rok}>
                <button className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 border-0 bg-transparent px-1 py-4 text-left text-[var(--kolor-tekst)] hover:bg-[color-mix(in_srgb,var(--kolor-cyjan)_8%,transparent)]" type="button" aria-expanded={otwarte} onClick={() => setOtwarteLata((poprzednie) => poprzednie.includes(rok) ? poprzednie.filter((element) => element !== rok) : [...poprzednie, rok])}><strong className="font-serif text-xl">{rok}</strong><span className="flex-1 text-sm">{wiersze.length} rat · saldo {formatujKwote(wiersze.at(-1)?.saldoPoSplacieGr ?? 0)}</span><span className="text-xl text-[var(--kolor-cyjan)]">{otwarte ? '−' : '+'}</span></button>
                {otwarte && <div className="overflow-x-auto pb-4"><div className="min-w-[760px] text-sm tabular-nums"><div className="grid grid-cols-[42px_92px_1fr_1fr_1fr_1fr_1.2fr] gap-2 px-1 py-2 text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--kolor-tekst)_64%,transparent)]"><span>Nr</span><span>Data</span><span className="text-right">Kapitał</span><span className="text-right">Odsetki</span><span className="text-right">Rata</span><span className="text-right">Nadpłata</span><span className="text-right">Saldo</span></div>{wiersze.map((rata) => <div className="grid grid-cols-[42px_92px_1fr_1fr_1fr_1fr_1.2fr] gap-2 border-t border-[var(--kolor-linia)] px-1 py-2" key={rata.numer}><span>{rata.numer}</span><span>{rata.data}</span><span className="text-right">{formatujLiczbe(rata.czescKapitalowaGr)}</span><span className="text-right">{formatujLiczbe(rata.czescOdsetkowaGr)}</span><span className="text-right font-semibold">{formatujLiczbe(rata.rataGr)}</span><span className="text-right font-semibold text-[var(--kolor-magenta-ciemny)]">{formatujLiczbe(rata.nadplataGr)}</span><span className="text-right">{formatujLiczbe(rata.saldoPoSplacieGr)}</span></div>)}</div></div>}
              </div>;
            })}
          </div>
          <p className="m-0 max-w-[680px] text-xs leading-5 text-[color-mix(in_srgb,var(--kolor-tekst)_70%,transparent)]">Wartości wskaźników są ilustracyjne. Po ostatnim wpisie serii obowiązuje ostatnia znana wartość. Odsetki: saldo × stopa roczna / 12, zaokrąglenie do grosza, ostatnia rata wyrównująca. Wynik nie jest ofertą banku.</p>
        </section>}
      </div>
    </main>
  );
}

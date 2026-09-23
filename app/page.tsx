'use client';

import { useState, type FormEvent } from 'react';
import type { Harmonogram, Nadplata } from '../src/domena/harmonogram';

type OdpowiedzBledu = { blad: string };
type WierszNadplaty = { miesiac: string; kwota: string; tryb: Nadplata['tryb'] };

const danePoczatkowe = { kwota: '400000', liczbaRat: '300', marza: '2.11', wskaznik: 'POLSTR_1M', typRat: 'rowne', pierwszaRata: '2026-10-01' };

function formatujKwote(grosze: number): string { return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(grosze / 100); }
function formatujLiczbe(grosze: number): string { return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grosze / 100); }
function jestBledem(odpowiedz: Harmonogram | OdpowiedzBledu): odpowiedz is OdpowiedzBledu { return 'blad' in odpowiedz; }

function escapujCsv(wartosc: string | number): string {
  const tekst = String(wartosc);
  return /[;"\n]/.test(tekst) ? `"${tekst.replace(/"/g, '""')}"` : tekst;
}

function pobierzCsv(harmonogram: Harmonogram): void {
  const wiersze = [
    ['Numer', 'Data', 'Kapital (PLN)', 'Odsetki (PLN)', 'Rata (PLN)', 'Nadplata (PLN)', 'Saldo (PLN)'],
    ...harmonogram.raty.map((rata) => [rata.numer, rata.data, formatujKwote(rata.czescKapitalowaGr), formatujKwote(rata.czescOdsetkowaGr), formatujKwote(rata.rataGr), formatujKwote(rata.nadplataGr), formatujKwote(rata.saldoPoSplacieGr)]),
    [], ['Suma odsetek (PLN)', formatujKwote(harmonogram.sumaOdsetekGr)],
  ];
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\uFEFF${wiersze.map((wiersz) => wiersz.map(escapujCsv).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8' }));
  link.download = 'harmonogram.csv'; link.click(); URL.revokeObjectURL(link.href);
}

function zbudujSciezke(raty: Harmonogram['raty']): string {
  const pierwsza = raty[0];
  if (!pierwsza) return '';
  const maksSaldo = pierwsza.saldoPoSplacieGr + pierwsza.czescKapitalowaGr + pierwsza.nadplataGr;
  return raty.map((rata, index) => {
    const x = raty.length === 1 ? 600 : (index / (raty.length - 1)) * 600;
    const y = 150 - (rata.saldoPoSplacieGr / maksSaldo) * 150;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

export default function Strona() {
  const [formularz, setFormularz] = useState(danePoczatkowe);
  const [nadplaty, setNadplaty] = useState<WierszNadplaty[]>([]);
  const [wynik, setWynik] = useState<Harmonogram | null>(null);
  const [blad, setBlad] = useState('');
  const [ladowanie, setLadowanie] = useState(false);
  const [dialogNadplat, setDialogNadplat] = useState(false);
  const [otwarteLata, setOtwarteLata] = useState<number[]>([]);

  function zmienPole(pole: keyof typeof formularz, wartosc: string) { setFormularz((poprzedni) => ({ ...poprzedni, [pole]: wartosc })); }
  function zmienNadplate(index: number, pole: keyof WierszNadplaty, wartosc: string) { setNadplaty((poprzednie) => poprzednie.map((nadplata, numer) => numer === index ? { ...nadplata, [pole]: wartosc } : nadplata)); }
  function ustawLata(lata: number) { zmienPole('liczbaRat', String(lata * 12)); }

  async function oblicz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLadowanie(true); setBlad('');
    const parametry = new URLSearchParams(formularz);
    const daneNadplat = nadplaty.filter((nadplata) => nadplata.miesiac !== '' || nadplata.kwota !== '').map((nadplata) => ({ miesiac: Number(nadplata.miesiac), kwotaGr: Math.round(Number(nadplata.kwota) * 100), tryb: nadplata.tryb }));
    if (daneNadplat.length > 0) parametry.set('nadplaty', JSON.stringify(daneNadplat));
    try {
      const odpowiedz = await fetch(`/api/harmonogram?${parametry.toString()}`);
      const dane: Harmonogram | OdpowiedzBledu = await odpowiedz.json();
      if (!odpowiedz.ok || jestBledem(dane)) { setWynik(null); setBlad(jestBledem(dane) ? dane.blad : 'Nie udało się obliczyć harmonogramu.'); }
      else { setWynik(dane); const pierwsza = dane.raty[0]; setOtwarteLata(pierwsza ? [Number(pierwsza.data.slice(0, 4))] : []); }
    } catch { setWynik(null); setBlad('Nie udało się połączyć z kalkulatorem.'); }
    finally { setLadowanie(false); }
  }

  const pierwszaRata = wynik?.raty[0];
  const ostatniaRata = wynik?.raty.at(-1);
  const lata = wynik ? [...new Set(wynik.raty.map((rata) => Number(rata.data.slice(0, 4))))] : [];
  const sumaKapitalu = wynik?.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr + rata.nadplataGr, 0) ?? 0;
  const sumaWplat = wynik ? sumaKapitalu + wynik.sumaOdsetekGr : 0;
  const procentKapitalu = sumaWplat ? Math.round((sumaKapitalu / sumaWplat) * 100) : 0;
  const sciezka = wynik ? zbudujSciezke(wynik.raty) : '';

  return (
    <div className="ekran-v4">
      <nav className="nav-v4"><span className="logo-v4">rata<span>.</span></span><span className="tag-v4">POLSTR 1M już dostępny</span></nav>
      {wynik && <div className="pasek-wyniku"><span>Twoja pierwsza rata</span><strong>{formatujKwote(pierwszaRata?.rataGr ?? 0)}</strong></div>}
      <main className="siatka-v4">
        <form className="panel-formularza" onSubmit={oblicz}>
          <section className="sekcja-v4"><label className="etykieta-v4" htmlFor="kwota">Kwota kredytu</label><div className="duza-kwota"><input id="kwota" inputMode="decimal" value={formularz.kwota} onChange={(event) => zmienPole('kwota', event.target.value)} /><span>zł</span></div><input className="suwak-v4" type="range" min="50000" max="2000000" step="10000" aria-label="Kwota kredytu" value={Math.min(2000000, Math.max(50000, Number(formularz.kwota) || 50000))} onChange={(event) => zmienPole('kwota', event.target.value)} /><div className="presety-v4">{[300000, 400000, 500000].map((kwota) => <button type="button" key={kwota} onClick={() => zmienPole('kwota', String(kwota))}>{formatujKwote(kwota * 100).replace(',00 zł', ' zł')}</button>)}</div></section>
          <section className="sekcja-v4"><div className="naglowek-wiersza"><span className="etykieta-v4">Okres spłaty</span><strong>{Math.round(Number(formularz.liczbaRat) / 12)} lat</strong></div><input className="suwak-v4" type="range" min="1" max="35" value={Math.min(35, Math.max(1, Math.round(Number(formularz.liczbaRat) / 12)))} onChange={(event) => ustawLata(Number(event.target.value))} /><div className="dwa-pola-v4"><label className="pole-v4">Liczba rat<input value={formularz.liczbaRat} onChange={(event) => zmienPole('liczbaRat', event.target.value)} /></label><label className="pole-v4">Pierwsza rata<input type="date" value={formularz.pierwszaRata} onChange={(event) => zmienPole('pierwszaRata', event.target.value)} /></label></div></section>
          <section className="sekcja-v4"><span className="etykieta-v4">Wskaźnik</span><div className="segmenty-v4">{([['POLSTR_1M', 'POLSTR 1M'], ['WIBOR_3M', 'WIBOR 3M']] as const).map(([wartosc, etykieta]) => <label key={wartosc}><input type="radio" name="wskaznik" checked={formularz.wskaznik === wartosc} onChange={() => zmienPole('wskaznik', wartosc)} />{etykieta}</label>)}</div><div className="marza-v4"><label htmlFor="marza">Marża</label><input id="marza" value={formularz.marza} onChange={(event) => zmienPole('marza', event.target.value)} /><span>pp</span></div><input className="suwak-v4" type="range" min="0" max="4" step="0.01" aria-label="Marża" value={Math.min(4, Math.max(0, Number(formularz.marza) || 0))} onChange={(event) => zmienPole('marza', event.target.value)} /></section>
          <section className="sekcja-v4"><span className="etykieta-v4">Rodzaj rat</span><div className="segmenty-v4">{([['rowne', 'Równe'], ['malejace', 'Malejące']] as const).map(([wartosc, etykieta]) => <label key={wartosc}><input type="radio" name="typRat" checked={formularz.typRat === wartosc} onChange={() => zmienPole('typRat', wartosc)} />{etykieta}</label>)}</div></section>
          <section className="nadplaty-skrot" onClick={() => setDialogNadplat(true)}><div><span className="etykieta-v4">Nadpłaty</span><span>{nadplaty.length ? `${nadplaty.length} zaplanowane` : 'Brak nadpłat'}</span></div><button type="button">{nadplaty.length ? 'Edytuj' : 'Dodaj'}</button></section>
          {blad && <p className="blad-v4" role="alert">{blad}</p>}<button className="policz-v4" type="submit" disabled={ladowanie}>{ladowanie ? 'Liczenie...' : 'Policz'}</button>
        </form>

        <section className="panel-wyniku"><div className="karta-raty-v4"><div className="naglowek-wiersza"><span className="etykieta-v4">{wynik ? 'Pierwsza rata' : 'Twój wynik'}</span>{wynik && <span className="tag-v4">{formularz.wskaznik === 'POLSTR_1M' ? 'POLSTR 1M' : 'WIBOR 3M'}</span>}</div><div className="hero-kwota">{wynik ? formatujLiczbe(pierwszaRata?.rataGr ?? 0) : '—'} <small>{wynik ? 'zł' : ''}</small></div><p>{wynik ? `Ostatnia rata: ${formatujKwote(ostatniaRata?.rataGr ?? 0)}. Wartość wynika z wybranego scenariusza.` : 'Uzupełnij parametry i kliknij „Policz”, aby zobaczyć ratę.'}</p><div className="pasek-podzialu"><div style={{ width: `${procentKapitalu}%` }} /></div><div className="legenda-v4"><span>Kapitał {procentKapitalu}%</span><span>Odsetki {100 - procentKapitalu}%</span></div></div>
          <div className="metryki-v4"><div><span>Ostatnia rata</span><strong>{wynik ? formatujKwote(ostatniaRata?.rataGr ?? 0) : '—'}</strong><small>{ostatniaRata?.data ?? '—'}</small></div><div><span>Odsetki</span><strong className="magenta-v4">{wynik ? formatujKwote(wynik.sumaOdsetekGr) : '—'}</strong><small>{wynik ? `${wynik.raty.length} rat` : '—'}</small></div><div><span>Łącznie</span><strong>{wynik ? formatujKwote(sumaWplat) : '—'}</strong><small>zł do spłaty</small></div></div>
          {wynik && <div className="wykres-v4"><div className="naglowek-wiersza"><span className="etykieta-v4">Saldo w czasie</span><span>{wynik.raty.length} okresów</span></div><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Wykres salda kredytu"><path d={`${sciezka} L 600 150 L 0 150 Z`} fill="var(--kolor-cyjan-jasny)" /><path d={sciezka} fill="none" stroke="var(--kolor-cyjan-ciemny)" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div>}
        </section>

        {wynik && <section className="harmonogram-v4"><div className="naglowek-harmonogramu"><div><h2>Harmonogram</h2><p>Rozwiń rok, aby zobaczyć raty.</p></div><button className="eksport-v4" type="button" onClick={() => pobierzCsv(wynik)}>↓ CSV</button></div><div className="tabela-v4"><div className="wiersz-naglowka"><span>Nr</span><span>Data</span><span>Kapitał</span><span>Odsetki</span><span>Rata</span><span>Nadpłata</span><span>Saldo</span></div>{lata.map((rok) => { const wiersze = wynik.raty.filter((rata) => Number(rata.data.slice(0, 4)) === rok); const otwarte = otwarteLata.includes(rok); return <div key={rok}><button className="rok-v4" type="button" aria-expanded={otwarte} onClick={() => setOtwarteLata((poprzednie) => poprzednie.includes(rok) ? poprzednie.filter((element) => element !== rok) : [...poprzednie, rok])}><strong>{rok}</strong><span>{wiersze.length} rat · saldo {formatujKwote(wiersze.at(-1)?.saldoPoSplacieGr ?? 0)}</span><b>{otwarte ? '−' : '+'}</b></button>{otwarte && wiersze.map((rata) => <div className="wiersz-tabeli" key={rata.numer}><span>{rata.numer}</span><span>{rata.data}</span><span>{formatujLiczbe(rata.czescKapitalowaGr)}</span><span>{formatujLiczbe(rata.czescOdsetkowaGr)}</span><span><b>{formatujLiczbe(rata.rataGr)}</b></span><span className="magenta-v4">{formatujLiczbe(rata.nadplataGr)}</span><span>{formatujLiczbe(rata.saldoPoSplacieGr)}</span></div>)}</div>; })}</div><p className="nota-v4">Wartości wskaźników są ilustracyjne. Po ostatnim wpisie serii obowiązuje ostatnia znana wartość. Wynik nie jest ofertą banku.</p></section>}
      </main>

      {dialogNadplat && <div className="modal-tlo" role="presentation" onClick={() => setDialogNadplat(false)}><div className="modal-v4" role="dialog" aria-modal="true" aria-labelledby="nadplaty-tytul" onClick={(event) => event.stopPropagation()}><div className="naglowek-wiersza"><h2 id="nadplaty-tytul">Nadpłaty</h2><button className="przycisk-wtorny" type="button" onClick={() => setNadplaty((poprzednie) => [...poprzednie, { miesiac: '', kwota: '', tryb: 'skroc_okres' }])}>＋ Dodaj</button></div>{nadplaty.length === 0 && <p>Brak nadpłat. Dodaj pierwszą, aby zaplanować scenariusz.</p>}{nadplaty.map((nadplata, index) => <div className="wiersz-nadplaty-v4" key={`${index}-${nadplata.miesiac}`}><label className="pole-v4">Po racie<input value={nadplata.miesiac} onChange={(event) => zmienNadplate(index, 'miesiac', event.target.value)} /></label><label className="pole-v4">Kwota<input value={nadplata.kwota} onChange={(event) => zmienNadplate(index, 'kwota', event.target.value)} /></label><label className="pole-v4">Efekt<select value={nadplata.tryb} onChange={(event) => zmienNadplate(index, 'tryb', event.target.value as Nadplata['tryb'])}><option value="skroc_okres">Skróć okres</option><option value="obniz_rate">Obniż ratę</option></select></label><button className="przycisk-ikonowy" type="button" aria-label="Usuń nadpłatę" onClick={() => setNadplaty((poprzednie) => poprzednie.filter((_, numer) => numer !== index))}>×</button></div>)}<div className="modal-akcje"><button className="policz-v4" type="button" onClick={() => setDialogNadplat(false)}>Gotowe</button></div></div></div>}
    </div>
  );
}

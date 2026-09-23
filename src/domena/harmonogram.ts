export interface ParametryKredytu {
  kwotaGr: number;
  liczbaRat: number;
  marza: number;
  typRat: 'rowne' | 'malejace';
  wskaznik: 'POLSTR_1M' | 'WIBOR_3M';
  pierwszaRata: string;
  nadplaty?: readonly Nadplata[];
}

export interface WpisWskaznika {
  od: string;
  stopa: number;
}

export interface Nadplata {
  miesiac: number;
  kwotaGr: number;
  tryb: 'obniz_rate' | 'skroc_okres';
}

export interface Rata {
  numer: number;
  data: string;
  czescKapitalowaGr: number;
  czescOdsetkowaGr: number;
  rataGr: number;
  saldoPoSplacieGr: number;
  nadplataGr: number;
}

export interface Harmonogram {
  kwotaKredytuGr: number;
  pierwszaRataGr: number;
  ostatniaRataGr: number;
  sumaOdsetekGr: number;
  raty: Rata[];
}

function zaokraglijGrosze(wartosc: number): number {
  return Math.round(wartosc);
}

function poprawnaData(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const dataUtc = new Date(`${data}T00:00:00.000Z`);
  return !Number.isNaN(dataUtc.getTime()) && dataUtc.toISOString().slice(0, 10) === data;
}

function dodajMiesiac(data: string): string {
  const rok = Number(data.slice(0, 4));
  const miesiac = Number(data.slice(5, 7));
  const dzien = Number(data.slice(8, 10));
  const kolejnyTermin = new Date(Date.UTC(rok, miesiac, 1));
  const nowyRok = kolejnyTermin.getUTCFullYear();
  const nowyMiesiac = kolejnyTermin.getUTCMonth() + 1;
  const ostatniDzien = new Date(Date.UTC(nowyRok, kolejnyTermin.getUTCMonth() + 1, 0)).getUTCDate();
  const bezpiecznyDzien = Math.min(dzien, ostatniDzien);
  return [nowyRok, nowyMiesiac, bezpiecznyDzien]
    .map((czesc, indeks) => (indeks === 0 ? String(czesc).padStart(4, '0') : String(czesc).padStart(2, '0')))
    .join('-');
}

function stopaDlaDaty(data: string, seria: readonly WpisWskaznika[]): number {
  const wpis = [...seria].reverse().find((kandydat) => kandydat.od <= data);
  if (!wpis) throw new Error(`brak wartości wskaźnika przed datą ${data}`);
  return wpis.stopa;
}

function rataRowna(saldoGr: number, stopaOkresu: number, pozostaleRaty: number): number {
  if (stopaOkresu === 0) return zaokraglijGrosze(saldoGr / pozostaleRaty);
  const wspolczynnik = Math.pow(1 + stopaOkresu, -pozostaleRaty);
  return zaokraglijGrosze((saldoGr * stopaOkresu) / (1 - wspolczynnik));
}

function sprawdzParametry(parametry: ParametryKredytu, seria: readonly WpisWskaznika[]): void {
  if (!Number.isSafeInteger(parametry.kwotaGr) || parametry.kwotaGr <= 0) {
    throw new Error('kwotaGr: dodatnia liczba całkowita groszy');
  }
  if (!Number.isInteger(parametry.liczbaRat) || parametry.liczbaRat <= 0) {
    throw new Error('liczbaRat: dodatnia liczba całkowita');
  }
  if (!Number.isFinite(parametry.marza) || parametry.marza < 0) {
    throw new Error('marza: nieujemny ułamek stopy');
  }
  if (parametry.typRat !== 'rowne' && parametry.typRat !== 'malejace') {
    throw new Error('typRat: rowne albo malejace');
  }
  if (parametry.wskaznik !== 'POLSTR_1M' && parametry.wskaznik !== 'WIBOR_3M') {
    throw new Error('wskaznik: POLSTR_1M albo WIBOR_3M');
  }
  if (!poprawnaData(parametry.pierwszaRata)) {
    throw new Error('pierwszaRata: poprawna data YYYY-MM-DD');
  }
  if (seria.length === 0 || seria.some((wpis) => !poprawnaData(wpis.od) || !Number.isFinite(wpis.stopa))) {
    throw new Error('seria wskaźnika: niepoprawne dane');
  }
  for (const nadplata of parametry.nadplaty ?? []) {
    if (!Number.isInteger(nadplata.miesiac) || nadplata.miesiac < 1 || nadplata.miesiac > parametry.liczbaRat) {
      throw new Error('nadpłata: miesiąc poza harmonogramem');
    }
    if (!Number.isSafeInteger(nadplata.kwotaGr) || nadplata.kwotaGr <= 0) {
      throw new Error('nadpłata: dodatnia liczba całkowita groszy');
    }
    if (nadplata.tryb !== 'obniz_rate' && nadplata.tryb !== 'skroc_okres') {
      throw new Error('nadpłata: niepoprawny tryb');
    }
  }
}

export function policzHarmonogram(
  parametry: ParametryKredytu,
  seria: readonly WpisWskaznika[],
): Harmonogram {
  sprawdzParametry(parametry, seria);

  let saldoGr = parametry.kwotaGr;
  let dataRaty = parametry.pierwszaRata;
  let sumaOdsetekGr = 0;
  let poprzedniaStopaRoczna: number | undefined;
  let zaplanowanaRataGr = 0;
  let przeliczRatePoNadplacie = false;
  let przeliczKapitalPoNadplacie = false;
  const bazowaCzescKapitalowaGr = zaokraglijGrosze(parametry.kwotaGr / parametry.liczbaRat);
  const raty: Rata[] = [];

  for (let numer = 1; numer <= parametry.liczbaRat; numer += 1) {
    const stopaRoczna = stopaDlaDaty(dataRaty, seria) + parametry.marza;
    const stopaOkresu = stopaRoczna / 12;
    const odsetkiGr = zaokraglijGrosze(saldoGr * stopaOkresu);
    const pozostaleRaty = parametry.liczbaRat - numer + 1;
    if (parametry.typRat === 'rowne' && (poprzedniaStopaRoczna !== stopaRoczna || przeliczRatePoNadplacie)) {
      zaplanowanaRataGr = rataRowna(saldoGr, stopaOkresu, pozostaleRaty);
      poprzedniaStopaRoczna = stopaRoczna;
      przeliczRatePoNadplacie = false;
    }
    const zaplanowanaCzescKapitalowaGr = parametry.typRat === 'malejace'
      ? przeliczKapitalPoNadplacie
        ? zaokraglijGrosze(saldoGr / pozostaleRaty)
        : bazowaCzescKapitalowaGr
      : Math.max(0, zaplanowanaRataGr - odsetkiGr);
    const kapitalGr = numer === parametry.liczbaRat
      ? saldoGr
      : Math.min(saldoGr, zaplanowanaCzescKapitalowaGr);
    const rataGr = kapitalGr + odsetkiGr;
    saldoGr -= kapitalGr;
    sumaOdsetekGr += odsetkiGr;
    const nadplata = parametry.nadplaty?.find((kandydat) => kandydat.miesiac === numer);
    const nadplataGr = nadplata?.kwotaGr ?? 0;
    if (nadplataGr > saldoGr) throw new Error(`nadpłata w miesiącu ${numer} przekracza saldo`);
    saldoGr -= nadplataGr;
    raty.push({
      numer,
      data: dataRaty,
      czescKapitalowaGr: kapitalGr,
      czescOdsetkowaGr: odsetkiGr,
      rataGr,
      saldoPoSplacieGr: saldoGr,
      nadplataGr,
    });
    if (nadplata?.tryb === 'obniz_rate') {
      przeliczRatePoNadplacie = true;
      przeliczKapitalPoNadplacie = true;
    }
    if (saldoGr === 0) break;
    dataRaty = dodajMiesiac(dataRaty);
  }

  const pierwszaRata = raty[0];
  const ostatniaRata = raty[raty.length - 1];
  if (!pierwszaRata || !ostatniaRata) throw new Error('nie udało się utworzyć rat');

  return {
    kwotaKredytuGr: parametry.kwotaGr,
    pierwszaRataGr: pierwszaRata.rataGr,
    ostatniaRataGr: ostatniaRata.rataGr,
    sumaOdsetekGr,
    raty,
  };
}

# Kontrakt: `GET /api/harmonogram`

## Cel

Endpoint zwraca obliczony harmonogram spłat dla jednego scenariusza kredytu.
Nie przechowuje danych między żądaniami.

## Parametry query

| Parametr | Format | Wymagany | Opis |
| --- | --- | --- | --- |
| `kwota` | dodatnia liczba w złotych | tak | np. `400000` |
| `liczbaRat` | dodatnia liczba całkowita | tak | np. `300` |
| `marza` | nieujemna liczba w punktach procentowych | tak | np. `2.11` |
| `wskaznik` | `POLSTR_1M` lub `WIBOR_3M` | tak | wybrana seria |
| `typRat` | `rowne` lub `malejace` | tak | rodzaj rat |
| `pierwszaRata` | `YYYY-MM-DD` | tak | termin pierwszej raty |
| `nadplaty` | URL-encoded JSON | nie | lista obiektów z `miesiac`, `kwotaGr` i `tryb` |

`kwota` i `marza` są podawane w jednostkach przyjaznych użytkownikowi, a
wewnętrzny model przelicza je do groszy i ułamka stopy. Kwoty w `nadplaty`
są podawane w groszach, żeby uniknąć niejednoznaczności zaokrągleń.

Przykład bez nadpłat:

```text
/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01
```

Przykład `nadplaty` przed zakodowaniem:

```json
[{"miesiac":12,"kwotaGr":500000,"tryb":"obniz_rate"}]
```

## Odpowiedź 200

```json
{
  "kwotaKredytuGr": 40000000,
  "pierwszaRataGr": 249472,
  "ostatniaRataGr": 249253,
  "sumaOdsetekGr": 34700000,
  "raty": [
    {
      "numer": 1,
      "data": "2026-10-01",
      "czescKapitalowaGr": 60805,
      "czescOdsetkowaGr": 188667,
      "rataGr": 249472,
      "saldoPoSplacieGr": 39939195,
      "nadplataGr": 0
    }
  ]
}
```

Wartości liczbowe w groszach są całkowite. Rzeczywiste wartości agregatów
muszą wynikać z tabeli; przykład pokazuje wyłącznie kształt odpowiedzi.

## Odpowiedź 400

```json
{
  "blad": "kwota: liczba dodatnia w złotych, np. 400000",
  "przyklad": "/api/harmonogram?..."
}
```

Błąd wskazuje pierwszy niepoprawny parametr lub niespójność nadpłaty. Odpowiedź
nie może zawierać częściowego harmonogramu.

## Kontrakt ekranu

- Formularz zbiera wszystkie parametry wejściowe, w tym listę nadpłat.
- Stan ładowania blokuje wielokrotne uruchomienie tego samego obliczenia.
- Po sukcesie ekran pokazuje pierwszą i ostatnią ratę, sumę odsetek oraz pełną
  tabelę zgodną z polem `raty`.
- Po błędzie ekran pokazuje wartość `blad` przy formularzu bez usuwania
  wcześniej wpisanych danych.
- Eksport CSV zawiera nagłówki odpowiadające kolumnom tabeli i wszystkie wiersze
  otrzymanej odpowiedzi.
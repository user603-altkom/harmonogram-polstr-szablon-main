# Model danych: Kalkulator harmonogramu spłat

## Parametry kredytu

Opisuje scenariusz przekazany do obliczeń.

| Pole | Typ | Reguły |
| --- | --- | --- |
| `kwotaGr` | całkowita liczba groszy | większa od zera |
| `liczbaRat` | liczba całkowita | większa od zera |
| `pierwszaRata` | data ISO `YYYY-MM-DD` | poprawna data kalendarzowa |
| `marza` | ułamek stopy | nieujemna; wejście HTTP podaje punkty procentowe |
| `typRat` | `rowne` lub `malejace` | wartość wymagana |
| `wskaznik` | `POLSTR_1M` lub `WIBOR_3M` | wartość wymagana |
| `nadplaty` | lista Nadpłat | domyślnie pusta |

## Seria wskaźnika

Pochodzi z istniejących danych projektu i jest uporządkowana rosnąco po dacie.

| Pole | Typ | Reguły |
| --- | --- | --- |
| `wskaznik` | identyfikator | zgodny z wybranym wskaźnikiem |
| `wartosci` | lista wpisów | co najmniej jeden wpis |
| `od` | data ISO | początek obowiązywania wpisu |
| `stopa` | liczba | ułamek, np. `0.0355` |

Wartość obowiązuje od własnej daty do dnia poprzedzającego kolejny wpis. Dla
dat po ostatnim wpisie obowiązuje ostatnia znana wartość. Data przed pierwszym
wpisem jest błędem danych.

## Nadpłata

Jednorazowa dodatkowa spłata powiązana z numerem miesiąca harmonogramu.

| Pole | Typ | Reguły |
| --- | --- | --- |
| `miesiac` | liczba całkowita | od 1 do liczby rat |
| `kwotaGr` | całkowita liczba groszy | większa od zera i nie większa od salda |
| `tryb` | `obniz_rate` lub `skroc_okres` | wartość wymagana |

Nadpłata jest stosowana po regularnej racie wskazanego miesiąca. Wartość
przekraczająca saldo jest odrzucana albo ograniczana do salda zgodnie z
walidacją kontraktu; implementacja wybierze odrzucenie jako bezpieczniejszą
reakcję dla użytkownika.

## Rata harmonogramu

| Pole | Typ | Reguły |
| --- | --- | --- |
| `numer` | liczba całkowita | zaczyna się od 1 |
| `data` | data ISO | kolejny termin miesięczny |
| `czescKapitalowaGr` | całkowita liczba groszy | nieujemna |
| `czescOdsetkowaGr` | całkowita liczba groszy | nieujemna |
| `rataGr` | całkowita liczba groszy | suma kapitału i odsetek |
| `saldoPoSplacieGr` | całkowita liczba groszy | nieujemne, ostatnie równe 0 |
| `nadplataGr` | całkowita liczba groszy | opcjonalna informacja o nadpłacie |

## Harmonogram

Zawiera uporządkowaną listę Rat oraz agregaty prezentowane nad tabelą.

- `raty`: lista rat, zakończona po spłacie salda lub po zaplanowanej liczbie
  rat.
- `pierwszaRataGr`: kwota pierwszej raty regularnej.
- `ostatniaRataGr`: kwota ostatniej raty regularnej.
- `sumaOdsetekGr`: suma części odsetkowych wszystkich rat.
- `kwotaKredytuGr`: kwota wejściowa do kontroli sumy kapitału.

## Reguły obliczeń i przejść

1. Walidacja parametrów i wybór serii wskaźnika poprzedzają tworzenie rat.
2. Dla raty wyznaczana jest stopa okresu, a następnie odsetki od salda przed
   spłatą.
3. Część kapitałowa zależy od typu raty; rata jest zaokrąglana do grosza.
4. Nadpłata po racie zmniejsza saldo i wpływa na kolejne raty albo ich liczbę.
5. Ostatnia rata koryguje pozostałe saldo, nie może tworzyć salda ujemnego.
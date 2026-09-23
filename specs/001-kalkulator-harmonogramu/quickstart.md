# Quickstart: walidacja kalkulatora harmonogramu

## Wymagania

- Node.js 22 lub nowszy
- Zależności projektu zainstalowane przez `npm install`
- Katalog repozytorium jako bieżący katalog

## Walidacja domeny

Uruchom testy jednostkowe:

```powershell
npm test
```

Oczekiwane przypadki:

1. Rata równa dla 400 000 zł, 300 rat i stopy 5,66% daje pierwszą ratę
   2 494,72 zł z tolerancją 0,05 zł.
2. Raty malejące mają malejącą część odsetkową i saldo końcowe 0 zł.
3. Zmiana wartości wskaźnika wpływa na ratę od właściwego okresu.
4. Nadpłata w trybie obniżenia raty zmienia kolejne raty, a w trybie skrócenia
   okresu zmniejsza liczbę rat.
5. Suma części kapitałowych po zaokrągleniu równa się kwocie kredytu.

## Walidacja typów i buildu

```powershell
npm run typecheck
npm run build
```

Oba polecenia powinny zakończyć się kodem 0.

## Walidacja endpointu

Uruchom aplikację:

```powershell
npm run dev
```

Otwórz w przeglądarce lub wywołaj z drugiego terminala:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01'
```

Odpowiedź powinna zawierać `raty`, `pierwszaRataGr`, `ostatniaRataGr` i
`sumaOdsetekGr`. Wywołanie z ujemną kwotą powinno zwrócić status 400 oraz pole
`blad` wskazujące parametr.

## Walidacja ekranu

1. Wprowadź poprawne parametry i wybierz „Policz”.
2. Sprawdź pierwszą ratę, ostatnią ratę, sumę odsetek i tabelę.
3. Zmień typ rat i ponów obliczenie.
4. Dodaj nadpłatę w każdym z dwóch trybów i porównaj wynik z harmonogramem bez
   nadpłaty.
5. Pobierz CSV i sprawdź, czy zawiera wszystkie wiersze tabeli.

Przykład parametru nadpłaty przed zakodowaniem w URL:

```json
[{"miesiac":12,"kwotaGr":500000,"tryb":"obniz_rate"}]
```

Eksport CSV powinien zawierać kolumny raty, nadpłaty i salda oraz osobny wiersz
z sumą odsetek.
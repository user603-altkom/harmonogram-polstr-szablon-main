---

description: "Lista zadań implementacji kalkulatora harmonogramu spłat"
---

# Tasks: Kalkulator harmonogramu spłat

**Input**: Dokumenty projektowe z `/specs/001-kalkulator-harmonogramu/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Testy są wymagane przez specyfikację i konstytucję projektu. Każda
zmiana logiki finansowej zaczyna się od testu domeny, który najpierw ma failować.

**Organization**: Zadania są pogrupowane według historii użytkownika, aby każdą
historię można było wdrożyć i sprawdzić jako niezależny przyrost.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Potwierdzenie istniejącej konfiguracji bez dodawania zależności.

- [X] T001 Potwierdź skrypty `test`, `typecheck`, `build` i istniejące zależności w `package.json`; nie dodawaj nowych pakietów.
- [X] T002 [P] Zweryfikuj identyfikatory POLSTR 1M, WIBOR 3M i kształt serii w `src/dane/wskazniki.ts` oraz `dane/polstr-1m.json` i `dane/wibor-3m.json`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wspólne typy, deterministyczne helpery i szkielet testów domeny.

**CRITICAL**: Ta faza musi zakończyć się przed implementacją którejkolwiek
historii użytkownika.

- [X] T003 Zdefiniuj typy `ParametryKredytu`, `Nadplata`, `Rata` i `Harmonogram` wraz z ograniczeniami pól w `src/domena/harmonogram.ts`: kwoty jako całkowite grosze, `liczbaRat` dodatnia całkowita, `typRat` `rowne` lub `malejace`, `wskaznik` `POLSTR_1M` lub `WIBOR_3M`.
- [X] T004 Dodaj czyste helpery walidacji, zaokrąglania do grosza, wyznaczania daty kolejnej raty i wyboru wartości serii w `src/domena/harmonogram.ts`; nie importuj React, I/O ani zegara systemowego.
- [X] T005 Przygotuj testy domeny i fixture stałej serii wskaźnika w `tests/harmonogram.test.ts`, tak aby kolejne testy mogły przekazywać kontrolowaną stopę `0.0355` bez odczytu danych produkcyjnych.

**Checkpoint**: Typy, helpery i uruchamialny szkielet `tests/harmonogram.test.ts`
są gotowe; implementacja historii może się rozpocząć.

## Phase 3: User Story 1 - Obliczenie harmonogramu kredytu (Priority: P1) 🎯 MVP

**Goal**: Użytkownik podaje podstawowe parametry i otrzymuje poprawny
harmonogram rat równych z podsumowaniem oraz tabelą.

**Independent Test**: Dla kontrolowanej stopy 5,66%, kwoty 400 000 zł i 300 rat
równych pierwsza rata mieści się w tolerancji 0,05 zł od 2 494,72 zł, saldo
końcowe wynosi 0,00 zł, a wynik zawiera wymagane kolumny.

### Tests for User Story 1

- [X] T006 [US1] Napisz failing test liczby kontrolnej raty równej, sumy kapitału, salda końcowego i agregatów w `tests/harmonogram.test.ts`.
- [X] T007 [US1] Dodaj test wyboru POLSTR 1M i WIBOR 3M oraz test walidacji kwoty, liczby rat, marży, daty, typu rat i wskaźnika w `tests/harmonogram.test.ts`.

### Implementation for User Story 1

- [X] T008 [US1] Zaimplementuj walidację parametrów, odsetki proste `saldo * stopa roczna / 12`, ratę równą i końcowe wyrównanie kapitału w `src/domena/harmonogram.ts`.
- [X] T009 [US1] Uzupełnij cienki parser query string i odpowiedzi 200/400 zgodnie z `specs/001-kalkulator-harmonogramu/contracts/harmonogram-api.md` w `app/api/harmonogram/route.ts`; route handler nie może wykonywać obliczeń finansowych.
- [X] T010 [US1] Zbuduj formularz parametrów, przycisk obliczenia, podsumowanie pierwszej i ostatniej raty oraz tabelę wyniku pobieranego z `/api/harmonogram` w `app/page.tsx`.

**Checkpoint**: Historia P1 działa niezależnie dla rat równych i obu wskaźników;
`tests/harmonogram.test.ts` potwierdza liczbę kontrolną.

## Phase 4: User Story 2 - Porównanie rodzajów rat i zmienności wskaźnika (Priority: P2)

**Goal**: Użytkownik może porównać raty równe i malejące oraz zobaczyć wpływ
zmian wartości wskaźnika w kolejnych okresach.

**Independent Test**: Dla tych samych parametrów test pokazuje różnicę między
ratami równymi i malejącymi, zmianę odsetek po dacie nowej wartości wskaźnika
oraz użycie ostatniej wartości po końcu serii.

### Tests for User Story 2

- [X] T011 [US2] Napisz failing test rat malejących, zmiany wskaźnika w trakcie spłaty i użycia ostatniej znanej wartości w `tests/harmonogram.test.ts`.

### Implementation for User Story 2

- [X] T012 [US2] Zaimplementuj raty malejące jako pozostałe saldo podzielone przez pozostałą liczbę rat oraz ponowne wyliczanie rat równych po zmianie stopy w `src/domena/harmonogram.ts`.
- [X] T013 [US2] Uzupełnij sterowanie typem raty i wskaźnikiem, stan wyniku po ponownym obliczeniu oraz prezentację zmiennych rat w `app/page.tsx`.
- [ ] T014 [US2] Uruchom testy historii P1 i P2 oraz sprawdź ręcznie scenariusz zmiany stopy przez `tests/harmonogram.test.ts` i `quickstart.md`.

**Checkpoint**: Historie P1 i P2 działają niezależnie; zmiana typu raty lub
wskaźnika nie zmienia danych wejściowych innych pól.

## Phase 5: User Story 3 - Obsługa nadpłat i eksport wyniku (Priority: P3)

**Goal**: Użytkownik może dodać nadpłaty w dwóch trybach, zobaczyć ich wpływ i
pobrać pełny harmonogram CSV.

**Independent Test**: Nadpłata w trybie „obniż ratę” zmienia kolejne raty bez
zmiany pozostałej liczby rat, tryb „skróć okres” kończy harmonogram wcześniej,
a CSV zawiera wszystkie wiersze tabeli.

### Tests for User Story 3

- [X] T015 [US3] Napisz failing test nadpłaty po racie dla trybu `obniz_rate`, trybu `skroc_okres`, nadpłaty równej saldu i odrzucenia nadpłaty większej od salda w `tests/harmonogram.test.ts`.

### Implementation for User Story 3

- [X] T016 [US3] Zaimplementuj nadpłatę stosowaną po regularnej racie, przeliczenie rat na pozostały okres, skrócenie harmonogramu i ochronę przed ujemnym saldem w `src/domena/harmonogram.ts`.
- [X] T017 [US3] Dodaj parsowanie i walidację URL-encoded JSON parametru `nadplaty` z polami `miesiac`, `kwotaGr` i `tryb` w `app/api/harmonogram/route.ts`.
- [X] T018 [US3] Dodaj interfejs listy nadpłat, wybór trybu, komunikaty błędów i stan pusty w `app/page.tsx`.
- [X] T019 [US3] Dodaj eksport CSV po stronie przeglądarki z nagłówkami i wszystkimi wierszami `raty` w `app/page.tsx`.

**Checkpoint**: Wszystkie trzy historie działają, a scenariusze nadpłat nie
naruszają sumy kapitału ani salda końcowego.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Weryfikacja całości, dokumentacji i bramek jakości.

- [X] T020 [P] Zaktualizuj `specs/001-kalkulator-harmonogramu/quickstart.md` o rzeczywiste przykłady wyników i ewentualne różnice ujawnione podczas implementacji.
- [X] T021 Uruchom pełny zestaw testów domeny `npm test` dla `tests/harmonogram.test.ts` i napraw regresje bez zmiany wymagań specyfikacji.
- [X] T022 Uruchom sprawdzenie typów `npm run typecheck` zgodnie z `tsconfig.json` i usuń błędy TypeScript bez użycia `any` ani `@ts-ignore`.
- [X] T023 Uruchom produkcyjny build `npm run build` zgodnie z `next.config.ts` oraz wykonaj scenariusze z `specs/001-kalkulator-harmonogramu/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Brak zależności; T001 i T002 mogą wykonać się równolegle.
- **Foundational (Phase 2)**: Zależy od Setup; T003 i T004 są sekwencyjne w jednym module, T005 przygotowuje testy po szkielecie typów.
- **User Stories (Phase 3-5)**: Każda zależy od Foundational; P2 zależy od P1, a P3 zależy od P1 i P2, ponieważ rozszerza ten sam harmonogram.
- **Polish (Phase 6)**: Zależy od ukończenia wszystkich wybranych historii.

### User Story Dependencies

- **US1 (P1)**: Zależy tylko od Phase 2; stanowi samodzielne MVP.
- **US2 (P2)**: Zależy od US1, ponieważ rozszerza implementację harmonogramu o drugi typ rat i zmienne stopy.
- **US3 (P3)**: Zależy od US1 i US2, ponieważ nadpłaty zmieniają już obliczony harmonogram obu typów rat.

### Parallel Opportunities

- T001 i T002 mogą działać równolegle.
- Po T003 można niezależnie przygotować testy danych w T005 i dokumentację kontraktu; nie oznaczam tej dokumentacji jako zadania, bo artefakt już istnieje.
- W US1 T006 i T007 dotyczą tego samego pliku testowego, więc wykonuje się je sekwencyjnie; po nich T008, T009 i T010 dotyczą różnych plików i mogą być rozdzielone po ustaleniu typów domeny.
- W US2 T011 musi poprzedzać T012; T013 można rozpocząć po ustaleniu kształtu wyniku.
- W US3 T015 musi poprzedzać T016; po T016 T017, T018 i T019 dotyczą osobnych plików i mogą być wykonywane równolegle.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Wykonaj Phase 1 i Phase 2.
2. Wykonaj Phase 3 z testami failing-first.
3. Zatrzymaj się na checkpointcie i zweryfikuj liczbę kontrolną oraz endpoint.
4. Dopiero po akceptacji rozpocznij P2 i P3.

### Incremental Delivery

1. Phase 1-2 daje wspólny fundament bez zachowania biznesowego.
2. US1 daje działający kalkulator rat równych jako MVP.
3. US2 dodaje raty malejące i zmianę wskaźnika bez naruszania US1.
4. US3 dodaje nadpłaty i eksport CSV.
5. Phase 6 zamyka testy, typowanie, build i quickstart.

### Parallel Team Strategy

Po Phase 2 jeden wykonawca powinien prowadzić domenę i testy, a drugi może
przygotować `app/page.tsx` na podstawie ustalonych typów oraz kontraktu. Prace
nad US2 i US3 pozostają sekwencyjne, ponieważ modyfikują wspólny algorytm domeny.

## Notes

- Każde zadanie ma checkbox, sekwencyjny identyfikator, właściwą etykietę
  historii tam, gdzie jest wymagana, oraz konkretną ścieżkę pliku.
- `dane/*.json` są tylko wejściem; zadania nie modyfikują tych plików.
- Po zakończeniu każdej fazy należy zatrzymać się i zweryfikować checkpoint,
  zgodnie z konstytucją projektu.

## Phase 7: Convergence

**Purpose**: Domknięcie luk wykrytych po porównaniu implementacji z wymaganiami.

- [X] T024 [US2] Zaimplementuj raty malejące zamiast traktowania `typRat=malejace` jak rat równych oraz dodaj test failing-first w `src/domena/harmonogram.ts` i `tests/harmonogram.test.ts` per FR-003 / US2-AC1 (contradicts).
- [X] T025 [US2] Dodaj testy zmiany wartości wskaźnika w trakcie spłaty i użycia ostatniej znanej wartości oraz potwierdź prezentację wyniku po ponownym obliczeniu w `tests/harmonogram.test.ts` i `app/page.tsx` per FR-005 / US2-AC2-3 (partial).
- [X] T026 [US3] Zaimplementuj nadpłaty stosowane po racie w trybach `obniz_rate` i `skroc_okres`, z walidacją salda, przeliczeniem rat i testami sumy kapitału w `src/domena/harmonogram.ts` i `tests/harmonogram.test.ts` per FR-008–FR-010 / US3-AC1-2 (missing).
- [X] T027 [US3] Podłącz parametr URL-encoded `nadplaty` do walidacji route handlera i dodaj do formularza listę nadpłat z miesiącem, kwotą oraz trybem w `app/api/harmonogram/route.ts` i `app/page.tsx` per FR-008 / US3-AC1-2 (missing).
- [X] T028 [US3] Dodaj przycisk eksportu CSV zawierający sumę odsetek, nagłówki i wszystkie wiersze `raty` w `app/page.tsx` oraz test scenariusza w `quickstart.md` per FR-013 / US3-AC3 (missing).
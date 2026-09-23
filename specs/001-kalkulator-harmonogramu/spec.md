# Feature Specification: Kalkulator harmonogramu spłat

**Feature Branch**: `001-kalkulator-harmonogramu`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: „Na bazie BRIEF.md przygotuj kalkulator harmonogramu spłat kredytu hipotecznego dla POLSTR 1M i WIBOR 3M.”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Obliczenie harmonogramu kredytu (Priority: P1)

Jako osoba analizująca kredyt chcę podać kwotę, liczbę rat, datę pierwszej
raty, marżę, rodzaj raty i wskaźnik, aby otrzymać kompletny harmonogram spłat
z podziałem każdej raty na kapitał i odsetki.

**Why this priority**: To podstawowa wartość produktu i warunek użyteczności
pozostałych funkcji.

**Independent Test**: Można podać poprawne parametry kredytu i sprawdzić, czy
wynik zawiera wszystkie raty, saldo po każdej racie oraz sumę odsetek.

**Acceptance Scenarios**:

1. **Given** poprawne parametry kredytu i serię POLSTR 1M, **When** użytkownik
   uruchamia obliczenie, **Then** otrzymuje raty z numerem, datą, częścią
   kapitałową, częścią odsetkową, kwotą raty i saldem po spłacie.
2. **Given** poprawne parametry kredytu i serię WIBOR 3M, **When** użytkownik
   uruchamia obliczenie, **Then** harmonogram stosuje wartość wskaźnika
   obowiązującą w danym okresie oraz pokazuje sumę odsetek.
3. **Given** stała stopa roczna 5,66%, kwota 400 000 zł i 300 rat równych,
   **When** użytkownik oblicza harmonogram, **Then** pierwsza rata wynosi
   2 494,72 zł z tolerancją 0,05 zł, a ostatnia rata wyrównuje saldo zgodnie
   z liczbą kontrolną.

---

### User Story 2 - Porównanie rodzajów rat i zmienności wskaźnika (Priority: P2)

Jako osoba porównująca oferty chcę przełączać raty równe i malejące oraz
uwzględniać zmianę wskaźnika w czasie, aby ocenić wpływ tych założeń na koszt
kredytu.

**Why this priority**: Zmienność oprocentowania i rodzaj rat są kluczowymi
różnicami między analizowanymi scenariuszami kredytowymi.

**Independent Test**: Dla tych samych danych wejściowych można wygenerować dwa
harmonogramy, porównać ratę początkową, ratę końcową i sumę odsetek oraz
zweryfikować zmianę oprocentowania po zmianie danych wskaźnika.

**Acceptance Scenarios**:

1. **Given** ten sam kredyt i wybrany typ rat równych albo malejących,
   **When** użytkownik zmienia typ rat, **Then** harmonogram stosuje wybrany
   sposób spłaty i pokazuje inne wartości rat zgodnie z regułami.
2. **Given** seria wskaźnika z nową wartością w trakcie spłaty, **When** termin
   raty przekracza datę zmiany, **Then** odsetki dla tego okresu używają nowej
   wartości wskaźnika.
3. **Given** termin przypadający po ostatnim wpisie serii, **When** obliczany
   jest harmonogram, **Then** używana jest ostatnia znana wartość serii.

---

### User Story 3 - Obsługa nadpłat i eksport wyniku (Priority: P3)

Jako kredytobiorca chcę dodać zaplanowane nadpłaty i wybrać, czy mają obniżyć
przyszłą ratę, czy skrócić okres spłaty, a następnie pobrać wynik, aby
przeanalizować własny scenariusz finansowy poza kalkulatorem.

**Why this priority**: Nadpłaty są ważnym scenariuszem praktycznym, ale zależą
od poprawnego działania podstawowego harmonogramu.

**Independent Test**: Można dodać nadpłatę w każdym z dwóch trybów, sprawdzić
zmianę rat lub liczby rat oraz pobrać tabelę do pliku CSV.

**Acceptance Scenarios**:

1. **Given** nadpłata z trybem „obniż ratę”, **When** użytkownik oblicza
   harmonogram, **Then** przyszłe raty są przeliczone przy zachowaniu
   pozostałego okresu.
2. **Given** nadpłata z trybem „skróć okres”, **When** użytkownik oblicza
   harmonogram, **Then** saldo zostaje spłacone wcześniej, a harmonogram ma
   mniej rat niż scenariusz bez nadpłaty.
3. **Given** wyświetlony harmonogram, **When** użytkownik wybiera eksport,
   **Then** otrzymuje plik CSV zawierający wszystkie wiersze tabeli i sumę
   odsetek.

### Edge Cases

- Kwota kredytu, liczba rat, marża lub kwota nadpłaty nie mogą być ujemne ani
  zerowe tam, gdzie wartość jest wymagana do obliczenia.
- Data pierwszej raty musi mieć format `YYYY-MM-DD` i być poprawną datą.
- Nadpłata nie może przekroczyć bieżącego salda; nadpłata równa saldu kończy
  harmonogram bez ujemnego salda.
- Użytkownik nie może wygenerować wyniku bez wybrania typu raty i wskaźnika.
- Dla brakującej wartości wskaźnika w okresie należy zastosować ostatnią znaną
  wartość, a przed pierwszym wpisem serii zgłosić czytelny błąd danych.
- Zaokrąglenia do grosza nie mogą spowodować, że suma części kapitałowych
  będzie różna od kwoty kredytu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST przyjąć kwotę kredytu, liczbę rat, datę pierwszej
  raty, marżę w punktach procentowych, typ raty i wskaźnik referencyjny.
- **FR-002**: System MUST obsługiwać wskaźniki POLSTR 1M i WIBOR 3M oraz ich
  wartości obowiązujące w kolejnych okresach.
- **FR-003**: System MUST obliczać raty równe i malejące dla tych samych danych
  wejściowych.
- **FR-004**: System MUST obliczać oprocentowanie okresu jako sumę wartości
  wskaźnika i marży.
- **FR-005**: System MUST zmieniać używaną wartość POLSTR 1M co miesiąc, a
  WIBOR 3M co kwartał, zgodnie z datami obowiązywania serii.
- **FR-006**: System MUST naliczać odsetki proste w okresie bez kapitalizacji
  wewnątrz miesiąca.
- **FR-007**: System MUST zaokrąglać wartości pieniężne do grosza i wyrównywać
  ostatnią ratę tak, aby suma części kapitałowych była równa kwocie kredytu.
- **FR-008**: System MUST przyjąć listę nadpłat zawierającą miesiąc, kwotę i
  tryb: „obniż ratę” albo „skróć okres”.
- **FR-009**: System MUST przeliczyć przyszłe raty po nadpłacie w trybie
  „obniż ratę” bez zmiany pozostałej liczby rat.
- **FR-010**: System MUST skrócić okres spłaty po nadpłacie w trybie „skróć
  okres”, bez dopuszczenia do ujemnego salda.
- **FR-011**: System MUST pokazać numer i datę raty, część kapitałową, część
  odsetkową, kwotę raty i saldo po spłacie dla każdego okresu.
- **FR-012**: System MUST pokazać pierwszą ratę, ostatnią ratę i sumę odsetek
  za cały okres.
- **FR-013**: System MUST pozwolić użytkownikowi pobrać pełny wynik w formacie
  CSV przeznaczonym do dalszej analizy.
- **FR-014**: System MUST odrzucić niepoprawne dane wejściowe i wyświetlić
  komunikat wskazujący pole wymagające poprawy.

### Key Entities

- **Parametry kredytu**: Kwota, liczba rat, data pierwszej raty, marża, typ
  raty i wybrany wskaźnik opisujące scenariusz spłaty.
- **Seria wskaźnika**: Wskaźnik referencyjny oraz uporządkowane wartości z datą
  rozpoczęcia obowiązywania każdej wartości.
- **Nadpłata**: Kwota, miesiąc wykonania i sposób zastosowania do dalszego
  harmonogramu.
- **Rata**: Numer, termin, część kapitałowa, część odsetkowa, kwota raty i
  saldo po spłacie.
- **Harmonogram**: Uporządkowany wynik spłaty wraz z pierwszą ratą, ostatnią
  ratą i sumą odsetek.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Użytkownik może wprowadzić poprawne dane i uzyskać pełny
  harmonogram w czasie nieprzekraczającym 3 sekund dla kredytu obejmującego
  600 rat.
- **SC-002**: Dla scenariusza kontrolnego z BRIEF.md pierwsza rata mieści się
  w tolerancji 0,05 zł od wartości 2 494,72 zł.
- **SC-003**: W 100% poprawnych harmonogramów saldo po ostatniej racie wynosi
  0,00 zł, a suma części kapitałowych jest równa kwocie kredytu.
- **SC-004**: Użytkownik może wygenerować scenariusz z ratami równymi,
  malejącymi, zmianą wskaźnika i każdym z dwóch trybów nadpłaty.
- **SC-005**: Użytkownik może pobrać kompletny wynik obejmujący wszystkie raty
  bez ręcznego przepisywania danych.
- **SC-006**: Osoba testująca poprawne i błędne dane rozumie komunikat walidacyjny
  i może poprawić dane bez dodatkowej dokumentacji.

## Assumptions

- Użytkownik korzysta z kalkulatora bez logowania i bez zapisywania scenariuszy
  między sesjami.
- Wartości wskaźników dostarczone w danych projektu są przykładowe i służą do
  obliczeń MVP; kalkulator nie pobiera bieżących notowań z zewnętrznych źródeł.
- Wartość wskaźnika jest używana wprost dla okresu zgodnie z datą obowiązywania;
  MVP nie składa dziennych stawek POLSTR wstecz za okres odsetkowy.
- Odsetki są liczone według konwencji określonej w BRIEF.md: saldo razy roczna
  stopa podzielona przez 12.
- Eksport zawiera wartości już zaokrąglone do grosza i odpowiada dokładnie
  harmonogramowi widocznemu użytkownikowi.
- Obsługa waluty innej niż złoty, wcześniejszego refinansowania, zmian umowy
  i indywidualnych regulaminów bankowych jest poza zakresem MVP.
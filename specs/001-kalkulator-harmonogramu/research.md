# Research: Kalkulator harmonogramu spłat

## Decyzje

### Reprezentacja pieniędzy i zaokrągleń

- **Decision**: Kwoty wejściowe i wynikowe są liczbami całkowitymi w groszach.
  Odsetki i raty są zaokrąglane do pełnego grosza w jednym helperze domenowym.
- **Rationale**: Eliminuje to rozbieżności między obliczeniami, JSON-em, tabelą
  i CSV oraz pozwala sprawdzić, czy suma kapitału dokładnie pokrywa kredyt.
- **Alternatives considered**: Liczby zmiennoprzecinkowe w złotych odrzucono
  z powodu kumulacji błędów; biblioteka money.js odrzucona, bo projekt nie
  dodaje zależności dla zakresu MVP.

### Raty równe przy zmiennej stopie

- **Decision**: Dla każdej raty używa się wskaźnika obowiązującego w jej dacie.
  Gdy zmienia się stopa, rata równa od następnej raty jest przeliczana dla
  bieżącego salda i pozostałej liczby rat.
- **Rationale**: Zachowuje znaczenie raty równej przy zmianie oprocentowania i
  wykorzystuje informację o aktualnym okresie bez składania stawek dziennych.
- **Alternatives considered**: Zamrożenie raty do końca okresu odrzucono, bo
  może pozostawić saldo niezgodne z nową stopą; prognozowanie przyszłych zmian
  odrzucono, bo dane obejmują tylko znane wartości.

### Raty malejące

- **Decision**: Część kapitałowa jest wyznaczana jako pozostałe saldo podzielone
  przez pozostałą liczbę zaplanowanych rat, a odsetki zależą od bieżącej stopy.
  Zaokrąglenie ostatniej części kapitałowej wyrównuje saldo.
- **Rationale**: Zapewnia malejące obciążenie odsetkowe i zachowuje spłatę w
  zaplanowanym terminie także po zmianie stopy lub nadpłacie.
- **Alternatives considered**: Stała część kapitałowa od kwoty początkowej
  odrzucona, bo nadpłata mogłaby wymagać ujemnej albo nadmiernej ostatniej raty.

### Moment i skutki nadpłaty

- **Decision**: Nadpłata wskazana miesiącem jest stosowana po regularnej racie
  tego miesiąca. W trybie „obniż ratę” następna rata równa jest przeliczana na
  pozostały okres; w trybie „skróć okres” zachowana zostaje zasada bieżącej
  raty, a harmonogram kończy się po spłacie salda.
- **Rationale**: Kolejność jest jednoznaczna w tabeli i pozwala pokazać
  nadpłatę jako osobną pozycję lub pole tej samej raty bez ujemnego salda.
- **Alternatives considered**: Nadpłata przed ratą odrzucona, bo opis „miesiąc”
  nie wskazuje dnia i utrudnia powtarzalne obliczenia.

### Daty okresów

- **Decision**: Kolejne raty powstają przez dodanie miesiąca z zachowaniem dnia
  pierwszej raty; dla dni nieistniejących w miesiącu termin jest ostatnim dniem
  tego miesiąca.
- **Rationale**: To przewidywalna konwencja dla dat typu 31. dzień i nie wymaga
  danych dziennych, których MVP nie przechowuje.
- **Alternatives considered**: Stałe 30 dni odrzucono, bo zmieniałoby miesiące
  kalendarzowe i kolidowało z zasadą POLSTR 1M/WIBOR 3M.

### Format nadpłat w kontrakcie wejściowym

- **Decision**: Parametr `nadplaty` jest kodowany jako zakodowany JSON tablicy
  obiektów `{ miesiac, kwotaGr, tryb }`. Brak parametru oznacza pustą listę.
- **Rationale**: Zachowuje jeden endpoint GET, obsługuje dowolną liczbę nadpłat
  i nie wprowadza niejednoznacznego separatora dla listy danych.
- **Alternatives considered**: Powtarzane parametry query odrzucono, bo trudniej
  zagwarantować powiązanie miesiąca, kwoty i trybu oraz walidować częściową listę.

## Wynik badań

Nie pozostały nierozstrzygnięte pytania techniczne. Decyzje są ograniczone do
MVP i mogą zostać zmienione tylko razem z aktualizacją kontraktu oraz testów.
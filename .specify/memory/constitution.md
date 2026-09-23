<!--
Sync Impact Report
- Version change: initial template -> 1.0.0
- Modified principles: none; all five principles established from project conventions
- Added sections: Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: RATIFICATION_DATE requires confirmation of the original adoption date
-->

# Harmonogram na POLSTR Constitution

## Core Principles

### I. Logika domenowa bez efektów ubocznych

Cała logika obliczania harmonogramu MUST znajdować się w czystych funkcjach
modułu domenowego `src/domena/`. Funkcje domenowe MUST być niezależne od React,
I/O, zegara systemowego i warstwy HTTP. Route handler MUST wyłącznie parsować
parametry, wywoływać domenę i serializować wynik. Dzięki temu obliczenia są
deterministyczne, testowalne i możliwe do ponownego użycia.

### II. Jedno źródło prawdy dla danych i zaokrągleń

Dane wskaźników MUST być wczytywane z plików JSON w `dane/` przez moduł
`src/dane/`. Kwoty pieniężne MUST być reprezentowane w groszach jako liczby
całkowite albo przez inną jawnie udokumentowaną konwencję. Zaokrąglanie MUST
odbywać się w jednym określonym miejscu, a końcowa rata MUST wyrównywać sumę
części kapitałowych do kwoty kredytu. Zmniejsza to ryzyko rozbieżności między
obliczeniami, API i ekranem.

### III. Testy najpierw dla reguł finansowych

Każda zmiana logiki obliczeń MUST mieć test Vitest z liczbą kontrolną lub
innym jednoznacznym oczekiwaniem. Minimalny zakres testów obejmuje raty równe
i malejące, zmianę wskaźnika, oba tryby nadpłaty oraz zgodność sumy części
kapitałowych z kwotą kredytu. Testy domeny MUST poprzedzać implementację zmiany,
ponieważ błędny wynik finansowy jest regresją krytyczną dla produktu.

### IV. Jawne kontrakty warstw

Publiczne kontrakty API MUST opisywać stabilne parametry wejściowe i strukturę
wyniku harmonogramu. Ekran MUST pobierać dane przez `GET /api/harmonogram`,
a eksport CSV MUST działać po stronie przeglądarki. Zmiana kontraktu wymaga
aktualizacji wywołującego ekranu, testów i dokumentacji w tym samym zadaniu.
Rozdzielenie domeny, API i interfejsu ogranicza niejawne zależności.

### V. Minimalny zakres, czytelność i weryfikowalność

Implementacja MUST pozostać w zakresie zaakceptowanego MVP i MUST preferować
istniejące wzorce projektu zamiast nowych abstrakcji lub zależności. Uproszczenia
MVP, takie jak użycie wartości wskaźnika wprost z danych bez składania stawek
dziennych, MUST być jawnie opisane. Każda faza MUST kończyć się uruchomieniem
odpowiednich testów, sprawdzenia typów i buildu, aby wynik był możliwy do
zweryfikowania lokalnie i na Vercel.

## Additional Constraints

Projekt MUST używać Next.js App Router, TypeScript strict, Tailwind CSS i Vitest
zgodnie z istniejącą konfiguracją. Kod TypeScript MUST nie używać `any` ani
`@ts-ignore`. Nazwy domenowe, dokumentacja i komentarze MUST być po polsku.
Pliki `dane/` są wejściem testów i MUST NOT być zmieniane bez wyraźnego
polecenia. Moduł domenowy MUST nie importować React ani wykonywać I/O.

## Development Workflow

Praca MUST przebiegać fazami opisanymi w `tasks.md`; po zakończeniu fazy należy
zatrzymać się do akceptacji następnej. Przed zgłoszeniem gotowości MUST zostać
uruchomione `npm test`, `npm run typecheck` i `npm run build`. Pull requesty
MUST przejść przegląd zgodności z tą konstytucją oraz istniejącymi instrukcjami
review. Push do `main` jest wdrożeniem produkcyjnym na Vercel, więc czerwony
build lokalny blokuje zgłoszenie gotowości.

## Governance
Ta konstytucja jest nadrzędnym dokumentem zasad projektu. Zmiana wymaga opisu
powodu, aktualizacji tego pliku, raportu wpływu i przeglądu zgodności. Zasady
techniczne mogą być doprecyzowane w `AGENTS.md`, instrukcjach review i artefaktach
Spec Kit, ale nie mogą pozostawać z nimi w sprzeczności.

Wersjonowanie używa semantycznego schematu MAJOR.MINOR.PATCH. Zwiększenie MAJOR
oznacza usunięcie lub redefinicję zasady w sposób niezgodny wstecz, MINOR oznacza
nową zasadę albo istotne rozszerzenie zakresu, a PATCH oznacza korektę językową
lub doprecyzowanie bez zmiany obowiązku. Każdy przegląd zmian MUST sprawdzić
zasady domeny, testy, kontrakty API, typowanie i bramki jakości.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): potwierdzić datę
przyjęcia konstytucji | **Last Amended**: 2026-09-23

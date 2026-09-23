# Implementation Plan: Kalkulator harmonogramu spłat

**Branch**: `001-kalkulator-harmonogramu` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-kalkulator-harmonogramu/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Zaimplementować deterministyczny kalkulator harmonogramu spłat dla rat równych
i malejących, z POLSTR 1M lub WIBOR 3M, nadpłatami oraz prezentacją i eksportem
wyniku. Logika finansowa pozostaje w czystym module domenowym, dane wskaźników
pochodzą z istniejących plików JSON, route handler udostępnia cienki kontrakt
JSON, a ekran pobiera wynik i pozwala wyeksportować tabelę do CSV.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3, Node.js 22+

**Primary Dependencies**: Next.js 16.3.6, React 19.2.8, Tailwind CSS 4,
Vitest 4.1.11; używać istniejących zależności bez dodawania nowych.

**Storage**: Statyczne serie wskaźników w `dane/*.json`; brak bazy danych i
trwałego zapisu scenariuszy.

**Testing**: Vitest dla domeny i danych, `npm run typecheck`, `npm run build`;
testy domeny z liczbami kontrolnymi.

**Target Platform**: Przeglądarka desktopowa i mobilna oraz środowisko Vercel
uruchamiające aplikację Next.js.

**Project Type**: Aplikacja webowa z publicznym route handlerem JSON.

**Performance Goals**: Wygenerowanie harmonogramu do 600 rat w czasie do 3 sekund
z perspektywy użytkownika.

**Constraints**: Kwoty w groszach jako liczby całkowite, zaokrąglanie w jednym
miejscu, saldo końcowe równe zero, brak efektów ubocznych w domenie, brak
`any` i `@ts-ignore`, brak nowych zależności.

**Scale/Scope**: Jedna strona kalkulatora, dwa wskaźniki, dwa typy rat, dwa tryby
nadpłat, harmonogram do 600 rat i eksport pełnej tabeli do CSV; bez logowania,
zapisywania scenariuszy i bieżących notowań zewnętrznych.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Logika domenowa**: PASS. Obliczenia będą czystymi funkcjami w
  `src/domena/harmonogram.ts`; API i UI nie będą zawierały obliczeń finansowych.
- **Dane i zaokrąglenia**: PASS. Wskaźniki pozostają w `dane/*.json`, kwoty będą
  w groszach, a końcowa rata wyrówna sumę kapitału.
- **Test-first**: PASS. Przed implementacją każdej części domeny powstaną testy
  dla liczby kontrolnej, rat malejących, zmian wskaźnika, nadpłat i sumy kapitału.
- **Kontrakty warstw**: PASS. Kontrakt `GET /api/harmonogram` zostanie opisany
  w `contracts/harmonogram-api.md`, a ekran będzie jego konsumentem.
- **Minimalny zakres i jakość**: PASS. Plan nie dodaje zależności ani funkcji
  poza MVP; końcowe bramki to `npm test`, `npm run typecheck` i `npm run build`.
- **Gate result**: PASS. Brak naruszeń wymagających wpisu w Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── page.tsx
└── api/
  └── harmonogram/
    └── route.ts
src/
├── dane/
│   └── wskazniki.ts
└── domena/
  └── harmonogram.ts
tests/
└── harmonogram.test.ts
dane/
├── polstr-1m.json
└── wibor-3m.json
```

**Structure Decision**: Zachowujemy istniejącą strukturę pojedynczej aplikacji
Next.js. `src/domena/` zawiera typy i czyste obliczenia, `src/dane/` udostępnia
serie wskaźników, `app/api/` mapuje kontrakt HTTP, `app/page.tsx` obsługuje
formularz i tabelę, a `tests/` zawiera testy domeny i danych. Artefakty projektu
pozostają w tym katalogu funkcji.

## Complexity Tracking

Brak naruszeń konstytucji. Nie wprowadzono dodatkowej złożoności.

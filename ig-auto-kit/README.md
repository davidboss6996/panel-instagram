# Automatyczna aktualizacja panelu Instagram

Ten zestaw plików co godzinę pobiera dane z Instagrama przez Apify i zapisuje
je jako `data/stats.json`. Panel (dashboard.html) pobiera ten plik bezpośrednio
z GitHuba i sam się aktualizuje po kliknięciu "Odśwież z API" (albo przy każdym
wejściu na stronę).

## Konfiguracja (jednorazowo, ~10 minut)

1. **Załóż konto na apify.com** (jeśli nie masz) i skopiuj swój API token:
   Settings → Integrations → API token.

2. **Stwórz nowe repozytorium na GitHubie** (może być prywatne) i wrzuć do
   niego całą zawartość tego folderu (`.github/`, `config/`, `data/`, `scripts/`).

3. **Dodaj token jako sekret repozytorium:**
   Settings repo → Secrets and variables → Actions → New repository secret
   Nazwa: `APIFY_TOKEN`, wartość: Twój token z kroku 1.

4. **Edytuj `config/usernames.json`** — wpisz loginy Instagram klientów, których
   chcesz śledzić, np.:
   ```json
   [
     { "handle": "kawiarnia_gorna", "name": "Kawiarnia Górna" },
     { "handle": "salon_beauty_ola", "name": "Salon Beauty Ola" }
   ]
   ```

5. **Odpal workflow ręcznie pierwszy raz:** zakładka Actions → "Update
   Instagram Stats" → Run workflow. Sprawdź log — jeśli któreś pole się nie
   zgadza (Apify czasem zmienia nazwy pól), popraw `scripts/update-instagram-stats.mjs`
   zgodnie z tym, co faktycznie zwraca aktor (zobaczysz to w logu).

6. Jeśli repo jest **publiczne**, plik z danymi będzie dostępny pod adresem:
   ```
   https://raw.githubusercontent.com/TWOJ-LOGIN/TWOJE-REPO/main/data/stats.json
   ```
   Wklej ten URL w ustawieniach panelu (przycisk "⚙ Źródło danych") i kliknij
   "Odśwież z API".

   Jeśli repo jest **prywatne**, `raw.githubusercontent.com` będzie wymagać
   tokena — najprościej wtedy zrobić repo publiczne tylko dla pliku danych,
   albo hostować `stats.json` np. na GitHub Pages (Settings → Pages → wskaż
   folder `data`).

## Ograniczenia, o których warto wiedzieć

- Instagram pokazuje liczbę wyświetleń tylko dla reelsów/wideo — zwykłe
  zdjęcia jej nie mają. "Views last24h" to suma wyświetleń reelsów wrzuconych
  w ostatnie 24h, nie każdego posta.
- Status "banned" jest wykrywany pośrednio — jeśli Apify nie zwróci danych
  dla danego loginu (konto usunięte/zawieszone/zmieniona nazwa), oznaczamy je
  jako "banned". To przybliżenie, warto zerknąć ręcznie przy alarmach.
- Koszt: Instagram Profile Scraper to ok. $1,60 za 1000 wywołań — dla np. 50
  kont odświeżanych co godzinę to grosze miesięcznie, ale pilnuj limitu w
  Apify Console (Max cost per run).

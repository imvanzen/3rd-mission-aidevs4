# Agent instructions: machine verification

## Task
Pass verification by answering 4 questions using a knowledge-base API. The verifier treats you as an automaton; you must complete the flow within **15 seconds** of receiving the questions (token expires after 15s).

**Base URL:** `https://story.aidevs.pl`

---

## Success criteria
- **POST** answers with the token **before the token expires** (within 15 seconds of the GET that returned it).
- **POST** body is accepted and verification returns success (e.g. status `CORRECT`/`OK`).

---

## Steps (in order)

1. **GET** `/api-weryfikacja`  
   - Obtain: `pytania` (array of 4 questions), `token` (valid 15s).  
   - Start the 15-second countdown from this response.

2. **For each question (or as needed):**  
   **GET** `/api-wiedza/{query}`  
   - `{query}` = keyword(s) derived from the question.  
   - Use the response as hints to form the answer.

3. **Before 15s elapsed:**  
   **POST** `/api-weryfikacja`  
   - Body (JSON):  
     `{"odpowiedzi": ["answer1", "answer2", "answer3", "answer4"], "token": "<token from step 1>"}`  
   - `odpowiedzi` must match the **order** of `pytania`.  
   - Use the same token received in step 1.

---

## API summary

| Method | Path              | Purpose                          |
|--------|-------------------|----------------------------------|
| GET    | `/api-weryfikacja` | Get 4 questions + 15s token      |
| GET    | `/api-wiedza/{query}` | Knowledge/hints for keyword   |
| POST   | `/api-weryfikacja` | Submit `odpowiedzi` + `token`   |

**Constraint:** Token expires 15 seconds after generation; submit the POST within that window.

---

## Constraints & API behaviour

- **Rate limiting (GET `/api-wiedza/{query}`)**  
  The knowledge endpoint is rate-limited. Expect waits (e.g. several seconds) between requests. Implement delays or backoff between hint requests so the full flow (4 hints + answers + POST) still fits within the 15s token window. Handle `429 Too Many Requests` if returned.

- **200 OK with no useful hint**  
  A hint request can return `200 OK` and a body indicating no match, e.g.  
  `{"message": "Nie udało się dopasować żadnej podpowiedzi (hint) do podanego słowa kluczowego.", "query": "..."}`.  
  Do not assume success from status alone; parse the response body and treat “no hint” as an empty hint and continue.

- **404 Not Found on hints**  
  Many keyword queries to `/api-wiedza/{query}` return `404`. Not every keyword has a hint URL. Handle 404 gracefully (e.g. treat as no hint) and continue; do not treat it as a fatal error.

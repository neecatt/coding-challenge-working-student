# Repository‑Erklärung (für Reviewer:innen)

Dieses Dokument richtet sich **nicht** an die Kandidat:innen, sondern an diejenigen, die die Challenge auswerten.

## Struktur

```text
.
├── README.md                # Aufgabenstellung für Kandidat:in
├── backend/                 # Express‑API (noch ohne DB)
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── ...
├── frontend/                # React‑App (Vite)
│   ├── src/
│   │   └── App.jsx
│   └── package.json
├── db/
│   └── schema.sql           # 2 Tabellen
└── docs/
    └── repo-explanation.md  # dieses Dokument
```

### Prüfkriterien

| Kriterium                   | Gewichtung | Hinweise |
|-----------------------------|-----------:|----------|
| DB‑Design & Migrations      | 30 % | saubere Migration, Foreign Keys, Indexe |
| API‑Design & Tests          | 30 % | REST‑Konventionen, Statuscodes, Unit‑Tests |
| Security & Best Practices   | 25 % | Auth, Rate‑Limit, Helmet, OWASP Top 10 |
| Code‑Qualität & Clean Code  | 15 % | Struktur, Naming, Comments, Lint |

### Schnell‑Setup für Review

```bash
# Backend + DB hochfahren
docker compose up -d db api

# Seed laufen lassen
docker exec -it api npm run migrate
```

---

Bei Fragen einfach an das Hiring‑Team wenden.

# NDAP Dashboard Website

A lightweight dashboard website that presents NDAP-style data in KPI cards, ranked bars, and a preview table.

## Features

- Dashboard layout with summary KPI cards.
- Visual ranking by year and state.
- Load data from:
  - a CSV URL
  - a local CSV file upload
- Built-in sample data for quick preview.

## CSV format

Use a CSV with headers:

```csv
state,year,indicator,value
```

## Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

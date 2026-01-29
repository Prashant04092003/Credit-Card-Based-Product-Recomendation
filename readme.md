# Credit Card Analytics Dashboard – Engineering Stack

This repository contains the **engineering implementation** of a credit card analytics platform designed to deliver portfolio-level insights through a clean, API-driven system.

The focus of this codebase is **system design, backend/frontend integration, and explainable AI delivery**.  
All **data science, modeling, and experimentation workflows are intentionally out of scope** for this README and are maintained separately.

---

## Project Scope

### What This Repository Covers
- Flask-based backend APIs for analytics delivery
- Streamlit-based interactive dashboard
- Google Gemini integration for narrative business insights
- API-first communication between frontend and backend
- Production-style separation of concerns

### What This Repository Does NOT Cover
- Model training or experimentation
- Feature engineering notebooks
- Offline evaluation or research workflows
- Model selection or hyperparameter tuning

Those components exist as a separate data science layer and are deliberately excluded from this engineering documentation.

---

## System Overview

The application follows a **service-oriented architecture** designed for clarity, scalability, and explainability.

- **Streamlit Frontend**
  - Consumes analytics and insights via APIs
- **Flask Backend APIs**
  - Owns aggregation, business logic, and AI execution
- **Pre-aggregated Metrics & Business Logic**
  - Ensures consistent, explainable inputs
- **Gemini LLM (Narrative Insights Only)**
  - Produces human-readable interpretations

  ## Repository Structure

The repository is organized to clearly separate engineering concerns from data science workflows.



---

## Engineering Boundaries

This repository intentionally enforces **clear boundaries** between engineering and data science:

- **Frontend**
  - Responsible only for visualization and user interaction
  - Never performs business logic or aggregation
  - Never calls LLMs directly

- **Backend**
  - Owns all computation, aggregation, and metric preparation
  - Serves JSON-only APIs
  - Acts as the single execution layer for Gemini LLM calls

- **LLM Layer**
  - Isolated inside `app/llm`
  - Receives only pre-aggregated metrics
  - Produces **narrative insights only**
  - Does not influence decisions or outputs programmatically

- **Data Science Layer**
  - Exists outside the engineering flow
  - Produces datasets and models consumed by the backend
  - Not required to run the application

---

## Why This Structure Matters

This structure mirrors real-world analytics platforms where:

- Dashboards are **consumers**, not calculators
- APIs are the **source of truth**
- AI systems are **explainers**, not decision-makers
- Modeling workflows remain independent of production systems

The result is a system that is:
- Easier to reason about
- Easier to debug
- Easier to evaluate in interviews
- Easier to extend without breaking assumptions

## Setup & Running the Engineering Stack

This section describes how to run the **engineering system only** — backend APIs, frontend dashboard, and Gemini LLM integration.

Data science notebooks, offline modeling, and experimentation workflows are **not required** to run this application.

---

## Prerequisites

- Python **3.10 or higher**
- `pip` or `conda`
- Google Gemini API key
- Internet access (for Gemini API calls)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd credit-card-recommendation

2. Create a Virtual Environment (Recommended)

Using venv

python -m venv venv
source venv/bin/activate      # macOS / Linux
venv\Scripts\activate         # Windows

Using conda

conda create -n creditcard python=3.10
conda activate creditcard
3. Install Engineering Dependencies
pip install -r requirements.txt

This installs only the engineering stack dependencies (Flask, Streamlit, APIs, Gemini).

Data science dependencies are intentionally separated into
requirements-ds.txt and are not required to run the system.

Environment Configuration

Create a .env file in the project root:

GEMINI_API_KEY=your_google_gemini_api_key

The backend automatically loads environment variables at startup.

Running the Backend (Flask)

From the project root:

python app/app.py

The backend runs on:

http://127.0.0.1:5050

Responsibilities of the backend:

Serve all KPIs and chart-ready data

Execute business logic and aggregation

Handle all Gemini LLM calls

Act as the single source of truth

Running the Frontend (Streamlit)

Open a new terminal with the same environment activated:

streamlit run frontend/streamlit_app.py

The Streamlit dashboard will open automatically in your browser.

Runtime Flow
Streamlit Frontend
↓
Flask Backend APIs
↓
Pre-aggregated Metrics & Business Logic
↓
Gemini LLM (Narrative Insights Only)

Key guarantees:

Frontend never computes metrics

Frontend never calls Gemini directly

Backend owns all computation and AI execution

LLM outputs are interpretive only, not decision-making

Common Issues
Gemini API Errors

Verify the API key is valid

Ensure .env exists and is loaded

Restart the backend after changes

Port Already in Use

Stop existing Flask processes

Or change the port in app/app.py

Streamlit UI Not Updating

Hard refresh the browser

Restart Streamlit

Notes

This setup mirrors real production analytics systems, where:

Dashboards are consumers, not calculators

APIs are the system of record

AI systems explain outcomes, not enforce them


## Dependency Management & Requirements Strategy

This repository intentionally separates **engineering dependencies** from **data science / modeling dependencies** to maintain clarity, reproducibility, and production realism.

---

## Why Two Requirements Files Exist

### `requirements.txt` — Engineering Stack

This file contains **only what is required to run the application**:

- Flask backend APIs
- Streamlit frontend
- API communication
- Gemini LLM integration
- Visualization libraries needed at runtime

This ensures that:
- The application is lightweight and fast to set up
- Production environments are not polluted with research-only packages
- Reviewers can run the system without installing ML toolchains

**Use this file to run the app.**

```bash
pip install -r requirements.txt


Design Rationale

This separation reflects how real-world analytics platforms operate:

Engineering systems prioritize stability, speed, and minimal dependencies

Data science workflows prioritize flexibility, experimentation, and tooling

The two evolve at different speeds and should not be tightly coupled

By separating dependencies:

Production systems remain clean and reproducible

Data scientists can iterate without affecting runtime stability

Interview reviewers can clearly see architectural intent
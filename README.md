# The Enigma Shelf

Full-stack repository: **Angular 21** SPA in [`project/`](project/) and a **Node.js + Express + MongoDB** REST API in [`rest-api/`](rest-api/). This file is the **single** project documentation (Functional Guide + how to run + details for both parts).

| Folder | Role |
|--------|------|
| [`project/`](project/) | Angular front-end |
| [`rest-api/`](rest-api/) | Express + Mongoose back-end |

---

## Functional Guide

### 1. Purpose

**The Enigma Shelf** is a community book catalogue. Anyone can browse titles and open a book’s details. Signed-up users add books to the shared catalogue, manage **only their own** entries, like and rate other people’s books, and maintain a profile. There is a **My books** area for the owner, with filters and an optional **unread** flag on owned titles.

### 2. Main user flows

**Guest** — Uses **Home** and the **Books** catalogue, opens **book details**, reads **About**. From the header: **Login** / **Register**. Search by title or author from the navbar (URL query `search`) on supported views (e.g. home, books, my-books).

**Signed-in user** — After login, sees **Add Book**, **My books**, **Account**, and **Logout**. Can **create** a book, **edit** or **delete** **only their own** books (from details), **like** and **rate** in the community (with UI/API rules, e.g. cannot like your own book). The session is restored after a **full page refresh** (profile loaded from the server). Protected routes are unavailable without login; login/register are not shown for users who are already authenticated.

### 3. Core features (front-end)

- **Routing** — Separate screens for home, books, detail, add/edit, my-books, account, login, register, about; unknown paths → **not found** page.
- **Catalogue and detail** — List with filters (genre, series, etc.) and search; single book with cover, description, owner, likes, community rating.
- **Book CRUD** — Create and edit via forms; delete from the detail view (with confirmation). Guests cannot reach create/edit flows for protected data.
- **Profile** — View/update email and username.
- **Notifications** — Success/error feedback for requests and validation.

### 4. How the user interacts

Navigation from the header and in-page links; forms with validation and field-level messages; book actions (like, rate, edit, delete, unread) depending on permissions; search with **Enter** in the header field, which updates query parameters in the URL.

---

## Quick start

1. **API** (from repo root): `cd rest-api` → create `.env` (see **REST API** below) → `npm install` → `npm start` → default **http://localhost:3000**.
2. **Angular** (from repo root): `cd project` → `npm install` → `npm start` → **http://localhost:4200**.

The SPA expects the API at **http://localhost:3000** (`AuthService` / `BooksService` under `project/src/app/core/services/`). Start the API before using login, books, or profile flows.

---

## Angular front-end (`project/`)

Angular **21** SPA for browsing books, accounts, and community features.

### Prerequisites

- **Node.js** (LTS recommended; match Angular 21 requirements)
- **npm** (see `packageManager` in `project/package.json`)

### Install

```bash
cd project
npm install
```

### Run the development server

```bash
npm start
```

or:

```bash
npx ng serve
```

Open **http://localhost:4200/**. The app reloads when you change source files.

### Build

```bash
npm run build
```

Development build (faster, less optimized):

```bash
npx ng build --configuration=development
```

Output is under `project/dist/`.

### Tests

```bash
npm test
```

### Project layout (`project/src/app/`)

| Area | Path | Role |
|------|------|------|
| **Features** | `features/` | Route-level screens (home, books, auth, profile, about, …) |
| **Core** | `core/` | Singleton services, guards, shared UI utilities |
| **Layout** | `layout/` | Header, footer, global chrome |
| **Shared** | `shared/` | Interfaces, pipes, validators used across features |

Routing is defined in `project/src/app/app.routes.ts`.

### NPM scripts (`project/`)

| Script | Command |
|--------|---------|
| `start` | `ng serve` |
| `build` | `ng build` |
| `watch` | `ng build --watch --configuration development` |
| `test` | `ng test` |

### Tech stack

- Angular 21 (standalone components, `project/src/app/app.config.ts`)
- RxJS
- Reactive forms where forms are used

### More help

- [Angular documentation](https://angular.dev)
- [Angular CLI reference](https://angular.dev/tools/cli)

---

## REST API (`rest-api/`)

Express + MongoDB (**Mongoose**) API consumed by the Angular app. JSON over HTTP; authentication uses a **JWT in an httpOnly cookie** (`auth-cookie`).

### Prerequisites

- **Node.js** (LTS recommended)
- **MongoDB** locally or a **MongoDB Atlas** connection string

### Setup

```bash
cd rest-api
npm install
```

Create **`rest-api/.env`** (ignored by Git). Examples:

**Local MongoDB**

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/book-store
COOKIESECRET=your-long-random-secret
```

**MongoDB Atlas** (replace placeholders — never commit real passwords)

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/book-store?retryWrites=true&w=majority
COOKIESECRET=your-long-random-secret
```

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` (default) or `production` |
| `PORT` | Server port (default **3000**) |
| `MONGO_URI` | Local `mongodb://...` or Atlas `mongodb+srv://...`. In development, defaults to `mongodb://localhost:27017/book-store` if unset |
| `COOKIESECRET` | Secret for signing cookies (set your own in production) |

### Run

```bash
npm start
```

Uses `node .` (`package.json` → `main`: `index.js`). You should see: **Listening on port 3000!** (or your `PORT`).

### Base URL

All routes: **`http://localhost:<PORT>/api`**

### HTTP routes (overview)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/register` | Register; sets auth cookie |
| `POST` | `/api/login` | Login; sets auth cookie |
| `POST` | `/api/logout` | Logout |
| `GET` | `/api/users/profile` | **Auth** — current user |
| `PUT` | `/api/users/profile` | **Auth** — update profile |
| `GET` | `/api/books` | List books |
| `POST` | `/api/books` | **Auth** — create book |
| `GET` | `/api/books/:bookId` | Book details |
| `PUT` | `/api/books/:bookId` | **Auth** — update book |
| `DELETE` | `/api/books/:bookId` | **Auth** — delete book |
| `PUT` | `/api/books/:bookId/like` | **Auth** — toggle like |
| `PUT` | `/api/books/:bookId/vote` | **Auth** — rate book |

**Auth** = valid JWT in `auth-cookie` (browser: `credentials: 'include'` / Angular `withCredentials: true`).

### Data model (summary)

- **User** — Authentication account; linked to owned books.
- **Book** — Title, author, genre, optional series/summary, required cover **imageUrl**, **owner**, **likes**, **votes** (user + score 1–5), **communityRating**, **unread**, timestamps.

### CORS

Development allows origins such as **`http://localhost:4200`**. Cookies need matching CORS + credentials on the client.

### API project layout (`rest-api/`)

| Path | Role |
|------|------|
| `index.js` | Entry: env, DB connect, Express listen |
| `config/` | DB, Express middleware, environment |
| `router/` | Routes mounted under `/api` |
| `controllers/` | Handlers |
| `models/` | Mongoose models |
| `utils/` | JWT, auth middleware, errors |

### NPM scripts (`rest-api/`)

| Script | Command |
|--------|---------|
| `start` | `node .` |
| `test` | Placeholder (not implemented) |

### Production notes

- Set `MONGO_URI` and a strong `COOKIESECRET`.
- In `rest-api/config/config.js`, `production.origin` should list your deployed Angular origin for CORS (configure as needed).

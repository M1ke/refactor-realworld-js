# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start with nodemon (auto-reload on change)
npm start          # start with node (production)
```

No test suite exists — `npm test` exits with an error.

## Environment Variables

Requires a `.env` file at the project root:
- `DATABASE_URI` — MongoDB connection string
- `ACCESS_TOKEN_SECRET` — secret used to sign/verify JWTs
- `PORT` — optional, defaults to 4000

## Architecture

This is a [RealWorld](https://github.com/gothinkster/realworld) spec REST API backend. The entry point is `api/index.js`, which connects to MongoDB and starts Express. It is deployed to Vercel as a serverless function (see `vercel.json`).

Request flow: `api/index.js` → `routes/` → `controllers/` → `models/`

### Authentication

JWTs use the `Token <token>` header format (not `Bearer`). Two middleware variants exist:
- `middleware/verifyJWT.js` — required auth; sets `req.userId`, `req.userEmail`, `req.userHashedPwd`
- `middleware/verifyJWTOptional.js` — optional auth; additionally sets `req.loggedin` (boolean)

### Models and business logic

Models carry significant business logic as instance methods:

- **User** (`models/User.js`): `toUserResponse()`, `toProfileJSON(user)`, `generateAccessToken()`, `follow/unfollow(id)`, `isFollowing(id)`, `favorite/unfavorite(id)`, `isFavourite(id)`. Favorites and following are stored as arrays of ObjectIds on the User document.
- **Article** (`models/Article.js`): `toArticleResponse(user)` (async — fetches author), `updateFavoriteCount()`, `addComment/removeComment(commentId)`. Slug is auto-generated from title via a `pre('save')` hook using `slugify`. Comments are stored as an array of ObjectIds on the Article document.
- **Comment** (`models/Comment.js`): `toCommentResponse(user)` (async — fetches author).
- **Tag** (`models/Tag.js`): stores tag names with an array of referencing article ObjectIds.

### Key design notes from README

- A single `ACCESS_TOKEN_SECRET` is used for all accounts — if leaked, tokens can be forged.
- Favorites and comments are stored as embedded arrays (not separate join collections) — not ideal for scalability.
- Usernames are case-sensitive in behavior but stored lowercase in the DB.

### CORS

Allowed origins are defined in `config/allowedOrigins.js`: `localhost:3000`, `localhost:4200`, and two external production domains.
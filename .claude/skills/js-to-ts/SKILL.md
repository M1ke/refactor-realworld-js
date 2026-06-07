---
name: js-to-ts
description: Converts a JavaScript (.js) file to TypeScript (.ts) in-place, replacing the original file. Use this skill whenever the user asks to convert, migrate, or transform a specific JavaScript file to TypeScript — including explicit invocations like "/js-to-ts", command-style requests like "convert utils/helper.js to TypeScript", or conversational mentions like "I want to add types to this file" or "migrate this to TS". Always use this skill rather than ad-hoc conversion when TypeScript migration is the goal, even if the user doesn't use the exact phrase "skill".
---

# JavaScript → TypeScript Conversion

You are converting a single `.js` file to `.ts` in-place. The logic stays identical — you are only adding types and making the file valid TypeScript. The `.js` file will be replaced by a `.ts` file.

## Step 1: Resolve direct imports

Parse the target file's `import` and `require` statements. Collect every **local** file reference (skip node_modules and Node built-ins).

For each local import, check whether a `.ts` (or `.tsx`) counterpart exists. If any imported local file is still `.js` with no `.ts` counterpart, **stop and respond**:

> Cannot convert `<filename>.js` yet. Convert these files to TypeScript first, then retry:
> - `relative/path/dep-a.js`
> - `relative/path/dep-b.js`

Only check the direct imports of the target file — do not recurse into their imports. If those dependencies have unconverted deps of their own, the user will encounter those when they convert those files in turn.

## Step 2: Apply types

Follow this hierarchy strictly:

**No `any`.** It silences the compiler without actually typing anything. If the shape is genuinely unknown, use `unknown`.

**Use `unknown` for data that comes from outside the type system:**
- Parsed JSON (`JSON.parse` returns `any` — explicitly annotate as `unknown`)
- `fetch` / HTTP response bodies before parsing
- File reads (`fs.readFile`, `fs.readFileSync`)
- Database query results where the schema isn't statically available
- User-supplied input (CLI args, form values, URL/query params)
- Caught errors in `catch (e)` blocks — type as `unknown`, not `Error`

**After `unknown`, always add a narrowing or assertion step** before the value is used:
- Repeated shapes → define a type guard: `function isUser(val: unknown): val is User { ... }`
- One-off checks → inline guard: `if (typeof val !== 'string') throw new Error('Expected string')`
- Project already uses zod/joi/etc. → parse through the existing schema

**Let TypeScript infer what it can.** Don't annotate variables whose types are obvious from the right-hand side (e.g., `const count = 0`). Do annotate function parameters, return types on exported functions, and anything where inference produces `any` silently.

**Name your shapes.** Define `interface` for entity objects (things that have identity and methods) and `type` for unions, mapped types, and aliases. Don't repeat inline object types — extract them.

**JSDoc types.** If the file has JSDoc `@param` / `@returns` / `@type` annotations, convert them to TypeScript types and remove the now-redundant JSDoc. Keep prose descriptions if they're meaningful.

## Step 3: Module system

Check `package.json` for `"type": "module"` and `tsconfig.json` for the `"module"` compiler option to decide the output format:

- **ESM project**: convert `require()` → `import`, `module.exports` → `export` / `export default`
- **CommonJS project**: keep `require()` and `module.exports` syntax, or convert if the tsconfig targets CommonJS output — either is fine, be consistent with the rest of the codebase
- **Mixed / unclear**: match what neighbouring `.ts` files in the project are doing; note your choice in the report

## Step 4: Replace the file

1. Write the converted content to `<filename>.ts`
2. Delete `<filename>.js`

Run `npm run ts:check` to confirm

## Step 5: Wrap up

Ensure newly created and deleted files are tracked by git. Commit with a straightforward message listing the files converted.

Output a brief list of files converted and highlight any uses of "unknown" type

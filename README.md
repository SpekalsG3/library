# Purpose

This is a tool for personal use. Meaning, if you want a feature implemented or a bug fixed that
wasn't addressed before, see [Contribution](#contribution). I won't be addressing anything
that is out of my personal scope.

## Stateless

Meaning this application itself only uses localStorage to persist data between tabs
and otherwise does not store anything. All data is stored in database you provide.
And database can be managed solely through api requests.

# Running

## Prod

```bash
npm run build
npm run start
```

The rest is in UI.

## Dev

```bash
npm run dev
```

For CLI setup `CLI_DB_OPTIONS` in `.env` (see [.env.example](./.env.example)). Then run:
```bash
npm run migration:init
```

And after you can run any one of these (self-descriptive):
```bash
npm run migration:run
npm run migration:rollback -- --count 1
npm run migration:rollback -- --all
```

You can also spin up local postgres db with:
```bash
docker-compose up -d
```

For SQLite, db at provided path is not required to exist.

# 10 rating scale, no decimals

- 0 - Worst, so bad you don't even know what you watched. 
- 1 - Unbearable, everything makes you hate it.
- 3 - Has a flaw big enough to make it impossible to watch.
- 5 - No feelings, nothing to remember for, neither awful nor awesome.
- 7 - Has something good about it: good idea, character, plot or just vibe.
- 9 - Remarkable, everything has its place. But has a tiny flaw in story-telling, pacing or smth that breaks the magic.
- 10 - No flaws: characters are deep and developed through-out the show, story has no holes, pacing is superb without leaving useless moments.

And everything in between, if you can't decide between the two.

## Shows

Shows support rating per season because that's often where vibe changes.
Final score is calculated as an average of rating per season.

# Contribution

Just submit your PR :)

Only these criterias have to be met:
- Database migrations should only affect the schema. It's okay to update field values
when these fields are added in that migration but never otherwise.
- Don't recreate components. If existing button is not generic enough - fix it and reuse it.
- Don't install trillion of packages for mundane tasks, no `isNumber` shit. It's easy to write it yourself.
If there are unexpected values - it's your fault, fix the source of invalid sources.

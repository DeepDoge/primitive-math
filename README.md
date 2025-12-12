# Primitive Math

Primitive Math is a mathematical system built from first principles. It exposes the **actual computation behind
arithmetic**, instead of hiding it behind symbols, notation, and limits.

It does not invent answers. It shows **what has been computed** and **what is still unresolved**.

Nothing more. Nothing less.

---

## Philosophy

Traditional mathematics relies heavily on notation that hides reality.

When you see:

- `10 / 3 = 3.333...`
- `5 / 0 = undefined`
- `3 - 5 = -2`
- `1.999... = 2`

you are not looking at results — you are looking at **conventions**.

These symbols exist to compress infinite or impossible processes into something finite and convenient.

Primitive Math removes those conventions entirely.

There are no special symbols for:

- infinity
- negative numbers
- repeating decimals
- undefined values
- limits pretending work has finished

There is only:

1. **Work that has completed**
2. **Work that could not be completed**

Nothing else exists.

| Traditional Math | What It Really Means                          |
| ---------------- | --------------------------------------------- |
| `3.333...`       | An operation that never terminates            |
| `1.999... = 2`   | Two different processes treated as equivalent |
| `∞`              | “This keeps going forever”                    |
| `undefined`      | “We stopped reasoning”                        |
| `-2`             | Two decrements that couldn’t be applied       |

Primitive Math refuses to compress unfinished computation into symbols.

---

## The Core Disagreement

Primitive Math exists to end a very specific kind of debate.

Is:

- `1.999...` **actually** equal to `2`?
- Division by zero **fundamentally different** from `10 / 3`?
- A negative number a real value, or bookkeeping?

Traditional math answers these by **changing the rules of equality** and **introducing abstractions**.

Primitive Math answers by refusing to forget the underlying operations.

If two computations are different, they remain different — even if humans decide to treat them as equivalent later.

---

## The Primitives

Everything is built from just two operations:

- **INC** — increment by 1
- **DEC** — decrement by 1 (if possible)

If a decrement cannot be applied, it is **deferred**, not discarded.

That’s the entire system.

There are no hidden operators. There is no algebra underneath. There is no symbolic shortcut.

---

## Derived Operations

All arithmetic emerges from combinations of INC and DEC:

| Operation | Meaning                                                     |
| --------- | ----------------------------------------------------------- |
| `ADD(b)`  | Increment `a` while decrementing `b` until `b` reaches zero |
| `SUB(b)`  | Decrement both `a` and `b` until `b` reaches zero           |
| `MUL(b)`  | Repeated addition                                           |
| `DIV(b)`  | Repeated subtraction                                        |

There are no shortcuts and no special cases.

Every operation either finishes or leaves work behind.

---

## Deferred Operations

When an operation cannot complete, it does not fail.

It defers.

```ts
new N(3n).op(SUB, new N(5n)).toString();
// "0[DEC, DEC]"
```

`3 - 5` does not equal `-2`.

It equals:

- value: `0`
- pending work: two decrements

Negative numbers are not real values. They are **unapplied work**.

Primitive Math keeps that debt explicit instead of inventing a new number system to hide it.

---

## Division and Non-Termination

```ts
new N(10n).op(DIV, new N(3n)).toString();
// "3[ADD(1[DIV(3)])]"
```

There is no `3.333...`.

What actually happened is:

- We successfully subtracted `3` three times
- A remainder of `1` is left
- Dividing that remainder never terminates

Repeating decimals are not numbers. They are **non-terminating processes written as if they were values**.

Primitive Math does not perform that compression.

---

### Division by Zero

```ts
new N(5n).op(DIV, ZERO()).toString();
// "0[ADD(5[DIV(0)])]"
```

“How many times can I subtract zero from five?”

Zero times.

The remainder is still `5`, and the division will never progress.

This is not “undefined”.

It is the **same class of phenomenon** as `10 / 3`:

- the computation does not finish
- the process does not advance
- unfinished work remains

The only difference is that in `10 / 3`, the remainder shrinks — and in division by zero, it does not.

Traditional math treats one as acceptable and the other as forbidden.

Primitive Math treats both as **honest non-termination**.

---

## Usage

```ts
import { ADD, DEC, DIV, INC, MUL, N, ONE, SUB, ZERO } from "./main.ts";

const a = new N(5n);
const b = new N(3n);

a.op(INC); // 6
a.op(DEC); // 4
a.op(ADD, b); // 8
a.op(SUB, b); // 2
a.op(MUL, b); // 15
a.op(DIV, b); // 1[ADD(2[DIV(3)])]

// Chaining
new N(2n).op(ADD, new N(3n)).op(MUL, new N(2n)); // 10

// Inspect unfinished computation
const r = a.op(DIV, b);
if (r.deferred.length > 0) {
	console.log("Computation is incomplete");
}
```

`toString()` shows exactly what exists:

- the computed value
- the remaining work

Nothing is hidden. Nothing is assumed complete.

---

## About Equality

Primitive Math deliberately avoids collapsing different computations into the same value.

`1.999...` and `2` may be _treated_ as equal in traditional math.

They are **not the same computation**.

Primitive Math preserves that distinction.

Equivalence is a _choice_. Computation is a _fact_.

---

## The Point

Mathematics is full of **useful lies**:

- Repeating decimals
- Negative numbers
- Fractions like `1.5`
- Infinity symbols
- “Undefined”

They are not wrong.

They are **compressions** — abstractions layered on top of unfinished computation so humans can stop thinking about it.

Primitive Math does the opposite.

There is no `1.5`.

There is `1` with a pending division by `2`.

There is no `-2`.

There are two decrements that could not be applied.

There is no infinity.

There is only work that finished — and work that never does.

**Traditional math:** “Here’s the answer.” **Primitive Math:** “Here’s what completed — and here’s what didn’t.”

That honesty is the whole point.

# Primitive Math

A mathematical system built from first principles, exposing the raw computation behind arithmetic rather than hiding it
behind notation and abstractions.

## Philosophy

Traditional math gives you answers like `10 / 3 = 3.333...` or `5 / 0 = undefined`. These are **notational
conveniences** — symbols that hide what's really happening.

This system strips away the abstractions and shows arithmetic for what it actually is: **operations that may or may not
terminate**.

| Traditional Math | What It Hides                                      |
| ---------------- | -------------------------------------------------- |
| `3.333...`       | An infinite process represented as a finite symbol |
| `∞`              | "This doesn't stop" dressed up as a number         |
| `undefined`      | "We gave up"                                       |
| `-1`             | A decrement we couldn't apply                      |

Here, there are no such symbols. There's only:

1. **What we've computed so far**
2. **Work still pending**

## The Primitives

Everything is built from just two operations:

- **INC** — Add 1
- **DEC** — Subtract 1 (if possible; otherwise, defer)

That's it. Everything else emerges from these.

## Derived Operations

| Operation | Definition                                          |
| --------- | --------------------------------------------------- |
| `ADD(b)`  | Increment `a` while decrementing `b` until `b` is 0 |
| `SUB(b)`  | Decrement both `a` and `b` until `b` is 0           |
| `MUL(b)`  | Repeated addition                                   |
| `DIV(b)`  | Repeated subtraction                                |

## Deferred Operations

When an operation can't complete, it doesn't fail — it **defers**.

```typescript
const result = new N(3n).op(SUB, new N(5n));
console.log(result.toString()); // "0 [DEC, DEC]"
```

`3 - 5` doesn't equal `-2`. It equals **0 with 2 decrements we couldn't apply yet**.

This is honest. The number `-2` is just notation for "a positive 2 that's owed." The deferred operations are the debt,
kept explicit.

## Division and Infinity

```typescript
const result = new N(10n).op(DIV, new N(3n));
console.log(result.toString()); // "3 [DIV(3) on 1]"
```

There's no `3.333...` here. There's a quotient (3) and unfinished work (divide the remainder of 1).

The "infinite decimal" is a display format humans invented. The reality is: **the operation doesn't terminate**.

### Division by Zero

```typescript
const result = new N(5n).op(DIV, ZERO());
console.log(result.toString()); // "0 [DIV(0) on 5]"
```

"How many times can I subtract 0 from 5?"

Zero times. The remainder (5) is still there. The deferred `DIV(0) on 5` represents an infinite sequence of zeros:
`0.0000...`

This isn't undefined — it's a computation that never finishes. Just like `10 / 3`, except the digits are all zeros.

## Usage

```typescript
import { ADD, DEC, DIV, INC, MUL, N, ONE, SUB, ZERO } from "./main.ts";

// Basic operations
const a = new N(5n);
const b = new N(3n);

a.op(new INC()); // 6
a.op(new DEC()); // 4
a.op(ADD, b); // 8
a.op(SUB, b); // 2
a.op(MUL, b); // 15
a.op(DIV, b); // 1 [DIV(3) on 2]

// Chaining
new N(2n).op(ADD, new N(3n)).op(MUL, new N(2n)); // (2 + 3) * 2 = 10

// toString() shows value and pending work
console.log(a.op(DIV, b).toString()); // "1 [DIV(3) on 2]"
console.log(new N(3n).op(SUB, new N(5n)).toString()); // "0 [DEC, DEC]"
console.log(new N(12n).op(DIV, new N(4n)).toString()); // "3"

// Check for incomplete computation
const result = a.op(DIV, b);
if (result.deferred.length > 0) {
	console.log("Computation has pending work");
}
```

## Run

```bash
deno run main.ts
```

## The Point

Mathematics is full of abstractions that make infinite or impossible things look finite and resolved:

- Repeating decimals
- Infinity symbols
- Negative numbers
- "Undefined"
- Decimal fractions like `1.5`

These are **useful lies**. They let us write things down and move on.

There is no such thing as `1.5`. The `.5` is notation for a deferred operation — it's `1` with `DIV(2)` pending on a
remainder of `1`. We just invented syntax to hide the incomplete computation.

This system refuses to lie. It shows you exactly what's been computed and what hasn't. The deferred operations are the
honest truth — not a symbol pretending the work is done.

**Traditional math:** "Here's the answer: 3.333..."\
**Primitive math:** "Here's what I computed, and here's the work still pending."

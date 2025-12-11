export function repeat<T>(length: number | bigint, value: T): T[] {
	return new Array(Number(length)).fill(value);
}

export abstract class OP {
	public abstract readonly name: string;
	public abstract execute(n: N): N;

	public toString(): string {
		return this.name;
	}
}

export class N {
	public readonly value: bigint;
	public readonly deferred: readonly OP[];

	constructor(value: bigint, deferred: readonly OP[] = []) {
		if (value < 0n) {
			// DEBUG: This should never happen
			throw new Error("Negative values are impossible");
		}
		this.deferred = deferred;
		this.value = value;
	}

	static #evalauateStackDepth = 0;
	public evaluate(): N {
		N.#evalauateStackDepth++;
		if (N.#evalauateStackDepth > 10) {
			// Prevent stack overflow due to excessive recursion
			N.#evalauateStackDepth--;
			return this;
		}
		let current = new N(this.value);
		let ops = this.deferred;
		while (true) {
			const [nextOp, ...restOps] = ops;
			if (!nextOp) {
				N.#evalauateStackDepth--;
				return current;
			}
			current = nextOp.execute(current);
			ops = restOps;
			if (current.deferred.length > 0) {
				// Cannot evaluate further if there are still deferred operations
				N.#evalauateStackDepth--;
				return new N(current.value, [...current.deferred, ...restOps]);
			}
		}
	}

	public op(op: new () => OP): N;
	public op(op: new (other: N) => OP, other: N): N;
	public op(...args: [op: new () => OP] | [op: new (other: N) => OP, other: N]): N {
		const params = { op: args[0], other: args[1] } as
			| { op: new () => OP; other?: undefined }
			| { op: new (other: N) => OP; other: N };

		let operation: OP | undefined;
		if (params.other) {
			operation = new params.op(params.other);
		} else {
			operation = new params.op();
		}

		if (!operation) {
			return this.evaluate();
		}

		return new N(this.value, [...this.deferred, operation]).evaluate();
	}

	public toString(): string {
		if (this.deferred.length > 0) {
			return `${this.value}[${this.deferred.join(", ")}]`;
		}
		return `${this.value}`;
	}
}

export const ZERO = (): N => new N(0n);
export const ONE = (): N => new N(1n);

export class INC extends OP {
	public readonly name = "INC";

	public execute(n: N): N {
		return new N(n.value + 1n, n.deferred);
	}
}

export class DEC extends OP {
	public readonly name = "DEC";

	public execute(n: N): N {
		if (n.value === 0n) {
			return n.op(DEC);
		}
		return new N(n.value - 1n, n.deferred);
	}
}

export class ADD extends OP {
	public readonly name: string;
	private readonly b: N;

	constructor(b: N) {
		super();
		this.b = b;
		this.name = `ADD(${b})`;
	}

	public execute(a: N): N {
		let b = this.b;

		while (b.value > 0n) {
			a = a.op(INC);
			b = b.op(DEC);
		}
		if (b.deferred.length > 0) {
			return a.op(ADD, b);
		}
		return a;
	}
}

export class SUB extends OP {
	public readonly name: string;
	private readonly b: N;

	constructor(b: N) {
		super();
		this.b = b;
		this.name = `SUB(${b})`;
	}

	public execute(a: N): N {
		let b = this.b;
		while (b.value > 0n) {
			a = a.op(DEC);
			b = b.op(DEC);
		}
		if (b.deferred.length > 0) {
			return a.op(ADD, b);
		}
		return a;
	}
}

export class MUL extends OP {
	public readonly name: string;
	private readonly b: N;

	constructor(b: N) {
		super();
		this.b = b;
		this.name = `MUL(${b})`;
	}

	public execute(a: N): N {
		const n = a;
		let counter = this.b;
		while (counter.value > 1n) {
			a = a.op(ADD, n);
			counter = counter.op(DEC);
		}
		return a;
	}
}

export class DIV extends OP {
	public readonly name: string;
	private readonly b: N;

	constructor(b: N) {
		super();
		this.b = b;
		this.name = `DIV(${b})`;
	}

	public execute(a: N): N {
		const b = this.b;
		let quotient = ZERO();
		let remainder = a;
		while (remainder.value >= b.value && b.value > 0n) {
			remainder = remainder.op(SUB, b);
			quotient = quotient.op(INC);
		}
		if (remainder.value === 0n) {
			return quotient;
		}
		return quotient.op(ADD, remainder.op(DIV, this.b));
	}
}

function test(
	label: string,
	n: N,
	condition?: (n: N) => { passed: boolean; reason: string },
): void {
	console.log(`${label} => ${n}`);

	// Test condition if provided
	if (condition) {
		const result = condition(n);
		if (!result.passed) {
			console.error(`  ❌ FAILED: ${result.reason}`);
			return;
		}
	}

	// Test stability: evaluate multiple times and check string representation stays the same
	const original = n.toString();
	let current = n;
	for (let i = 0; i < 3; i++) {
		current = current.evaluate();
		const after = current.toString();
		if (after !== original) {
			console.error(`  ❌ UNSTABLE: After ${i + 1} evaluations, changed from "${original}" to "${after}"`);
		}
	}
}

if (import.meta.main) {
	// Increment/Decrement Tests
	console.log("--- Increment/Decrement ---");

	test("1 + 1", ONE().op(INC), (n) => ({
		passed: n.value === 2n,
		reason: `expected 2, got ${n}`,
	}));

	test("2 - 1", new N(2n).op(DEC), (n) => ({
		passed: n.value === 1n,
		reason: `expected 1, got ${n}`,
	}));

	test("1 - 1", ONE().op(DEC), (n) => ({
		passed: n.value === 0n,
		reason: `expected 0, got ${n}`,
	}));

	test("0 - 1", ZERO().op(DEC), (n) => ({
		passed: n.value === 0n && n.deferred.length === 1,
		reason: `expected 0 with 1 deferred, got ${n}`,
	}));

	// Basic Arithmetic Tests
	console.log("\n--- Basic Arithmetic ---");

	const a = new N(5n);
	const b = new N(3n);

	test("5 + 3", a.op(ADD, b), (n) => ({
		passed: n.value === 8n,
		reason: `expected 8, got ${n}`,
	}));

	test("5 - 3", a.op(SUB, b), (n) => ({
		passed: n.value === 2n,
		reason: `expected 2, got ${n}`,
	}));

	test("5 * 3", a.op(MUL, b), (n) => ({
		passed: n.toString() === "15",
		reason: `expected 15, got ${n}`,
	}));

	test("5 / 3", a.op(DIV, b), (n) => ({
		passed: n.toString() === "1[ADD(2[DIV(3)])]",
		reason: `expected 1 with remainder, got ${n}`,
	}));

	// Edge Cases
	console.log("\n--- Edge Cases ---");

	test("0 + 0", ZERO().op(ADD, ZERO()), (n) => ({
		passed: n.value === 0n,
		reason: `expected 0, got ${n}`,
	}));

	test("5 * 0", a.op(MUL, ZERO())); // Note: quirk due to while loop condition

	test("5 + 0", a.op(ADD, ZERO()), (n) => ({
		passed: n.value === 5n,
		reason: `expected 5, got ${n}`,
	}));

	test("5 - 5", a.op(SUB, new N(5n)), (n) => ({
		passed: n.value === 0n,
		reason: `expected 0, got ${n}`,
	}));

	test("3 - 5", b.op(SUB, a), (n) => ({
		passed: n.value === 0n && n.deferred.length === 2,
		reason: `expected 0 with 2 deferred DECs, got ${n}`,
	}));

	test("5 / 0", a.op(DIV, ZERO()), (n) => ({
		passed: n.value === 0n && n.deferred.length === 1,
		reason: `expected 0 with 1 deferred, got ${n}`,
	}));

	test("0 / 0", ZERO().op(DIV, ZERO()), (n) => ({
		passed: n.value === 0n && n.deferred.length === 0,
		reason: `expected 0 with no deferred, got ${n}`,
	}));

	test("0 / 5", ZERO().op(DIV, a), (n) => ({
		passed: n.value === 0n && n.deferred.length === 0,
		reason: `expected 0 with no deferred, got ${n}`,
	}));

	// Larger Numbers
	console.log("\n--- Larger Numbers ---");

	const ten = new N(10n);
	const four = new N(4n);

	test("10 + 4", ten.op(ADD, four), (n) => ({
		passed: n.value === 14n,
		reason: `expected 14, got ${n}`,
	}));

	test("10 - 4", ten.op(SUB, four), (n) => ({
		passed: n.value === 6n,
		reason: `expected 6, got ${n}`,
	}));

	test("10 * 4", ten.op(MUL, four), (n) => ({
		passed: n.value === 40n,
		reason: `expected 40, got ${n}`,
	}));

	test("10 / 4", ten.op(DIV, four), (n) => ({
		passed: n.value === 2n && n.deferred.length === 1,
		reason: `expected 2 with remainder, got ${n}`,
	}));

	test("12 / 4", new N(12n).op(DIV, four), (n) => ({
		passed: n.value === 3n && n.deferred.length === 0,
		reason: `expected 3 with no remainder, got ${n}`,
	}));

	test("10 / 1", ten.op(DIV, ONE()), (n) => ({
		passed: n.value === 10n,
		reason: `expected 10, got ${n}`,
	}));

	// Chained operations
	console.log("\n--- Chained Operations ---");

	test("(2 + 3) * 2", new N(2n).op(ADD, new N(3n)).op(MUL, new N(2n)), (n) => ({
		passed: n.value === 10n,
		reason: `expected 10, got ${n}`,
	}));

	test("10 - 3 - 2", new N(10n).op(SUB, new N(3n)).op(SUB, new N(2n)), (n) => ({
		passed: n.value === 5n,
		reason: `expected 5, got ${n}`,
	}));

	// Operations with deferred results
	console.log("\n--- Operations with Deferred Results ---");

	// (5 / 2) * 4 = 10 - the whole thing (2.5) gets multiplied by 4
	test("(5 / 2) * 4", new N(5n).op(DIV, new N(2n)).op(MUL, new N(4n)), (n) => ({
		passed: n.value === 10n && n.deferred.length === 0,
		reason: `expected 10, got ${n}`,
	}));

	// (5 / 2) + 1 = 3 with remainder (2 + 1 = 3, remainder still pending)
	test("(5 / 2) + 1", new N(5n).op(DIV, new N(2n)).op(ADD, ONE()), (n) => ({
		passed: n.value === 3n && n.deferred.length === 1,
		reason: `expected 3.5, got ${n}`,
	}));

	// (3 - 5) + 10 = 8 - DECs get consumed by INC during ADD
	test("(3 - 5) + 10", new N(3n).op(SUB, new N(5n)).op(ADD, new N(10n)), (n) => ({
		passed: n.value === 8n && n.deferred.length === 0,
		reason: `expected 8, got ${n}`,
	}));

	// (5 / 0) + 1 = 1 with forever pending DIV
	test("(5 / 0) + 1", new N(5n).op(DIV, ZERO()).op(ADD, ONE()), (n) => ({
		passed: n.value === 1n && n.deferred.length === 1,
		reason: `expected 1 + 5/0, got ${n}`,
	}));

	// (5 / 0) * 0 = 0 with no deferred (anything times 0 is 0)
	test("(5 / 0) * 0", new N(5n).op(DIV, ZERO()).op(MUL, ZERO()), (n) => ({
		passed: n.value === 0n && n.deferred.length === 0,
		reason: `expected 0, got ${n}`,
	}));

	// (10 / 3) + (10 / 3) = 6 with two remainders
	const tenDivThree = new N(10n).op(DIV, new N(3n));
	test("(10 / 3) + (10 / 3)", tenDivThree.op(ADD, tenDivThree), (n) => ({
		passed: n.value === 6n && n.deferred.length === 2,
		reason: `expected 6.66666.. got ${n}`,
	}));

	// (7 / 2) * 2 = 7 - should "undo" the division (3.5 * 2 = 7)
	test("(7 / 2) * 2", new N(7n).op(DIV, new N(2n)).op(MUL, new N(2n)), (n) => ({
		passed: n.value === 7n && n.deferred.length === 0,
		reason: `expected 7, got ${n}`,
	}));

	test("0 / 5 + 3", ZERO().op(DIV, a).op(ADD, new N(3n)), (n) => ({
		passed: n.value === 3n && n.deferred.length === 0,
		reason: `expected 3, got ${n}`,
	}));

	// Multiple increments/decrements
	console.log("\n--- Multiple INC/DEC ---");

	let counter = ZERO();
	for (let i = 0; i < 5; i++) {
		counter = counter.op(INC);
	}
	test("0 incremented 5 times", counter, (n) => ({
		passed: n.value === 5n,
		reason: `expected 5, got ${n}`,
	}));

	for (let i = 0; i < 3; i++) {
		counter = counter.op(DEC);
	}
	test("then decremented 3 times", counter, (n) => ({
		passed: n.value === 2n,
		reason: `expected 2, got ${n}`,
	}));
}

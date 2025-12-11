export function repeat<T>(length: number | bigint, value: T): T[] {
	return new Array(Number(length)).fill(value);
}

export type OP = (n: N) => N;

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

	public clone(): N {
		return new N(this.value, this.deferred);
	}

	public evaluate(): N {
		let value = this.value;
		const exhaust = (ops: readonly OP[]): readonly OP[] => {
			const left: OP[] = [];
			while (ops.length > 0) {
				const [op, ...rest] = ops;
				const result = op(new N(value));
				value = result.value;
				ops = rest;
				left.push(...result.deferred);
			}
			return left;
		};
		const deferred = exhaust(this.deferred);
		return new N(value, deferred);
	}

	public op(op: OP): N;
	public op(op: (other: N) => OP, other: N): N;
	public op(op: OP | ((other: N) => OP), other?: N): N {
		if (other && typeof op === "function" && op.length === 1) {
			const OP = op(other) as OP;
			return new N(this.value, [OP, ...this.deferred, ...other.deferred]).evaluate();
		} else {
			const OP = op as OP;
			return new N(this.value, [OP, ...this.deferred]).evaluate();
		}
	}
}

export const ZERO = (): N => new N(0n);
export const ONE = (): N => new N(1n);

export const INC: OP = (n: N) => {
	return new N(n.value + 1n);
};
export const DEC: OP = (n: N) => {
	if (n.value === 0n) {
		return new N(n.value, [DEC]);
	}
	return new N(n.value - 1n);
};
export const ADD = (b: N): OP => (a: N) => {
	while (b.value > 0n) {
		a = a.op(INC);
		b = b.op(DEC);
	}
	return a;
};
export const SUB = (b: N): OP => (a: N) => {
	while (b.value > 0n) {
		a = a.op(DEC);
		b = b.op(DEC);
	}
	return a;
};
export const MUL = (b: N): OP => (a: N) => {
	const n = a.clone();
	while (b.value > 1n) {
		a = a.op(ADD, n);
		b = b.op(DEC);
	}
	return a;
};
export const DIV = (b: N): OP => (a: N) => {
	let quotient = ZERO();
	let remainder = a.clone();
	while (remainder.value >= b.value && b.value > 0n) {
		remainder = remainder.op(SUB, b);
		quotient = quotient.op(INC);
	}
	return new N(quotient.value, [
		...(remainder.value > 0n ? [DIV(b)] : []),
		...quotient.deferred,
	]);
};

if (import.meta.main) {
	// Increment/Decrement Tests
	let c = ONE();
	c = c.op(INC);
	console.log(`1 + 1 = ${c.value} with deferred ops: ${c.deferred.length}`);
	console.assert(c.value === 2n);

	c = c.op(DEC);
	console.log(`2 - 1 = ${c.value} with deferred ops: ${c.deferred.length}`);
	console.assert(c.value === 1n);
	c = c.op(DEC);
	console.log(`1 - 1 = ${c.value} with deferred ops: ${c.deferred.length}`);
	console.assert(c.value === 0n);

	c = c.op(DEC);
	console.log(`0 - 1 = ${c.value} with deferred ops: ${c.deferred.length}`);
	console.assert(c.value === 0n);
	console.assert(c.deferred.length === 1);

	// Basic Arithmetic Tests
	const a = new N(5n);
	const b = new N(3n);

	const sum = a.op(ADD, b);
	console.log(`5 + 3 = ${sum.value} with deferred ops: ${sum.deferred.length}`);
	console.assert(sum.value === 8n);

	const difference = a.op(SUB, b);
	console.log(`5 - 3 = ${difference.value} with deferred ops: ${difference.deferred.length}`);
	console.assert(difference.value === 2n);

	const product = a.op(MUL, b);
	console.log(`5 * 3 = ${product.value} with deferred ops: ${product.deferred.length}`);
	console.assert(product.value === 15n);

	const quotient = a.op(DIV, b);
	console.log(`5 / 3 = ${quotient.value} with deferred ops: ${quotient.deferred.length}`);
	console.assert(quotient.value === 1n);
	console.assert(quotient.deferred.length === 1);
}

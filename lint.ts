// strict_oop.ts
// Deno custom lint plugin implementing:
// 1. explicit accessibility
// 2. require override
// 3. prevent protected → public widening

// deno-lint-ignore-file no-explicit-any

function findBaseMember(node: any, context: any): any {
	const sourceCode = context.sourceCode;

	const classBody = node.parent;
	if (!classBody || classBody.type !== "ClassBody") return null;

	const classDecl = classBody.parent;
	if (!classDecl || classDecl.type !== "ClassDeclaration") return null;
	if (!classDecl.superClass) return null;

	const superName = classDecl.superClass?.type === "Identifier" ? classDecl.superClass.name : null;

	if (!superName) return null;

	const program = sourceCode.ast;

	const baseDecl = program.body.find(
		(s: any) =>
			s.type === "ClassDeclaration" &&
			s.id &&
			s.id.type === "Identifier" &&
			s.id.name === superName,
	);

	if (!baseDecl) return null;

	const keyName = node.key?.type === "Identifier" ? node.key.name : null;
	if (!keyName) return null;

	return baseDecl.body.body.find(
		(m: any) =>
			(m.type === "MethodDefinition" || m.type === "PropertyDefinition") &&
			m.key?.type === "Identifier" &&
			m.key.name === keyName,
	);
}

const plugin: Deno.lint.Plugin = {
	name: "strict-oop",
	rules: {
		// ---------------------------------------------------------
		// RULE 1: explicit-access-modifiers
		// ---------------------------------------------------------
		"explicit-access-modifiers": {
			create(context) {
				return {
					MethodDefinition(node: any) {
						// ignore #private fields/methods
						if (node.key?.type === "PrivateIdentifier") return;

						// require public/private/protected
						if (!node.accessibility) {
							context.report({
								node,
								message:
									"class members must explicitly use public / protected / private or use #private",
							});
						}
					},

					PropertyDefinition(node: any) {
						if (node.key?.type === "PrivateIdentifier") return;

						if (!node.accessibility) {
							context.report({
								node,
								message:
									"class members must explicitly use public / protected / private or use #private",
							});
						}
					},
				};
			},
		},

		// ---------------------------------------------------------
		// RULE 2: require-override
		// ---------------------------------------------------------
		"require-override": {
			create(context) {
				return {
					MethodDefinition(node: any) {
						const base = findBaseMember(node, context);
						if (!base) return;

						if (!node.override) {
							context.report({
								node,
								message: "overridden members must use the 'override' keyword",
							});
						}
					},

					PropertyDefinition(node: any) {
						const base = findBaseMember(node, context);
						if (!base) return;

						if (!node.override) {
							context.report({
								node,
								message: "overridden members must use the 'override' keyword",
							});
						}
					},
				};
			},
		},

		// ---------------------------------------------------------
		// RULE 3: no-access-widening
		// ---------------------------------------------------------
		"no-access-widening": {
			create(context) {
				return {
					MethodDefinition(node: any) {
						const base = findBaseMember(node, context);
						if (!base) return;

						if (
							base.accessibility === "protected" &&
							node.accessibility === "public"
						) {
							context.report({
								node,
								message: "cannot widen visibility: base is protected, override must also be protected",
							});
						}
					},

					PropertyDefinition(node: any) {
						const base = findBaseMember(node, context);
						if (!base) return;

						if (
							base.accessibility === "protected" &&
							node.accessibility === "public"
						) {
							context.report({
								node,
								message: "cannot widen visibility: base is protected, override must also be protected",
							});
						}
					},
				};
			},
		},
	},
};

export default plugin;

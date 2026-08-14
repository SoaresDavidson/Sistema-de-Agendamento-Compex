import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "postcss";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";

let compiledCss = "";
let sourceCss = "";

const legacyTokens = [
	"text",
	"text-h",
	"bg",
	"border",
	"code-bg",
	"accent",
	"accent-bg",
	"accent-border",
	"social-bg",
	"shadow",
	"sans",
	"heading",
	"mono",
];

function ruleAfter(css, selector, start = 0) {
	const selectorIndex = css.indexOf(selector, start);
	if (selectorIndex < 0) return "";
	const ruleEnd = css.indexOf("}", selectorIndex);
	return css.slice(selectorIndex, ruleEnd + 1);
}

function collectCustomPropertyDefinitions(css, globalOnly = false) {
	const definitions = new Set();

	parse(css).walkDecls(/^--/, (declaration) => {
		if (!globalOnly) {
			definitions.add(declaration.prop);
			return;
		}

		const parent = declaration.parent;
		const isTheme = parent?.type === "atrule" && parent.name === "theme";
		const isRoot =
			parent?.type === "rule" &&
			parent.selectors.some((selector) =>
				[":root", ":host"].includes(selector.trim()),
			);
		let ancestor = parent?.parent;
		let isConditional = false;

		while (ancestor) {
			if (
				ancestor.type === "atrule" &&
				["media", "supports", "container"].includes(ancestor.name)
			) {
				isConditional = true;
				break;
			}
			ancestor = ancestor.parent;
		}

		if (!isConditional && (isTheme || isRoot)) {
			definitions.add(declaration.prop);
		}
	});

	return definitions;
}

function collectUnresolvedCustomPropertyReferences(css) {
	const root = parse(css);
	const globalDefinitions = collectCustomPropertyDefinitions(css, true);
	const registeredWithInitialValue = new Set();
	const unresolved = [];

	root.walkAtRules("property", (registration) => {
		if (registration.nodes?.some((node) => node.prop === "initial-value")) {
			registeredWithInitialValue.add(registration.params.trim());
		}
	});

	root.walkDecls((declaration) => {
		const localDefinitions = new Set();
		declaration.parent?.each?.((node) => {
			if (node.type === "decl" && node.prop.startsWith("--")) {
				localDefinitions.add(node.prop);
			}
		});

		for (const match of declaration.value.matchAll(
			/var\((--[\w-]+)(\s*[,)]?)/g,
		)) {
			const [, token, suffix] = match;
			const hasFallback = suffix.includes(",");

			if (
				!globalDefinitions.has(token) &&
				!localDefinitions.has(token) &&
				!registeredWithInitialValue.has(token) &&
				!hasFallback
			) {
				unresolved.push(token);
			}
		}
	});

	return unresolved;
}

beforeAll(async () => {
	sourceCss = await Promise.all(
		[
			"src/index.css",
			"src/styles/theme.css",
			"src/styles/base.css",
			"src/styles/components.css",
		].map((path) => readFile(resolve(process.cwd(), path), "utf8")),
	).then((files) => files.join("\n"));

	const result = await build({
		configFile: resolve(process.cwd(), "vite.config.ts"),
		logLevel: "silent",
		build: { write: false },
	});
	const builds = Array.isArray(result) ? result : [result];
	const cssAsset = builds
		.flatMap((entry) => entry.output)
		.find((entry) => entry.type === "asset" && entry.fileName.endsWith(".css"));

	if (!cssAsset || typeof cssAsset.source !== "string") {
		throw new Error("Build não produziu artefato CSS textual");
	}
	compiledCss = cssAsset.source;
});

describe("Migração de tokens — contrato CSS", () => {
	it("remove definições e usos dos 13 tokens legados do fonte e do compilado", () => {
		for (const token of legacyTokens) {
			const legacyToken = new RegExp(`--${token}(?![\\w-])`, "g");

			expect(sourceCss.match(legacyToken) ?? []).toHaveLength(0);
			expect(compiledCss.match(legacyToken) ?? []).toHaveLength(0);
		}
	});

	it("remove valores do roxo legado do fonte e do compilado", () => {
		const oldPurple =
			/#(?:aa3bff|a3f)\b|rgba?\(\s*170\s*,\s*59\s*,\s*255(?:\s*,[^)]*)?\)/gi;

		expect(sourceCss).not.toMatch(oldPurple);
		expect(compiledCss).not.toMatch(oldPurple);
	});

	it("resolve botão primário e hover pelo token primary", () => {
		const primaryRules = [
			...compiledCss.matchAll(/\.btn-primary\{[^}]*}/g),
		].map(([rule]) => rule);
		const hoverRules = [
			...compiledCss.matchAll(/\.btn-primary:hover\{[^}]*}/g),
		].map(([rule]) => rule);

		expect(primaryRules.length).toBeGreaterThan(0);
		expect(primaryRules).toEqual(
			expect.arrayContaining([
				expect.stringContaining("background:var(--color-primary)"),
			]),
		);
		expect(hoverRules.length).toBeGreaterThan(0);
		expect(hoverRules).toEqual(
			expect.arrayContaining([
				expect.stringMatching(
					/background:(?:color-mix\([^}]*var\(--color-primary\)|oklch\(41\.28% \.085 185\))/,
				),
			]),
		);
	});

	it("mantém superfícies background e card semanticamente distintas", () => {
		expect(compiledCss).toContain("--color-background:oklch(97.8% .006 210)");
		expect(compiledCss).toContain("--color-card:oklch(100% 0 0)");
		expect(compiledCss).toMatch(
			/body\{[^}]*background-color:var\(--color-background\)/,
		);
		expect(compiledCss).toMatch(
			/\.table-wrap\{[^}]*background:var\(--color-card\)/,
		);
		expect(compiledCss).toMatch(/\.modal\{[^}]*background:var\(--color-card\)/);
	});

	it("usa tokens canônicos em danger, focus, status, tabela e modal", () => {
		expect(compiledCss).toMatch(
			/\.btn-danger\{[^}]*background:var\(--color-destructive\)[^}]*color:var\(--color-destructive-foreground\)/,
		);
		expect(compiledCss).toMatch(
			/\.page-btn\.active\{[^}]*color:var\(--color-card\)/,
		);
		const inputFocusRules = [
			...compiledCss.matchAll(/\.input:focus\{[^}]*}/g),
		].map(([rule]) => rule);
		expect(inputFocusRules).toEqual(
			expect.arrayContaining([
				expect.stringContaining("border-color:var(--color-primary)"),
				expect.stringMatching(/outline:[^}]*var\(--color-primary\)/),
			]),
		);
		expect(compiledCss).toMatch(
			/\.status-agendado\{[^}]*color:var\(--color-primary\)/,
		);
		expect(compiledCss).toMatch(
			/\.status-cancelado\{[^}]*color:var\(--color-destructive\)/,
		);
		expect(compiledCss).toMatch(
			/\.status-concluido\{[^}]*color:var\(--color-muted-foreground\)/,
		);
		expect(compiledCss).toMatch(
			/\.table th,.table td\{[^}]*border-bottom:1px solid var\(--color-border\)/,
		);
		expect(compiledCss).toMatch(
			/\.modal\{[^}]*border:1px solid var\(--color-border\)[^}]*box-shadow:var\(--shadow-modal\)/,
		);
	});

	it("distingue declarações globais de tokens citados em seletor ou media query", () => {
		const fixture = `
			@media style(--media-token: active) {
				[data-token="--selector-token:"] { color: red; }
			}
			@theme { --theme-token: red; }
			:root { --root-token: blue; }
			.local { --local-token: green; color: var(--local-token); }
			.restricted { --restricted-token: orange; }
			.consumer { color: var(--restricted-token); }
		`;

		expect([...collectCustomPropertyDefinitions(fixture, true)].sort()).toEqual(
			["--root-token", "--theme-token"],
		);
		expect(collectUnresolvedCustomPropertyReferences(fixture)).toEqual([
			"--restricted-token",
		]);
	});

	it("compila tokens esperados sem referência sem definição ou fallback", () => {
		const globalDefinitions = collectCustomPropertyDefinitions(
			compiledCss,
			true,
		);
		const unresolved = collectUnresolvedCustomPropertyReferences(compiledCss);

		expect(unresolved).toEqual([]);
		expect(globalDefinitions).toContain("--color-destructive-foreground");
		expect(compiledCss).toContain("--color-primary:oklch(48% .085 185)");
		expect(compiledCss).toContain("--color-destructive:oklch(52% .15 28)");
		expect(compiledCss).toContain(
			"--color-destructive-foreground:oklch(100% 0 0)",
		);
		expect(compiledCss).toContain(
			"--shadow-modal:0 1rem 2.625rem oklch(23% .025 220/.09)",
		);
	});
});

describe("Dashboard — contrato CSS compilado", () => {
	it("centraliza conteúdo de até 1440px com padding de 48px no desktop", () => {
		expect(
			sourceCss.match(/--container-content\s*:\s*1440px/g) ?? [],
		).toHaveLength(1);
		expect(compiledCss.match(/--container-content:1440px/g) ?? []).toHaveLength(
			1,
		);
		expect(sourceCss).not.toMatch(/--content(?:\s*:|\))/);
		expect(compiledCss).not.toMatch(/--content(?:\s*:|\))/);
		expect(compiledCss).toMatch(
			/\.outlet\{[^}]*padding:calc\(var\(--spacing\) \* 12\)[^}]*max-width:var\(--container-content\)[^}]*margin-inline:auto[^}]*}/,
		);
	});

	it("troca padding no breakpoint mobile de 760px", () => {
		expect(compiledCss).toMatch(
			/@media\s*\(width<=760px\)\{[\s\S]*?\.outlet\{padding:22px 16px 40px}/,
		);
	});

	it("mantém sidebar sticky de 248px e grade compacta de 88px até mobile", () => {
		const sidebarRule = ruleAfter(compiledCss, ".dashboard-sidebar{");
		const shellRules = [...compiledCss.matchAll(/\.app-shell\{/g)];
		const sidebarRules = [...compiledCss.matchAll(/\.dashboard-sidebar\{/g)];

		expect(compiledCss).toContain("--spacing-sidebar:15.5rem");
		expect(compiledCss).toMatch(
			/\.app-shell\{[^}]*grid-template-columns:var\(--spacing-sidebar\) minmax\(0,1fr\)[^}]*}/,
		);
		expect(sidebarRule).toContain("position:sticky");
		expect(sidebarRule).toContain("top:0");
		expect(compiledCss).toMatch(
			/@media\s*\(width<=1100px\)\{[\s\S]*?\.app-shell\{grid-template-columns:88px minmax\(0,1fr\)}/,
		);
		expect(compiledCss).toMatch(
			/@media\s*\(width<=1100px\)\{[\s\S]*?\.sidebar-brand-label,.sidebar-nav-label,.sidebar-footer\{display:none}/,
		);
		expect(compiledCss).toMatch(
			/@media\s*\(width<=1100px\)\{[\s\S]*?\.sidebar-nav-link\{justify-content:center}/,
		);
		expect(shellRules).toHaveLength(2);
		expect(sidebarRules).toHaveLength(2);
	});

	it("não emite infraestrutura CSS de drawer", () => {
		expect(compiledCss).not.toContain(".menu-btn");
		expect(compiledCss).not.toContain(".sidebar-close");
		expect(compiledCss).not.toContain(".sidebar-backdrop");
		expect(compiledCss).not.toContain(".dashboard-sidebar.is-open");
	});

	it("emite regra específica de page-head depois do h1 legado", () => {
		const legacyHeading = compiledCss.match(/h1\{[^}]*font-size:36px[^}]*}/);
		const pageHeading = compiledCss.match(
			/\.page-head>div>h1\{[^}]*font-size:clamp\(30px,3vw,42px\)[^}]*}/,
		);

		expect(legacyHeading).not.toBeNull();
		expect(pageHeading).not.toBeNull();
		expect(pageHeading?.index).toBeGreaterThan(legacyHeading?.index ?? -1);
	});
});

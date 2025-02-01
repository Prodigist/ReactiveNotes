import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["main.tsx"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2020",
	platform: "node",  // Add this for Node.js compatibility
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: prod,
	jsx: "transform",  // Add this line
    loader: {  // Add loader configuration
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
		'.css': 'css',  // Add CSS loader
        '.json': 'json' // Add JSON loader for Tailwind config
    },
	define: {  // Add environment definitions
        'process.env.NODE_ENV': prod ? '"production"' : '"development"',
        global: 'window'
    },
    inject: [  // Add React shim
        './react-shim.js'
    ],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}

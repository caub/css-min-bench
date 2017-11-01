const cssnano = require('cssnano');
const CleanCSS = require('clean-css');
const csso = require('csso');
const fs = require('fs');
const util = require('util');
const deps = require('./package.json').devDependencies;

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

const optimizers = [
	['cssnano', css => cssnano.process(css, {}).then(r => r.css)],
	['clean-css', css => new CleanCSS({returnPromise: true}).minify(css).then(r => r.styles)],
	['csso', css => Promise.resolve().then(() => csso.minify(css).css)]
];

const samplePaths = [
	'bootstrap/dist/css/bootstrap.css',
	'bulma/css/bulma.css',
	'font-awesome/css/font-awesome.css',
	'leaflet/dist/leaflet.css',
	'normalize.css/normalize.css',
	'reset.css/reset.css',
	'universal.css/universal.css'
];

(async() => {

	const data = await Promise.all(samplePaths.map(async s => {

		const buf = await readFile('./node_modules/' + s);

		const st = await stat('./node_modules/' + s);

		const lens = await Promise.all(optimizers.map(([name, fn]) => fn(buf + '').then(x => x.length).catch(e => -1)));
		
		return [st.size, lens];
	}));

	const date = new Date().toJSON().slice(0, 10);

	const header = `<tr>
	<th>Generated on ${date}</th>
	${optimizers.map(([name]) => `<th>${name} - ${deps[name].slice(1)}</th>`).join('\n')}
</tr>`;

	const body = `<tbody>
	${data.map(([oriSize, lens], i) => {
		const validLens = lens.filter(x => x > 0);
		const [min, max] = [Math.min(...validLens), Math.max(...validLens)];
		const sampleName = samplePaths[i].split('/', 1)[0];
		return `<tr><td><strong>${sampleName}</strong> - <span >${oriSize}</span></td>${lens.map(len => `<td class="${len===min ? 'min' : len===max ? 'max' : ''}">${len}</td>`).join('')}</tr>`
	}).join('\n')}
</tbody>`;

	await writeFile('index.html', `<style>
	body {font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
	* {box-sizing: border-box}
	td {background: #a7a7a7; color: white; padding: 4px 10px;}
	th {padding: 4px 15px;}
	.min {background: green}
	.max {background: salmon}
</style>
<table>
	<thead>
		${header}
	</thead>
	${body}
</table>`);
	
})()
	.catch(console.error)
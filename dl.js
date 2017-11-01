const fetch = require('node-fetch');
const fs = require('fs');
const mkdir = require('util').promisify(fs.mkdir);

// put some other css files in node_modules

fetch('https://cdn.rawgit.com/marmelab/universal.css/master/universal.css')
	.then(async r => {
		await mkdir('node_modules/universal.css').catch(() => {});
		r.body.pipe(fs.createWriteStream('node_modules/universal.css/universal.css'))
	});

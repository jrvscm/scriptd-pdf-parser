require('dotenv').config();

const express = require("express");
const fs = require('fs');
const request = require('request');
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(morgan('common'));
app.use(bodyParser.json());

app.post('/parse', (req, res) => {
	const {files} = req.body;
	console.log(files[0].preview)
	/*const child = execFile('node', [`pdf2json ${files[0]}`], (error, stdout, stderr) => {
		if(error) {
			console.error('stderr', stderr);
			throw error;
		}
			console.log('stdout', stdout);
	})*/
})

app.use(express.static(path.resolve(__dirname, './build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build', 'index.html'));
});

console.log(`Listening on port ${PORT}`);
app.listen(PORT);


require('dotenv').config();

const express = require("express");
const fs = require('fs');
const request = require('request');
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { fork } = require('child_process');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(morgan('common'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended: true}));

app.post('/parse', (req, res) => {
	console.log(req.body)
	/*
	const child = fork('./pdf2json.js');
	child.send(file);
	child.on('message', data => {
		res.end(data)
	})*/
})

app.use(express.static(path.resolve(__dirname, './build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build', 'index.html'));
});

console.log(`Listening on port ${PORT}`);
app.listen(PORT);


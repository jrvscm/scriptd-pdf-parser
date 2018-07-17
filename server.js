require('dotenv').config();

const express = require("express");
const fs = require('fs');
const request = require('request');
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { fork } = require('child_process');
const FileReader = require('filereader');
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(morgan('common'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended: true}));

app.post('/parse', (req, res) => {
	const file = req.body[0].preview;
	new Promise((resolve, reject) => {
  	const reader = new FileReader()
  	reader.readAsDataURL(file)
  	reader.onload = () => {
  		if(!!reader.result){
  			const array = this.convertDataURIToBinary(reader.result)
  			resolve(array)
  		} else{
  			reject(Error("Failed converting to Uint8Array"))
  		}
  	}
  })
  .then(array => {
  	console.log(array)
		/*const child = fork('./pdf2json.js');
		child.send(array);
		child.on('message', data => {
			res.end(data)
		})*/
	})
})

app.use(express.static(path.resolve(__dirname, './build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build', 'index.html'));
});

console.log(`Listening on port ${PORT}`);
app.listen(PORT);


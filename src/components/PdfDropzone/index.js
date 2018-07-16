import React, { Component } from 'react';
import glamorous from 'glamorous';
import Dropzone from 'react-dropzone';

class PdfDropzone extends Component {
  constructor() {
    super()
    this.state = {
      accept: '.pdf',
      file: [],
      dropzoneActive: false
    }
  }

  onDragEnter() {
    this.setState({
      dropzoneActive: true
    });
  }

  onDragLeave() {
    this.setState({
      dropzoneActive: false
    });
  }

convertDataURIToBinary(dataURI) {
	const BASE64_MARKER = ';base64,';
  const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  const base64 = dataURI.substring(base64Index);
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for(let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  
  return array;
}

  onDrop(file) {
  	new Promise((resolve, reject) => {
  		const reader = new FileReader()
  		reader.readAsDataURL(file[0])
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
  	  this.setState({
      	file: array,
      	dropzoneActive: false
    	}) 	
      console.log(this.state.file)
  	}, err => {
  		return console.log(err)
  	})
  }

  onSubmit(e) {
  	e.preventDefault();
  	const { file } = this.state;
  	fetch('/parse', {
  		method: 'POST',
      body:{  		
        file: file,
      }
    })
    .then(res => res.json())
    .then(res => console.log(res))
  }

  render() {
    const { accept, file, dropzoneActive } = this.state;
    const overlayStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      padding: '2.5em 0',
      background: 'rgba(0,0,0,0.5)',
      textAlign: 'center',
      color: '#fff'
    };

    return (
    	<Form onSubmit={(e) => this.onSubmit(e)}>	
				<fieldset>
  				<legend>Pdf Parser</legend>
      		<Dropzone
        		disableClick
        		style={{position: "relative"}}
        		accept={accept}
        		onDrop={this.onDrop.bind(this)}
        		onDragEnter={this.onDragEnter.bind(this)}
        		onDragLeave={this.onDragLeave.bind(this)}
      		>
        		{ dropzoneActive && <div style={overlayStyle}>Drop files...</div> }
        		<div>
          		<h2>Dropped Files Here</h2>
          		<ul>
            		{
              		file.length===0?null:<em>File detected, submit to parse.</em>
            		}
          		</ul>
    				</div>
    			</Dropzone>		
    		</fieldset>
    		<button style={{marginTop: 15, marginBottom: 15}}>Submit</button>
  		</Form>
    );
  }
}

export default PdfDropzone;

const Form = glamorous.form({
	width: 350
})
import React, { Component } from 'react';
import glamorous from 'glamorous';
import Dropzone from 'react-dropzone';

class PdfDropzone extends Component {
  constructor() {
    super()
    this.state = {
      accept: '.pdf',
      files: [],
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

  onDrop(files) {
    this.setState({
      files,
      dropzoneActive: false
    });

  }

  onSubmit(e) {
  	e.preventDefault();
  	const { files } = this.state;
  	fetch('/parse', {
  		method: 'POST',
			headers: {
            "Content-Type": "application/json"
      },  		
  		body: JSON.stringify({
  			files: files
  		}),
  	})
    .then(res => res.json())
    .then(res => console.log(res))
  }

  render() {
    const { accept, files, dropzoneActive } = this.state;
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
              		files.map(f => <li>{f.name} - {f.size} bytes</li>)
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
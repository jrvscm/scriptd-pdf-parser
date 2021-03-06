import React, { Component } from 'react';
import glamorous from 'glamorous';
import Dropzone from 'react-dropzone';
import JSONpretty from 'react-json-pretty';
import 'whatwg-fetch';
import './index.css';

class PdfDropzone extends Component {
  constructor() {
    super()
    this.state = {
      accept: '.pdf',
      script: null,
      file: null,
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

  onDrop(droppedFile) {
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(droppedFile[0])
    reader.onload = () => {
      if(!!reader.result){
        const file = this.convertDataURIToBinary(reader.result)
        resolve(file)
      } else{
        reject(Error("Failed converting to Uint8Array"))
      }
    }
  })
  .then(file => {
  	this.setState({
      file,
      dropzoneActive: false
    }) 	

    fetch('/parse', {
      method: 'POST',
      body: JSON.stringify(file),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
  })
}

  onSubmit(e) {
  	e.preventDefault();
  	fetch('/read')
    .then(res => res.json())
    .then(scriptAsJson => {
      this.setState({
        script: scriptAsJson
      })
    })
    .catch(err => console.log(`something went wrong ${err}`))
  }

  render() {
    const { accept, file, dropzoneActive, script } = this.state;
    return (
    <Container>	
      <Row>
      <Form onSubmit={(e) => this.onSubmit(e)}>	
				<Fieldset>
  				<Legend>Pdf Parser</Legend>
      		<Dropzone
        		disableClick
        		accept={accept}
        		onDrop={this.onDrop.bind(this)}
        		onDragEnter={this.onDragEnter.bind(this)}
        		onDragLeave={this.onDragLeave.bind(this)}
      		>
        		{ dropzoneActive && <div style={overlayStyle}>Drop files...</div> }
        		<InnerContainer>
          		<h2 style={{margin: 0, padding: 0, color: '#0f59e1'}}>Drop File Here</h2>
          		<Detection>
            		{
              		file === null ? null : <em>File parsed, submit to view.</em>
            		}
          		</Detection>
    				</InnerContainer>
    			</Dropzone>		
    		</Fieldset>
    		<button style={{marginTop: 15, marginBottom: 15}}>Submit</button>
  		</Form>
      </Row>
      <Row>
        <JSONpretty id='json-pretty' className="custom-json-pretty" json={script!==null?script:""} />
      </Row>
    </Container>
    );
  }
}

export default PdfDropzone;

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

const Detection = glamorous.div({
  margin: `5%`
})

const Legend = glamorous.legend({
  fontWeight: `bold`,
  color: '#0f59e1'
})

const Fieldset = glamorous.fieldset({
  background: `#fff`,
  WebkitBoxShadow: `0px 0px 5px 0px rgba(0,0,0,0.75)`,
  MozBoxShadow: `0px 0px 5px 0px rgba(0,0,0,0.75)`,
  boxShadow: `0px 0px 5px 0px rgba(0,0,0,0.75)`,
  borderRadius: 6
})

const InnerContainer = glamorous.div({
  height: `100%`,
  display: `flex`,
  flexDirection: `column`,
  alignItems: `center`,
  justifyContent: `center`,
})

const Container = glamorous.div({
  height: `100%`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  alignItems: `center`,
  justifyContent: `center`,
})

const Row = glamorous.div({
  display: `flex`,
  flexDirection: `row`,
  alignItems: `center`,
  justifyContent: `center`,
})

const Form = glamorous.form({
	width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  alignItems: `center`,
  justifyContent: `center`
})
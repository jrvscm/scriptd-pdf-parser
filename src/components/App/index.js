import React, { Component } from 'react';
import glamorous from 'glamorous';

import PdfDropzone from '../PdfDropzone';

class App extends Component {
  render() {
    return (
      <Container>
        <PdfDropzone />
      </Container>
    );
  }
}

export default App;

const Container = glamorous.div({
  height: `100%`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  alignItems: `center`,
  justifyContent: `center`
})

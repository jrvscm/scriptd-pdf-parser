import React from 'react';
import glamorous from 'glamorous';
import JSONPretty from 'react-json-pretty';

const Script = ({script}) => (
	<Container>
		<JSONPretty id="json-pretty" json={script} />
	</Container>
)

export default Script;

const Container = glamorous.div({
	width: `80vw`
})


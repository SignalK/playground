var React = require('react');
var {Grid, Row, Col, Panel, Input, Alert, Label} = require('react-bootstrap');
var schema = require("signalk-schema");
var Multiplexer = require('signalk-multiplexer');

var defaultDelta = {
  "context": "vessels.123456789",
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "128275",
      "src": "115"
    },
    "values": [{
      "path": "navigation.logTrip",
      "value": 43374
    }, {
      "path": "navigation.log",
      "value": 17404540
    }]
  }]
};

function toTree(delta) {
  var multiplexer = new Multiplexer("1010101010", "uuid");
  multiplexer.add(delta);
  var result = multiplexer.retrieve();
  delete result.vessels["1010101010"];
  delete result["version"];
  delete result["self"];
  return result;
}

var Playground = React.createClass({
  getInitialState: function() {
    return {
      validJson: true,
      validationResult: schema.validateDelta(defaultDelta),
      tree: toTree(defaultDelta)
    }
  },
  render: function() {
    var deltaMsg;
    if (!this.state.validJson) {
      deltaMsg = 
        <Alert bsStyle='warning'>
          <p><Label bsStyle='danger'>This is not valid JSON</Label></p>
        </Alert>
    } else if (this.state.validationResult.errors.length === 0 && this.state.validationResult.missing.length === 0) {
      deltaMsg = <Alert bsStyle='success'>This is a valid Signal K delta message regarding the JSON structure.</Alert>
    } else {
      deltaMsg = 
        <Alert bsStyle='warning'>
          <p><Label bsStyle='danger'>This is not valid Signal K delta</Label></p>
          <p>{this.state.validationResult.errors[0].message + ':' + this.state.validationResult.errors[0].dataPath + 
      ' and ' + (this.state.validationResult.errors.length-1) + ' other errors '}</p>
        </Alert>      
    }

    return (
      <Grid>
        <Row >
          <Col md={6} mdPush={6}>
            <Panel>
              <Input 
                type='textarea' 
                label='Tree' 
                placeholder='' 
                rows='20' 
                value={JSON.stringify(this.state.tree, null, 2)}/>
            </Panel>
          </Col>
          <Col md={6} mdPull={6}>
            <Panel>
              <Input 
                type='textarea' 
                label='Delta' 
                placeholder='' 
                rows='20' 
                defaultValue={JSON.stringify(defaultDelta, null, 2)}
                onChange={this.deltaChanged} 
                onKeyPress={this.onKeyPress}
                />
              <div>{deltaMsg}</div>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  },
  onKeyPress: function(event) {
    if (event.charCode === 13) // Enter key, prevent form submission & page reload
      event.preventDefault();
  },
  deltaChanged: function(event) {
    var rawValue = event.target.value;
    try {
      var parsedValue = JSON.parse(rawValue);
      this.setState({
        validJson:true,
        validationResult: schema.validateDelta(parsedValue),
        tree: toTree(parsedValue)
      });
    } catch (SyntaxError) {
      this.setState({
        validSignalK: false,
        validJson: false,
        tree: {}
      });
    };
  }
});   

var app =  React.render(
  <Playground/>,
  document.getElementById('content')
);


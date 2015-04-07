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
  delete result["version"];
  delete result["self"];
  return result;
}

var Playground = React.createClass({
  getInitialState: function() {
    return this.getResults(JSON.stringify(defaultDelta));
  },
  render: function() {
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
              <div id="123">{this.getTreeMessage()}</div>
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
                />
              <div>{this.getDeltaMessage()}</div>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  },

  deltaChanged: function(event) {
    this.setState(this.getResults(event.target.value));
  },
  getResults: function(rawDelta) {
    var delta = false;
    try {
      delta = JSON.parse(rawDelta);
    } catch (error) {};
    var deltaValidationResult = false;
    var tree = false;
    var treeValidationResult = false;
    if (delta) {
      try {
        deltaValidationResult = schema.validateDelta(delta)
      } catch (error) {
        console.log(error);
      };
      try {
        tree = toTree(delta);
        treeValidationResult = schema.validate(tree.vessels["123456789"]);
      } catch (error) {
        console.log(error);
      }
    }
    return {
      delta: delta,
      deltaValidationResult: deltaValidationResult,
      tree: tree,
      treeValidationResult: treeValidationResult
    };
  },
  getDeltaMessage: function() {
    if (!this.state.delta) {
      return ( 
        < Alert bsStyle = 'warning' >
          <p><Label bsStyle='danger'>This is not valid JSON</Label></p>
        </Alert>
      )
    } else if (this.state.deltaValidationResult && this.state.deltaValidationResult.errors.length === 0 && this.state.deltaValidationResult.missing.length === 0) {
      return (
        <Alert bsStyle='success'>This is a valid Signal K delta message regarding the JSON structure.</Alert>
      )
    } else {
      return (
        <Alert bsStyle='warning'>
          <p><Label bsStyle='danger'>This is not valid Signal K delta</Label></p>
          <p>{this.getValidationMessage(this.state.deltaValidationResult)}</p>
        </Alert>
      )
    }
  },
  getTreeMessage: function() {
    if (this.state.treeValidationResult && this.state.treeValidationResult.errors.length === 0 && this.state.treeValidationResult.missing.length === 0) {
      return (<Alert bsStyle='success'>This is valid Signal K.</Alert>)
    } else {
      return (
        <Alert bsStyle='warning'>
          <p><Label bsStyle='danger'>This is not valid Signal K.</Label></p>
          <p>{this.getValidationMessage(this.state.treeValidationResult)}</p>
        </Alert>
      )
    }
  },
  getValidationMessage: function(validationResult) {
    return validationResult ? validationResult.errors[0].message + ':' + validationResult.errors[0].dataPath +
      ' and ' + (validationResult.errors.length - 1) + ' other errors ' : "";
  }
});

var app =  React.render(
  <Playground/>,
  document.getElementById('content')
);


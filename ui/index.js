import React from 'karet';
import ReactDOM from 'react-dom';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css'
import Atom from 'kefir.atom'
import L from 'partial.lenses'
import K from 'karet.util'
import SignalK from 'signalk-schema'

const deltaData = {
    "context": "vessels.urn:mrn:imo:mmsi:230099999",
    "updates": [{
        "source": {
            "type": "NMEA2000",
            "src": "017",
            "pgn": 127488,
            "label": "N2000-01"
        },
        "timestamp": "2010-01-07T07:18:44Z",
        "values": [{
            "path": "propulsion.0.revolutions",
            "value": 16.341667
        }, {
            "path": "propulsion.0.boostPressure",
            "value": 45500.0
        }]
    }]
}



const sourceMissing = update =>
  typeof update.source === "undefined" &&
  typeof update['$source'] === "undefined"

const deltaString = new Atom(JSON.stringify(deltaData, null, 2))
const deltaParseResult = K(deltaString, s => {
  try {
    const delta = JSON.parse(s)
    return {
      isJson: true,
      validationResult: SignalK.validateDelta(delta),
      hasContext: typeof delta.context !== "undefined",
      sourcesMissing: delta.updates.some(sourceMissing),
      timestampsMissing: delta.updates.some(update => typeof update.timestamp === 'undefined')
    }
  } catch(e) {
    // console.log(e)
    return {
      isJson: false,
      validationResult: {
        valid: false,
        errors: [],
        hasContext: false,
        sourcesMissing: true
      }
    }
  }
})
const deltaParseMessage = K(deltaParseResult, result =>
  result.isJson ?
  <div>
    <span className="label label-success">The input is valid JSON</span><br/>
    {deltaValidationResult}<br/>
    {deltaContextMessage}<br/>
    {deltaSourceMessage}<br/>
    {deltaTimestampMessage}
  </div>
  :
  <span className="label label-danger">The input is not valid JSON</span>
)

const deltaValidationResult = K(deltaParseResult, result =>
  result.validationResult.valid ?
  <span className="label label-success">The input is a valid Signal Delta message</span> :
  (<div>
    <span className="label label-danger">The input is not a valid Signal K JSON message</span>
    <ul>
      {result.validationResult.errors.map((error, i) => <li key={i}>{error.message} {error.dataPath}</li>)}
    </ul>
   </div>
  )
)

const deltaContextMessage = K(deltaParseResult, result =>
  result.hasContext ?
  <span/> :
  <span className="label label-info">The delta message has no context, using vessels.urn:mrn:imo:mmsi:230099999 as default.</span>
)

const deltaSourceMessage = K(deltaParseResult, result =>
  result.sourcesMissing ?
  <span className="label label-info">The delta message is missing source data, using dummy.source as default.</span> :
  <span/>
)

const deltaTimestampMessage = K(deltaParseResult, result =>
  result.timestampsMissing ?
  <span className="label label-info">The delta message is missing timestamp data, using current timestamp as default.</span> :
  <span/>
)


const fullString = new Atom("")
const setFullByDelta = () => {
  const delta = JSON.parse(deltaString.get())
  if (typeof delta.context === "undefined") (
    delta.context = 'vessels.urn:mrn:imo:mmsi:230099999'
  )
  delta.updates.forEach(update => {
    const now = new Date().toISOString()
    if (sourceMissing(update)) {
      update['$source'] = 'dummy.source'
    }
    if (typeof update.timestamp === 'undefined') {
      update.timestamp = now
    }
  })
  fullString.set(JSON.stringify(SignalK.deltaToFull(delta), null, 2))
}

const conversionButton = K(deltaParseResult, result =>
  result.validationResult.valid ?
    <button type="button" className="btn-primary" onClick={setFullByDelta}>Convert to Full</button> :
    <button type="button" className="btn disabled">Convert to Full</button>
)

const beautifyDelta = () => deltaString.set(JSON.stringify(JSON.parse(deltaString.get()), null, 2))
const beautifyDeltaButton = K(deltaParseResult, result =>
  result.isJson ?
    <button type="button" className="btn-primary" onClick={beautifyDelta}>Beautify JSON</button> :
    <button type="button" className="btn disabled">Beautify JSON</button>
)

const fullParseResult = K(fullString, s => {
  try {
    const full = JSON.parse(s)
    return {
      isJson: true,
      validationResult: SignalK.validateFull(full)
    }
  } catch(e) {
    return {
      isJson:false
    }
  }
})

const fullParseMessage = K(fullParseResult, result =>
  result.isJson ?
  <div>
    <span className="label label-success">The full input is valid JSON</span><br/>
    {fullValidationResult}
  </div>
  :
  <span className="label label-danger">The full input is not valid JSON</span>
)

const fullValidationResult = K(fullParseResult, result =>
  result.validationResult.valid ?
  <span className="label label-success">The input is a valid Signal full JSON structure</span> :
  (<div>
    <span className="label label-danger">The input is not a valid Signal K full JSON structure</span>
    <ul>
      {result.validationResult.errors.map((error, i) => <li key={i}>{error.message} {error.dataPath}</li>)}
    </ul>
   </div>
  )
)


const foo = ({}) =>
<div className="panel panel-default">
  <div className="panel-body">
<form>
<div className="row">
  <div className="col-md-6">
  <div className="panel panel-default">
  <div className="panel-heading">
    <h3 className="panel-title">Delta</h3>
  </div>
  <div className="panel-body">
  <div className="form-group">
    <textarea
      className="form-control"
      rows="20"
      id="delta"
      value={deltaString}
      onChange={e => deltaString.set(e.target.value)}
    />
    {deltaParseMessage}<br/>
    <p>{beautifyDeltaButton}</p>
    <p>{conversionButton}</p>
  </div>
  </div>
</div>

  </div>
  <div className="col-md-6">
  <div className="panel panel-default">
  <div className="panel-heading">
    <h3 className="panel-title">Full</h3>
  </div>
  <div className="panel-body">
  <div className="form-group">
    <textarea
      className="form-control"
      rows="20"
      value={fullString}
      onChange={e => fullString.set(e.target.value)}
    />
  </div>
  {fullParseMessage}
  </div>
  </div>
  </div>
</div>
</form>
</div>
</div>

ReactDOM.render(React.createElement(foo), document.getElementById('root'))

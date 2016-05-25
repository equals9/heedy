import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Card, CardText, CardHeader} from 'material-ui/Card';

import Form from "react-jsonschema-form";

import {dataInput, showMessage} from '../actions';
import {go} from '../actions';

import datatypes from '../datatypes/datatypes';
import {getStreamState} from '../reducers/stream';

const log = (type) => console.log.bind(console, type);

// Unfortunately the schema form generator is... kinda BS in that it has undefined for values. To fix that,
// we modify the schema
function generateSchema(s) {
    let uiSchema = {};
    switch (s.type) {
        case "object":
            let k = Object.keys(s.properties);
            for (let i in k) {
                let key = k[i];
                let ret = generateSchema(s.properties[key]);
                uiSchema[key] = ret.ui;
                s.properties[key] = ret.s;
            }
            break;
        case "string":
            if (s.default === undefined) {
                s["default"] = "";
            }

            break;
        case "boolean":
            if (s.default === undefined) {
                s["default"] = false;
            }
            uiSchema["ui:widget"] = "radio";
            break;
        case "number":
            if (s.default === undefined) {
                s["default"] = 0;
            }
            break;

    }
    return {ui: uiSchema, s: s};
}

const noSchema = {
    type: "object",
    properties: {
        input: {
            title: "Stream Data JSON",
            type: "string"
        }
    }
};

class DataInput extends Component {
    static propTypes = {
        user: PropTypes.object.isRequired,
        device: PropTypes.object.isRequired,
        stream: PropTypes.object.isRequired,
        onSubmit: PropTypes.func.isRequired,
        onChange: PropTypes.func.isRequired,
        showMessage: PropTypes.func.isRequired,
        title: PropTypes.string,
        subtitle: PropTypes.string,
        size: PropTypes.number
    }

    static defaultProps = {
        title: "Insert Into Stream",
        subtitle: "",
        size: 6
    }

    touch() {
        if (this.props.touch !== undefined) {
            this.props.touch();
        }
    }
    render() {
        let user = this.props.user;
        let device = this.props.device;
        let stream = this.props.stream;
        let path = user.name + "/" + device.name + "/" + stream.name;

        let schema = JSON.parse(stream.schema);
        let curschema = Object.assign({}, schema);
        let inside = false;

        if (schema.type === undefined) {
            curschema = noSchema;
        } else if (schema.type != "object") {
            if (curschema.title === undefined) {
                curschema.title = "Input Data:"
            }
            curschema = {
                type: "object",
                properties: {
                    input: curschema
                }

            };
        }
        let s = generateSchema(curschema);
        let size = this.props.size;

        // Now check if the datatype allows for a custom input method
        if (stream.datatype != "") {
            var d = datatypes[stream.datatype];
            if (d !== undefined) {
                var DatatypeInput = d.input.component;
                size = d.input.size * this.props.size;
            }

        }

        let state = this.props.state;
        let fdata = {};

        if (d === undefined && state.formData !== undefined) {
            fdata = state.formData;
        }

        return (
            <div className={`col-lg-${size}`}>
                <Card style={{
                    marginTop: "20px",
                    textAlign: "left"
                }}>
                    <CardHeader title={this.props.title} subtitle={this.props.subtitle}>{this.props.children}</CardHeader>
                    <CardText style={{
                        textAlign: "center"
                    }}>{DatatypeInput !== undefined && DatatypeInput != null
                            ? (<DatatypeInput stream={stream} state={state} onChange={this.props.onChange} path={path} onSubmit={this.props.onSubmit}/>)
                            : (<Form schema={s.s} uiSchema={s.ui} formData={fdata} onChange={this.props.onChange} onSubmit={(data) => {
                                if (schema.type === undefined) {
                                    try {
                                        var parsedData = JSON.parse(data.formData.input);
                                    } catch (e) {
                                        this.props.showMessage(e.toString());
                                        return;
                                    }
                                    this.props.onSubmit(parsedData);
                                } else if (schema.type != "object") {
                                    this.props.onSubmit(data.formData.input);
                                    return;
                                }
                                this.props.onSubmit(data.formData);
                            }} onError={log("errors")}/>)}
                    </CardText>
                </Card>
            </div>
        );
    }
}

export default connect((state, props) => ({
    state: getStreamState(props.user.name + "/" + props.device.name + "/" + props.stream.name, state).input
}), (dispatch, props) => ({
    onSubmit: (val, cng) => dispatch(dataInput(props.user, props.device, props.stream, val, cng)),
    showMessage: (val) => dispatch(showMessage(val)),
    onChange: (v) => dispatch({
        type: "STREAM_INPUT",
        name: props.user.name + "/" + props.device.name + "/" + props.stream.name,
        value: v
    })

}))(DataInput);

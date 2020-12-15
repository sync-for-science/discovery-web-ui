import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import './Annotation.css';
import config from '../../config.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Annotation
//
export default class Annotation extends React.Component {

  static contextType = DiscoveryContext;  // Allow the shared context to be accessed via 'this.context'

  // Extend resource.discoveryAnnotation (or return extension props if no annotation)
  static info(res) {
//      return res.data.discoveryAnnotation ? Object.assign({}, res.data.discoveryAnnotation, { id: res.id, provider: res.provider, resourceId: res.data.id })
//            : { id: res.id, provider: res.provider, resourceId: res.data.id, annotationHistory: null };
    if (!res.data.discoveryAnnotation) {
      res.data['discoveryAnnotation'] = { id: res.id, provider: res.provider, resourceId: res.data.id, annotationHistory: null };
    } else {
      res.data.discoveryAnnotation = Object.assign(res.data.discoveryAnnotation, { id: res.id, provider: res.provider, resourceId: res.data.id });
    }

    return res.data.discoveryAnnotation;
  }

  static propTypes = {
    annotation: PropTypes.object
  }

  state = {
    inEdit: false,
    changed: false
  }

  componentDidMount() {
    // Force initial processing of HTML content
    this.setAnnotationDisplay();
  }

  // Set annotation div contents
  setAnnotationDisplay() {
    let div = this.annotationDiv();
    if (div) {
      if (this.props.annotation.annotationHistory) {
        let numVersions = this.props.annotation.annotationHistory.length;
        div.innerHTML = this.props.annotation.annotationHistory[numVersions-1].annotationText;
      } else {
        div.innerHTML = '';
      }
    }
  }

  annotationKey() {
    return this.props.annotation.provider.replace(/ /g, '-') + '_' + this.props.annotation.resourceId.replace(/ /g, '-');
  }

  annotationDiv() {
    return document.getElementById(this.annotationKey());
  }

  // Replace <div>, <br> with newline
  cleanText(text) {
    return text
      .replace(/<div><br>/g, '\n')
      .replace(/<div>|<br>/g, '\n')
      .replace(/<\/div>/g, '');
  }

  editAnnotation = () => {
    //   console.log(JSON.stringify(this.props.annotation, null, 3));
    this.setState({ inEdit: true }, () => {
      let div = this.annotationDiv();
      if (div) {
        div.focus();
        document.execCommand('selectAll', false, null);
        document.getSelection().collapseToEnd();    // Move cursor to end
      }
    });
  }

  saveAnnotation = () => {
    let annotation = this.props.annotation;
    let text = this.cleanText(this.annotationDiv().innerHTML);

    // NOTE: 'updated' timestamp set by server
    if (annotation.annotationHistory) {
      annotation.annotationHistory.push({ updated: '<set by server>', annotationText: text });
    } else {
      annotation.annotationHistory = [{ updated: '<set by server>', annotationText: text }];
    }

    axios.post(`${config.serverUrl}/participants/${annotation.id}/${annotation.provider}/${annotation.resourceId}`, {
      annotation: text
    })
      .then(response => {
        this.setState({ inEdit: false, changed: false });
      })
      .catch(error => {
        alert('Save annotation failed. Please retry. ' + error);
      });
  }

  cancelEditAnnotation = () => {
    this.setState({ inEdit: false, changed: false });
    this.setAnnotationDisplay();
  }

  pasteAsPlainText = event => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text)
  }

  stopPropagation = event => {
    // Don't propagate keypresses to parents
    event.stopPropagation();
  }

  checkForChange = event => {
    let annotation = this.props.annotation;
    let oldText = annotation.annotationHistory ? annotation.annotationHistory[annotation.annotationHistory.length-1].annotationText : '';
    let isChanged = this.annotationDiv().innerHTML !== oldText;
    this.setState({ changed: isChanged });
  }

  render() {
    let annotation = this.props.annotation;
    let isText = annotation.annotationHistory ? this.cleanText(annotation.annotationHistory[annotation.annotationHistory.length - 1].annotationText) : null;
    return <div className='annotation-container'>
      <div className='annotation-buttons-container'>
        { !this.state.inEdit && <button className='annotation-button' onClick={this.editAnnotation}>{isText ? 'Edit My Note' : 'Add Note'}</button> }
        {  this.state.inEdit && <button className={this.state.changed ? 'annotation-button' : 'annotation-button-disabled'}
                                        onClick={this.saveAnnotation}>save</button> }
        {  this.state.inEdit && <button className='annotation-button' onClick={this.cancelEditAnnotation}>cancel</button> }
      </div>
      <div className={(isText || this.state.inEdit) ? 'annotation' : 'annotation-empty'} id={this.annotationKey()}
           contentEditable={this.state.inEdit} suppressContentEditableWarning={true}
           onPaste={this.pasteAsPlainText} onKeyDown={this.stopPropagation} onKeyUp={this.checkForChange}>
      </div>
    </div>;
  }
}

import React from 'react';
import PropTypes from 'prop-types';

import './SVGContainer.css';
import { getStyle, checkQuerySelector } from '../../util.js';

//
// The container for a collection of SVG elements
//    Gets height from the CSS class
//
export default class SVGContainer extends React.Component {
  static propTypes = {
    preserveAspectRatio: PropTypes.string, // Default is 'xMidYMid meet' if not provided
    svgClassName: PropTypes.string.isRequired,
    style: PropTypes.object,
    svgWidth: PropTypes.string.isRequired,
  }

  state = {
    height: '0px',
  };

  componentDidMount() {
    const selector = this.props.className.split(' ').map((name) => `.${name}`).join('');
    const elt = checkQuerySelector(selector);
    this.setState({ height: getStyle(elt, 'height') });
  }

  render() {
    const par = this.props.preserveAspectRatio ? this.props.preserveAspectRatio : 'xMidYMid meet';
    const { height } = this.state;
    const width = this.props.svgWidth;
    const childrenWithSizeProps = React.Children.map(this.props.children,
      (child) => child && React.cloneElement(child, { width, height }));
    return (
      <div className={this.props.className} style={this.props.style ? this.props.style : null}>
        <svg className={this.props.svgClassName} width={width} height={height} preserveAspectRatio={par} xmlns="http://www.w3.org/2000/svg">
          { childrenWithSizeProps }
        </svg>
      </div>
    );
  }
}

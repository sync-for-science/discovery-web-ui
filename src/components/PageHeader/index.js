import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import Draggable from 'react-draggable';

import './PageHeader.css';
import config from '../../config.js';

// import { formatPatientName } from '../../fhirUtil.js';
import FhirTransform from '../../FhirTransform.js';
import Search from '../Search';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the page header of DiscoveryApp page
//    if there is a 'logos' query parameter, its comma-separated
//    elements will be used as left-to-right logo css classes.
//
export default class PageHeader extends React.Component {
  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    rawQueryString: PropTypes.string.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    modalFn: PropTypes.func.isRequired, // Callback to handle clicks on header icons
    viewFn: PropTypes.func.isRequired, // Callback to handle view selection
    searchCallback: PropTypes.func.isRequired,
    resources: PropTypes.instanceOf(FhirTransform),
  }

  state = {
    modalName: '',
    logoClasses: ['logo-s4s-button'], // Default value. Parsed from query string 'logos=a,b,c'
    currentTextSize: 1.0,
    inactiveLight: true,
    menuIsOpen: false,
    currentViewName: null,
    viewHelpIsOpen: false,
    viewHelpRemainingTime: 0,
    themesMenuIsOpen: false,
  }

  onKeydown = (event) => {
    if (this.state.menuIsOpen && event.key === 'Escape') {
      this.setState({ menuIsOpen: false });
    }
  }

  loadThemes() {
    fetch('/themes/themes.json')
      .then((response) => response.json())
      .then((data) => {
        this.themes = data;
      });
  }

  componentDidMount() {
    this.loadThemes();
    window.addEventListener('keydown', this.onKeydown);
    const queryVals = queryString.parse(this.props.rawQueryString);
    if (queryVals.logos) {
      this.setState({ logoClasses: queryVals.logos.split(',') });
    }
    this.viewClick('summaryView'); // Set initial/default view
    //      this.viewClick('reportView');  // Set initial/default view
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
    this.clearViewHelpInterval();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.modalIsOpen && !this.props.modalIsOpen) {
      // The modal was closed -- turn "off" the associated button
      switch (this.state.modalName) {
        case 'logoModal':
          for (const logoClass of this.state.logoClasses) {
            document.querySelector(`.${logoClass}-on`).className = `${logoClass}-off`;
          }
          break;
        default:
          break;
      }
      this.setState({ modalName: '' });
    }

    if (prevState.currentViewName !== this.state.currentViewName && prevState.currentViewName) {
      // Turn "off" the previous button
      switch (prevState.currentViewName) {
        case 'reportView':
          document.querySelector('.longitudinal-view-button-on').className = 'longitudinal-view-button-off';
          break;
        case 'compareView':
          document.querySelector('.compare-view-button-on').className = 'compare-view-button-off';
          break;
        case 'financialView':
          document.querySelector('.benefits-view-button-on').className = 'benefits-view-button-off';
          break;
          //      case 'consultView':
          //         document.querySelector('.consult-view-button-on').className = 'consult-view-button-off';
          //         break;
          //      case 'diabetesView':
          //         document.querySelector('.diabetes-view-button-on').className = 'diabetes-view-button-off';
          //         break;
        case 'tilesView':
          document.querySelector('.tiles-view-button-on').className = 'tiles-view-button-off';
          break;
        case 'summaryView':
        default:
          document.querySelector('.default-view-button-on').className = 'default-view-button-off';
          break;
      }
    }
  }

  resizeText(dir) {
    if (document.documentElement.style.fontSize === '') {
      document.documentElement.style.fontSize = '1.0rem';
    }

    let size = parseFloat(document.documentElement.style.fontSize);

    if (dir === '+' && size < config.maxTextSize) {
      size += config.textSizeStep;
      this.setState({ currentTextSize: size });
      document.documentElement.style.fontSize = `${size}rem`;
    } else if (dir === '-' && size > config.minTextSize) {
      size -= config.textSizeStep;
      this.setState({ currentTextSize: size });
      document.documentElement.style.fontSize = `${size}rem`;
    }
  }

  resetTextSize() {
    this.setState({ currentTextSize: 1.0 });
    document.documentElement.style.fontSize = '1.0rem';
  }

  itemClick(itemName) {
    if (!this.props.modalIsOpen) {
      this.setState({ modalName: itemName }); // Record which button was clicked for subsequent close
      this.props.modalFn(itemName); // Let parent know to open the modal

      // Turn "on" the appropriate item
      switch (itemName) {
        case 'logoModal':
          for (const logoClass of this.state.logoClasses) {
            document.querySelector(`.${logoClass}-off`).className = `${logoClass}-on`;
          }
          break;
        default:
          break;
      }
    }
  }

  renderMenu() {
    return (
      <div className="header-menu" onMouseLeave={() => !this.state.themesMenuIsOpen && this.setState({ menuIsOpen: false })}>
        <div className="header-menu-help" onClick={() => this.itemClick('helpModal')}>Help</div>
        {/* <div className='header-menu-download' onClick={() => this.itemClick('downloadModal')}>Download</div>
      <div className='header-menu-print'    onClick={() => this.itemClick('printModal')}>Print</div> */}
        <div className="header-menu-theme" onClick={() => this.setState({ themesMenuIsOpen: true })}>Theme &nbsp;&#9654;</div>
      </div>
    );
  }

  renderThemesMenu() {
    return (
      <div className="header-submenu" onMouseLeave={() => this.setState({ menuIsOpen: false, themesMenuIsOpen: false })}>
        { this.renderThemes() }
      </div>
    );
  }

  renderThemes() {
    const divs = [];
    if (this.themes) {
      for (const theme of this.themes) {
        // If no theme is set mark the (hopefully) one theme with isDefault === true as the current selected theme
        const divClass = !this.context.themeName ? (theme.isDefault ? 'header-menu-subitem-selected' : 'header-menu-subitem')
          : (this.context.themeName === theme.name ? 'header-menu-subitem-selected' : 'header-menu-subitem');
        divs.push(<div className={divClass} key={theme.name} onClick={() => this.themeClick(theme.name)}>{theme.name}</div>);
      }
    }
    return divs;
  }

  themeClick(themeName) {
    this.setState({ menuIsOpen: false, themesMenuIsOpen: false });
    this.context.updateGlobalContext({ themeName });
  }

  viewClick(viewName) {
    // Clear previous interval if still pending
    this.clearViewHelpInterval();

    if (viewName !== this.state.currentViewName) {
      // Clicked different view
      this.setState({ currentViewName: viewName });
      this.props.viewFn(viewName); // Let parent know which view was selected

      // Turn "on" the appropriate button
      switch (viewName) {
        case 'reportView':
          document.querySelector('.longitudinal-view-button-off').className = 'longitudinal-view-button-on';
          break;
        case 'compareView':
          document.querySelector('.compare-view-button-off').className = 'compare-view-button-on';
          break;
        case 'financialView':
          document.querySelector('.benefits-view-button-off').className = 'benefits-view-button-on';
          break;
          //      case 'consultView':
          //         document.querySelector('.consult-view-button-off').className = 'consult-view-button-on';
          //         break;
          //      case 'diabetesView':
          //         document.querySelector('.diabetes-view-button-off').className = 'diabetes-view-button-on';
          //         break;
        case 'tilesView':
          document.querySelector('.tiles-view-button-off').className = 'tiles-view-button-on';
          break;
        case 'summaryView':
        default:
          document.querySelector('.default-view-button-off').className = 'default-view-button-on';
          break;
      }

      // Open help if closed then reset interval
      if (config.showViewHelp && !this.state.viewHelpIsOpen) {
        this.setState({ viewHelpIsOpen: true });
      }
      this.setViewHelpInterval();
    } else {
      // Clicked same view -- toggle help
      if (!this.state.viewHelpIsOpen) {
        this.setViewHelpInterval();
      }
      this.setState({ viewHelpIsOpen: !this.state.viewHelpIsOpen });
    }
  }

  setViewHelpInterval() {
    if (config.viewHelpCloseTime > 0) {
      this.viewHelpInterval = setInterval(
        () => {
          const remaining = this.state.viewHelpRemainingTime - 1;
          this.setState({ viewHelpRemainingTime: remaining });
          if (remaining === 0) {
            this.setState({ viewHelpIsOpen: false });
            this.clearViewHelpInterval();
          }
        }, 1000,
      );

      this.setState({ viewHelpRemainingTime: config.viewHelpCloseTime });
    }
  }

  clearViewHelpInterval() {
    if (this.viewHelpInterval) {
      clearInterval(this.viewHelpInterval);
      this.viewHelpInterval = null;
      this.setState({ viewHelpRemainingTime: 0 });
    }
  }

  onCloseViewHelp = () => {
    this.setState({ viewHelpIsOpen: false });
    this.clearViewHelpInterval();
  }

  //   get viewHelpTitle() {
  //      return {
  //   reportView: '',
  /// /   compareView: 'Compare',
  /// /   summaryView: 'Summary',
  /// /   financialView: 'Financial',
  /// /   consultView: 'Consult',
  /// /   diabetesView: 'Diabetes'
  //      }
  //   }

  get viewHelpText() {
    return {
      reportView: <div>
        <b>Timeline</b>
        {' '}
        shows your detailed clinical and payer data over time.
                  </div>,
      compareView: <div>
        <b>Compare</b>
        {' '}
        shows which providers have records of your unique clinical data.
                   </div>,
      summaryView: <div>
        <b>Summary</b>
        {' '}
        shows an overview of your data.
                   </div>,
      tilesView: <div>
        <b>Catalog</b>
        {' '}
        lists your unique clinical data by type.
                 </div>,
      financialView: <div>
        <b>Payer</b>
        {' '}
        presents your claims and benefits data.
                     </div>,
      //   consultView: <div>The <b>Consult View</b> shows a knowledge-annotated view of your conditions over time or for one point in time.</div>,
      //   diabetesView: <div>The <b>Diabetes View</b> shows data specific to this condition.</div>
    };
  }

  get viewHelpIconClass() {
    return {
      reportView: 'view-help-title-longitudinal-view',
      compareView: 'view-help-title-compare-view',
      summaryView: 'view-help-title-default-view',
      financialView: 'view-help-title-benefits-view',
      //   consultView: 'view-help-title-consult-view',
      //   diabetesView: 'view-help-title-diabetes-view'
    };
  }

  renderViewHelp() {
    return (
      <Draggable>
        <div className="view-help-container">
          {/* <div className='view-help-title-container'>
          <div className='view-help-title'>
         <div className={this.viewHelpIconClass[this.state.currentViewName]}>
      { this.viewHelpTitle[this.state.currentViewName]
        + (config.viewHelpCloseCountdown ? ' (' + this.state.viewHelpRemainingTime + ' sec)' : '') }
         </div>
         <button className='view-help-close-button' onClick={this.onCloseViewHelp} />
            </div>
         </div> */}
          <div className="view-help-contents">
            { this.viewHelpText[this.state.currentViewName] }
          </div>
          <div className="view-help-contents-icon" />
        </div>
      </Draggable>
    );
  }

  render() {
    return (
      <div className="page-header">
        <div className="logo-box">
          { this.state.logoClasses.map(
            (logoClass, index) => <button className={`${logoClass}-off`} key={logoClass + index} onClick={() => this.itemClick('logoModal')} />,
          )}
        </div>
        <div className="view-controls-box">
          <button className="default-view-button-off" onClick={() => this.viewClick('summaryView')}>Summary</button>
          <button className="tiles-view-button-off" onClick={() => this.viewClick('tilesView')}>Catalog</button>
          <button className="compare-view-button-off" onClick={() => this.viewClick('compareView')}>Compare</button>
          <button className="longitudinal-view-button-off" onClick={() => this.viewClick('reportView')}>Timeline</button>
          { config.enablePayer && <button className="benefits-view-button-off" onClick={() => this.viewClick('financialView')}>Payer</button> }
          { config.enableCollections && <button className="view-button-no-op">Collections</button> }
          { config.enablePathfinder && <button className="view-button-no-op">Pathfinder</button> }
          { config.enableConsult && <button className="consult-view-button-off" onClick={() => this.viewClick('consultView')}>Consult</button> }
          { config.enableDiabetes && <button className="diabetes-view-button-off" onClick={() => this.viewClick('diabetesView')}>Conditions</button> }
        </div>
        {/* this.state.viewHelpIsOpen && this.renderViewHelp() */}
        {/* <div className='patient-name'>
         { this.props.resources && formatPatientName(this.props.resources.pathItem('[category=Patient].data.name')) }
       </div> */}
        { config.enableSearch && this.props.resources && <Search data={this.props.resources.transformed} callback={this.props.searchCallback} />}
        { config.enableTextSizing && (
        <div className="header-controls-box">
          {/* make highlight active/inactive first <button className={'inactive-light-'+(this.state.inactiveLight ? 'on' : 'off')}>Inactive</button> */}
          <button className="text-size-smaller-button-off" onClick={() => this.resizeText('-')}>A</button>
          <div className="text-size-slider-container">
            <div className="text-size-slider-button" />
          </div>
          <button className="text-size-larger-button-off" onClick={() => this.resizeText('+')}>A</button>
        </div>
        ) }
        {/* <div className='text-size-current'    onClick={() => this.resetTextSize()}>
           {Math.round(this.state.currentTextSize*100)}%
       </div> */}

        { config.enableMenu && (
        <button
          className={this.state.menuIsOpen ? 'header-menu-button-open' : 'header-menu-button'}
          onClick={() => this.state.modalName === '' && this.setState({ menuIsOpen: !this.state.menuIsOpen })}
        />
        ) }
        { this.state.menuIsOpen && this.renderMenu() }
        { this.state.themesMenuIsOpen && this.renderThemesMenu() }
      </div>
    );
  }
}

import React from 'react';
import ReactDOM from 'react-dom';
import {
  useRecoilValue,
} from 'recoil';
import PropTypes from 'prop-types';

import { dotClickContextState } from '../StandardFilters';

import './ContentPanel.css';
import config from '../../config.js';
import { log } from '../../utils/logger';
import {
  Const, stringCompare, inDateRange, notEqJSON, classFromCat, groupBy, dateOnly,
} from '../../util.js';
import FhirTransform from '../../FhirTransform.js';

import Allergies from '../Allergies';
import Benefits from '../Benefits';
import Claims from '../Claims';
import Conditions from '../Conditions';
import DocumentReferences from '../DocumentReferences';
// import Encounters from '../Encounters';
import Encounters from '../cards/Encounters'
import Exams from '../Exams';
import Immunizations from '../Immunizations';
import LabResults from '../LabResults';
import MedsAdministration from '../MedsAdministration';
import MedsDispensed from '../MedsDispensed';
import MedsRequested from '../MedsRequested';
import MedsStatement from '../MedsStatement';
import Procedures from '../Procedures';
import ProcedureRequests from '../ProcedureRequests';
import SocialHistory from '../SocialHistory';
import VitalSigns from '../VitalSigns';
import Unimplemented from '../Unimplemented';

// import ListView from './ListView';

import DiscoveryContext from '../DiscoveryContext';
import PersistentDrawerRight from './Drawer';

//
// Render the content panel for ReportView, FinancialView, TilesView
//
// NOTE: This would be much simplified by use of a functioning virtual list that
//       supports variable height elements, e.g. (when finished):
//       https://github.com/bvaughn/react-window/issues/6
//

class ContentPanel extends React.PureComponent {
  static myName = 'ContentPanel';

  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    context: PropTypes.shape({
      parent: PropTypes.string,
      rowName: PropTypes.string,
      dotType: PropTypes.string,
      allDates: PropTypes.arrayOf(PropTypes.shape({
        position: PropTypes.number,
        date: PropTypes.string,
      })),
      minDate: PropTypes.string,
      maxDate: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      date: PropTypes.string,
      data: PropTypes.array,
    }), // added dynamically by StandardFilters
    catsEnabled: PropTypes.object.isRequired,
    provsEnabled: PropTypes.object.isRequired,
    nextPrevFn: PropTypes.func, // added dynamically by StandardFilters
    thumbLeftDate: PropTypes.string.isRequired,
    thumbRightDate: PropTypes.string.isRequired,
    viewName: PropTypes.string.isRequired,
    viewIconClass: PropTypes.string.isRequired,
    // ------ note that resources are not no directly receiving recoil state "resources":
    resources: PropTypes.instanceOf(FhirTransform),
    // resources: PropTypes.shape({
    //   legacy: PropTypes.instanceOf(FhirTransform),
    // }),
    patient: PropTypes.shape({}),
    providers: PropTypes.arrayOf(PropTypes.string),
    // ------
    totalResCount: PropTypes.number,
    catsToDisplay: PropTypes.arrayOf(PropTypes.string),
    showAllData: PropTypes.bool,
    dotClickFn: PropTypes.func,
    initialTrimLevel: PropTypes.string,
    containerClassName: PropTypes.string.isRequired,
    topBoundFn: PropTypes.func.isRequired,
    bottomBoundFn: PropTypes.func.isRequired,
    onResizeFn: PropTypes.func,
    tileSort: PropTypes.bool, // true --> "tile order sort", else default "report order sort"
    noResultDisplay: PropTypes.string,
  }

  state = {
    openPhase: null,
    isOpen: false,

    panelHeight: 0, // Height of top-level container
    contentHeight: 0, // Height of content-panel-inner-body(-alt) div
    positionY: 0,
    dragging: false,
    lastDragUpdateTimestamp: 0,
    prevEnabled: true,
    nextEnabled: true,
    //      showAllData: false,
    showAllData: true,
    showDotLines: true,
    trimLevel: this.props.initialTrimLevel ? this.props.initialTrimLevel : Const.trimNone,
    showJSON: false,
    //      showAnnotation: false,

    currResources: null,
    updateResourcesPhase: null,

    //      initialPositionYFn: null,
    datesAscending: false, // Display dates in ascending order?
    onlyAnnotated: false,
  }

  manageOpenSeq() {
    switch (this.state.openPhase) {
      case null: // Initial state
        if (this.props.open) {
          this.setState({
            isOpen: true,
            openPhase: 'setPanels',
          });
        }
        break;

      case 'setPanels':
        // this.setPanelHeights();
        this.setState({ openPhase: 'open' });
        break;

      case 'open': // Terminal state
      default:
        break;
    }
  }

  manageUpdateResourcesSeq(update) {
    switch (this.state.updateResourcesPhase) {
      case null: // Initial/terminal state
      default:
        if (update) {
          this.setState({
            currResources: this.calcCurrResources(),
            updateResourcesPhase: 'p2',
          });
        }
        break;

      case 'p2':
        this.highlightResourcesFromClickedDot();
        //      let resIndex = this.targetResIndex(this.props.context);
        this.setState({ // pageResource: resIndex,
          updateResourcesPhase: null,
        });
        break;
    }
  }

  componentDidMount() {
    this.manageOpenSeq();
    this.manageUpdateResourcesSeq(true);

    //      this.setState({ onlyAnnotated: this.context.onlyAnnotated },
    //        () => this.setState({ currResources: this.calcCurrResources() }));
    this.setState({ onlyAnnotated: this.context.onlyAnnotated });

    // this.updateDraggableOnMount();
    // window.addEventListener('resize', this.updateDraggableOnResize);
    // window.addEventListener('keydown', this.onKeydown);
  }

  componentWillUnmount() {
    // window.removeEventListener('resize', this.updateDraggableOnResize);
    // window.removeEventListener('keydown', this.onKeydown);
  }

  // For views with clickable dots (and displayed resources), highlight resources matching the date of the current dot
  highlightResourcesFromClickedDot() {
    // TODO: is dotClickFn correct here?
    if (this.props.dotClickFn && this.props.context) {
      const dotResources = this.props.resources.transformed.filter((res) => res.itemDate
        && dateOnly(res.itemDate) === dateOnly(this.props.context.date));
      this.context.updateGlobalContext({ lastHighlightedResources: dotResources });
    }
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (notEqJSON(this.props, nextProps)) {
  //     // Prop change
  //     // window.logDiffs && logDiffs('Props', this.props, nextProps);
  //     return true;
  //   } if (notEqJSON(this.state, nextState)) {
  //     // State change
  //     // window.logDiffs && logDiffs('State', this.state, nextState);
  //     return true;
  //   }
  //   // No change
  //   return false;
  // }

  static getDerivedStateFromProps(_props, _state) {
    return null;
  }

  getSnapshotBeforeUpdate(_prevProps, _prevState) {
    // Capture info from the DOM before it is updated
    // Return value is passed as 'snapshot' to componentDidUpdate()
    // logDiffs('Props', prevProps, this.props);
    // logDiffs('State', prevState, this.state);
    return null;
  }

  componentDidUpdate(prevProps, prevState, _snapshot) {
    const doUpdateResources = notEqJSON(prevProps, this.props)
      || prevState.showAllData !== this.state.showAllData
      || prevState.trimLevel !== this.state.trimLevel
      || prevState.onlyAnnotated !== this.state.onlyAnnotated;

    this.manageOpenSeq();
    this.manageUpdateResourcesSeq(doUpdateResources);

    if (notEqJSON(prevProps, this.props)) {
      // this.setState({
      //   prevEnabled: this.props.context.date !== this.props.context.minDate,
      //   nextEnabled: this.props.context.date !== this.props.context.maxDate,
      // });
    }

    log('componentDidUpdate() END');
  }

  //
  //  Determine the index of the target resource in currResources from 'context'
  //
  targetResIndex(context) {
    const targetDate = dateOnly(context.date);
    switch (context.parent) {
      case 'TimeWidget':
        return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate); // find date in currResources

      case 'Category':
        return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate // find date+category in currResources
          && elt.category === context.rowName);

      case 'Provider':
        return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate // find date+provider in currResources
          && elt.provider === context.rowName);

      default:
        return -1;
    }
  }

  sortResources(resArray) {
    return resArray.sort((a, b) => {
      if (this.props.tileSort) {
        if (a.category !== b.category) {
          // Primary sort: ascending category order
          return stringCompare(a.category, b.category);
        }
        // Secondary sort: ascending primary display item order
        const aPrimary = this.primaryText(a);
        const bPrimary = this.primaryText(b);
        if (aPrimary !== bPrimary) {
          return stringCompare(aPrimary, bPrimary);
        }
        // Tertiary sort: ascending/descending date order
        return this.state.datesAscending ? new Date(a.itemDate).getTime() - new Date(b.itemDate).getTime()
          : new Date(b.itemDate).getTime() - new Date(a.itemDate).getTime();
      }
      const aMillis = new Date(a.itemDate).getTime();
      const bMillis = new Date(b.itemDate).getTime();
      if (aMillis !== bMillis) {
        // Primary sort: ascending/descending date order
        return this.state.datesAscending ? aMillis - bMillis
          : bMillis - aMillis;
      }
      // Secondary sort: ascending category order
      if (a.category !== b.category) {
        return stringCompare(a.category, b.category);
      }
      // Tertiary sort: category-specific order
      return this.compareFn(a.category)(a, b);
    });
  }

  //
  //  Collect an array of resources matching catsToDisplay, search state, thumb positions, showAllDate, and onlyAnnotated.
  //
  //  props.tileSort === false:
  //    Sorted by date descending (if state.datesAscending === false), then category ascending, then category-specific order
  //
  //  props.tileSort === true:
  //    Sorted by category ascending, then primary display item ascending, then date descending (if state.datesAscending === false)
  //
  //  @@@Sets state.currResources
  //
  calcCurrResources() {
    let arr = [];
    log(`calcCurrResources() - start: ${new Date().getTime()}`);
    const limitedResources = this.props.catsToDisplay ? this.props.resources.transformed.filter((res) => this.props.catsToDisplay.includes(res.category)
      && res.category !== 'Patient'
      && this.catEnabled(res.category)
      && this.provEnabled(res.provider)
      && inDateRange(res.itemDate, this.props.thumbLeftDate,
        this.props.thumbRightDate)
      && (!this.state.onlyAnnotated || (res.data.discoveryAnnotation
        && res.data.discoveryAnnotation.annotationHistory))) : this.props.resources.transformed.filter((res) => res.category !== 'Patient'
      && this.catEnabled(res.category)
      && this.provEnabled(res.provider)
      && inDateRange(res.itemDate, this.props.thumbLeftDate,
        this.props.thumbRightDate)
      && (!this.state.onlyAnnotated || (res.data.discoveryAnnotation
        && res.data.discoveryAnnotation.annotationHistory)));

    if (this.state.showAllData && this.context.searchRefs.length > 0) {
      arr = this.sortResources(this.context.searchRefs.map((ref) => ref.resource));
    } else if (this.state.showAllData) {
      arr = this.sortResources(limitedResources);
    } else {
      arr = this.sortResources(limitedResources.filter((res) => res.itemDate === this.props.context.date));
    }

    log(`Resources: ${arr.length}`);
    log(`calcCurrResources() - END: ${new Date().getTime()}`);

    return arr;
  }

  //   onClose = () => {
  //      this.setState({ isOpen:false });
  //      this.props.onClose();
  //   }

  onNextPrev = (direction) => {
    try {
      const enabled = this.props.nextPrevFn(direction);
      if (direction === 'prev') {
        this.setState({ prevEnabled: enabled, nextEnabled: true });
      } else {
        this.setState({ prevEnabled: true, nextEnabled: enabled });
      }
    } catch (e) {
      log(`ContentPanel - onNextPrev(): ${e.message}`);
    }
  }

  catEnabled(cat) {
    // Map unimplemented categories to the "Unimplemented/Not in S4S" meta-category
    const testCat = Unimplemented.unimplementedCats.includes(cat) ? Unimplemented.catName : cat;
    return this.props.catsEnabled[testCat] || this.props.catsEnabled[testCat] === undefined;
  }

  provEnabled(prov) {
    return this.props.provsEnabled[prov] || this.props.provsEnabled[prov] === undefined;
  }

  copyReverse(arr) {
    const revArr = [];
    for (let i = arr.length - 1; i >= 0; i--) {
      revArr.push(arr[i]);
    }
    return revArr;
  }

  // Count resources in 'resArray' where their category is enabled
  enabledResources(resArray) {
    let count = 0;
    for (const thisRes of resArray) {
      if (this.catEnabled(thisRes.category)) {
        count++;
      }
    }
    return count;
  }

  compareFn(cat) {
    return classFromCat(cat).compareFn;
  }

  primaryText(elt) {
    return classFromCat(elt.category).primaryText(elt);
  }

  noneEnabled(obj) {
    for (const propName of Object.keys(obj)) {
      if (obj[propName]) {
        return false;
      }
    }
    return true;
  }

  get noResultDisplay() {
    if (this.noneEnabled(this.props.catsEnabled)) {
      return 'No Record type is selected';
    } if (this.noneEnabled(this.props.provsEnabled)) {
      return 'No Provider is selected';
    }
    return this.props.noResultDisplay ? this.props.noResultDisplay : 'No matching data';
  }

  renderItems = (arr) => {
    console.log('arr', arr)
    log('renderItems');
    const showDate = this.state.showAllData;
    const resultDivs = [];
    let groups = {};

    if (this.props.tileSort) {
      groups = groupBy(arr, (elt) => `${elt.category}-${this.primaryText(elt)}-${elt.itemDate}`);
    } else {
      groups = groupBy(arr, (elt) => `${elt.category}-${elt.itemDate}`);
    }

    const { patient, providers, viewName } = this.props;
    const { trimLevel } = this.state;

    const legacyProps = {
      patient,
      providers,
      trimLevel,
      viewName,
    };

    // Render each group
    for (const groupKey in groups) {
      const group = groups[groupKey];
      switch (group[0].category) {
        case 'Allergies':
          resultDivs.push(<Allergies
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Allergies.catName)}
          />);
          break;
        case 'Benefits':
          resultDivs.push(<Benefits
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            legacyResources={this.props.resources}
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Benefits.catName)}
          />);
          break;
        case 'Claims':
          resultDivs.push(<Claims
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            legacyResources={this.props.resources}
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Claims.catName)}
          />);
          break;
        case 'Conditions':
          resultDivs.push(<Conditions
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Conditions.catName)}
          />);
          break;
        case 'Document References':
          resultDivs.push(<DocumentReferences
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(DocumentReferences.catName)}
          />);
          break;
        case 'Encounters':
          resultDivs.push(<Encounters
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Encounters.catName)}
          />);
          break;
        case 'Exams':
          resultDivs.push(<Exams
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Exams.catName)}
          />);
          break;
        case 'Immunizations':
          resultDivs.push(<Immunizations
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Immunizations.catName)}
          />);
          break;
        case 'Lab Results':
          resultDivs.push(<LabResults
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(LabResults.catName)}
            resources={this.props.resources}
            dotClickFn={this.props.dotClickFn}
          />);
          break;
        case 'Meds Administration':
          resultDivs.push(<MedsAdministration
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(MedsAdministration.catName)}
          />);
          break;
        case 'Meds Dispensed':
          resultDivs.push(<MedsDispensed
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(MedsDispensed.catName)}
          />);
          break;
        case 'Meds Requested':
          resultDivs.push(<MedsRequested
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            legacyResources={this.props.resources}
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(MedsRequested.catName)}
          />);
          break;
        case 'Meds Statement':
          resultDivs.push(<MedsStatement
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(MedsStatement.catName)}
          />);
          break;
        case 'Procedures':
          resultDivs.push(<Procedures
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            legacyResources={this.props.resources}
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Procedures.catName)}
          />);
          break;
        case 'Procedure Requests':
          resultDivs.push(<ProcedureRequests
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(ProcedureRequests.catName)}
          />);
          break;
        case 'Social History':
          resultDivs.push(<SocialHistory
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(SocialHistory.catName)}
          />);
          break;
        case 'Vital Signs':
          resultDivs.push(<VitalSigns
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(VitalSigns.catName)}
            resources={this.props.resources}
            dotClickFn={this.props.dotClickFn}
          />);
          break;
        case 'Unimplemented':
        default:
          resultDivs.push(<Unimplemented
            key={groupKey}
            {...legacyProps} // eslint-disable-line react/jsx-props-no-spreading
            data={group}
            showDate={showDate}
            isEnabled={this.catEnabled(Unimplemented.catName)}
          />);
          break;
      }
    }

    return resultDivs.length > 0 ? resultDivs : (
      <div
        className="content-panel-no-data"
        key="1"
      >
        {this.noResultDisplay}
      </div>
    );
  }

  renderDotOrAll() {
    const divs = this.state.currResources && this.state.currResources.length > 0
      ? this.renderItems(this.state.currResources)
      : [(
        <div
          className="content-panel-no-data"
          key="1"
        >
          {this.noResultDisplay}
        </div>
      )];
    return (
      <div className="content-right-inner-body">
        { this.state.showJSON
          ? (
            <pre className="content-panel-data">
              { JSON.stringify(this.state.currResources, null, 3) }
            </pre>
          )
          : divs }
      </div>
    );
  }

  isVirtualDisplay() {
    return this.state.currResources.length >= config.contentPanelUseWindowing;
  }

  onlyAnnotatedChange = (event) => {
    //      console.log('annotated change: ' + event.target.checked);
    this.setState({ onlyAnnotated: event.target.checked });
    this.context.updateGlobalContext({ onlyAnnotated: event.target.checked });
  }

  renderContents() {
    // console.info('this.isVirtualDisplay: ', this.isVirtualDisplay());
    const contents = !this.state.currResources || this.renderDotOrAll();
    // console.info('contents: ', contents);

    return (
      <div>
        <div className="content-panel-inner-title">
          <div className="content-panel-inner-title-left">
            <div className="content-panel-item-count">
              { `Displaying ${this.state.currResources.length} of ${this.props.totalResCount} record${this.props.totalResCount === 1 ? '' : 's'}` }
            </div>

            { config.enableContentPanelLeftRight && (
              <button
                className={`content-panel-left-button${this.state.prevEnabled ? '' : '-off'}`}
                onClick={() => this.onNextPrev('prev')}
              />
            ) }
            { config.enableContentPanelLeftRight && (
              <button
                className={`content-panel-right-button${this.state.nextEnabled ? '' : '-off'}`}
                onClick={() => this.onNextPrev('next')}
              />
            ) }
            { config.enableShowLess && (
              <button
                className="content-panel-show-details-button"
                onClick={this.toggleTrimLevel}
              >
                { this.state.trimLevel === Const.trimNone ? 'Show Less' : 'Show More' }
              </button>
            ) }
          </div>
          <div className="content-panel-inner-title-center" />
          <div className="content-panel-inner-title-right">
            { config.enableOnlyRecordsWithNotes && (
              <label className="check-only-annotated-label">
                <input
                  className="check-only-annotated-check"
                  type="checkbox"
                  checked={this.state.onlyAnnotated}
                  onChange={this.onlyAnnotatedChange}
                />
                Only records with my notes
              </label>
            ) }
            <button
              className={`content-panel-json-button${this.state.showJSON ? '' : '-off'}`}
              onClick={() => this.setState({ showJSON: !this.state.showJSON })}
            />
          </div>
        </div>
        <div className="content-panel-body">
          { contents }
        </div>
      </div>
    );
  }

  render() {
    console.info('this.props.context: ', this.props.context);
    // Locally extend DiscoveryContext with trimLevel & viewName (hack)

    if (!this.state.isOpen) {
      return null;
    }

    const detailsRightTarget = document.getElementById('details-right');
    if (detailsRightTarget) {
      return ReactDOM.createPortal((
        <PersistentDrawerRight>
          <div className="record-list">
            { this.state.currResources && this.props.context && this.renderContents() }
          </div>
        </PersistentDrawerRight>
      ), detailsRightTarget);
    }

    // Dragging enabled/disabled by changing bounds.bottom
    return (
      <div>
        { this.state.currResources && this.props.context && this.renderContents() }
      </div>
    );
  }
}

const ContentPanelHOC = React.memo((props) => {
  const dotClickContext = useRecoilValue(dotClickContextState);

  return (
    <ContentPanel
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      context={dotClickContext}
    />
  );
});

ContentPanelHOC.propTypes = ContentPanel.propTypes;

export default ContentPanelHOC;

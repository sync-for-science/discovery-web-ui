import React from 'react';
import { get } from 'axios';
import queryString from 'query-string';

import './ParticipantList.css';
import ParticipantListItem from '../ParticipantListItem';
import config from '../../config.js';

//
// Render the list of participants
//
export default class ParticipantList extends React.Component {
   state = {
     participants: {},
     isLoading: false,
     fetchError: null,
     logoClasses: ['logo-s4s-button'], // Parsed from query string 'logos=a,b,c'
     menuIsOpen: false,
     listNames: null,
     currentList: 'All',
   }

   componentDidMount() {
     const queryVals = queryString.parse(this.props.location.search);
     if (queryVals.logos) {
       this.setState({ logoClasses: queryVals.logos.split(',') });
     }
     this.setState({ isLoading: true });
     get(`${config.serverUrl}/participants`)
       .then((response) => this.setState({ participants: response.data, listNames: this.generateListNames(response.data), isLoading: false }))
       .catch((fetchError) => this.setState({ fetchError, isLoading: false }));
   }

   generateListNames(participants) {
     const listNames = [];
     for (const participantId in participants) {
       if (participants[participantId].lists) {
         for (const listName of participants[participantId].lists) {
           if (!listNames.includes(listName)) {
             listNames.push(listName);
           }
         }
       }
     }
     listNames.push('All');
     return listNames;
   }

   menuItemClick(listName) {
     this.setState({ menuIsOpen: false, currentList: listName });
   }

   renderMenu() {
     return (
       <div className="participant-list-menu" onMouseLeave={() => this.setState({ menuIsOpen: false })}>
         { this.state.listNames.map((name) => <div className="participant-list-menu-item" key={name} onClick={() => this.menuItemClick(name)}>{name}</div>) }
       </div>
     );
   }

   renderList() {
     const { participants, isLoading, fetchError } = this.state;
     const results = [];

     if (fetchError) {
       return <p>{ `ParticipantList: ${fetchError.message}` }</p>;
     }

     if (isLoading) {
       return <p>Loading ...</p>;
     }

     for (const participantId in participants) {
       if (this.state.currentList === 'All' || (participants[participantId].lists && participants[participantId].lists.includes(this.state.currentList))) {
         results.push(<ParticipantListItem
           key={participantId}
           id={participantId}
           participant={participants[participantId]}
           rawQueryString={this.props.location.search}
         />);
       }
     }
     return results;
   }

   render() {
     return (
       <div className="participant-list">
         <div className="participant-list-header">
           <div className="logo-box">
             { this.state.logoClasses.map(
               (logoClass, index) => <div className={`${logoClass}-off`} key={logoClass + index} />,
             )}
           </div>
           <button
             className={this.state.menuIsOpen ? 'participant-list-menu-button-open' : 'participant-list-menu-button'}
             onClick={() => this.setState({ menuIsOpen: !this.state.menuIsOpen })}
           />
           { this.state.menuIsOpen && this.renderMenu() }
         </div>

         <div className="participant-list-content">
           <div className="participant-list-title">
             Select a Participant to View Details
             {this.state.currentList === 'All' ? '' : ` (${this.state.currentList})`}
           </div>
           <div className="participant-list-content-data">
             <div className="participant-list-header-wrapper">
               <div className="participant-list-column-header-name-id">Participant</div>
               <div className="participant-list-column-header-gender">Gender</div>
               <div className="participant-list-column-header-dob">DOB</div>
               <div className="participant-list-column-header-dates">Date Range</div>
               <div className="participant-list-column-header-providers">Providers</div>
               <div className="participant-list-column-header-values">Data Values</div>
             </div>
             <div className="participant-list-data-wrapper">
               { this.renderList() }
             </div>
           </div>
         </div>
       </div>
     );
   }
}

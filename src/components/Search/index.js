import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';
import Unimplemented from '../Unimplemented';

import './Search.css';
import config from '../../config.js';
import { uniqueBy } from '../../util.js';
import notInterestingFields from './notInterestingFields.js';
import notInterestingWords from './notInterestingWords.js';
import veryInterestingFields from './veryInterestingFields.js';

//
// Render the DiscoveryApp Search Widget
//
export default class Search extends React.Component {

   static propTypes = {
      data: PropTypes.array.isRequired,		// Data (resources) to index/search
      callback: PropTypes.func.isRequired	// Return search results to parent
   }
    
   state = {
      searchIsOpen: false,	// Is the search input field displayed?
      searchFor: '',		// Contents of the search input field
      searchStatus: '',		// The displayed status string
      searchTerms: '',		// Count of terms indexed ('nnn terms')
      searchTree: null,		// The data structure resulting from data indexing
      searchResults: null,	// Array of references to resources matching 'searchFor'
      totalSearchRefs: 0,	// Count of all references for indexed terms
      dataModalIsOpen: false,	// Is the dataModal open? (JSON data display) 
      laserSearch: false	// Is laserSearch on? (only display data elements containing a search word)
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
      this.setState({ searchStatus: 'Indexing...' }, () => setTimeout(this.indexData, 10));
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
   }

   //
   // Handle Esc key (cancel search)
   //
   onKeydown = (event) => {
      if (this.state.searchIsOpen && event.key === 'Escape') {
	 if (this.state.searchFor.length === 0) {
	    this.setState({ searchIsOpen: false });
	 } else {
	    this.setState({ searchFor: '', searchStatus: this.state.searchTerms, searchResults: null });
	 }
	 this.props.callback([], [], this.state.laserSearch);
      }
   }

   //
   // Index this participant's data when component loads
   //
   // TODO: remove some items from each dotRef (duplicates of resource)
   indexData = () => {
      let tree = { match: '', complete: [], next: [], refs: [] };

      // Index the resources for this participant
      for (let res of this.props.data) {
	 if (res.category !== 'Patient' && !Unimplemented.unimplementedCats.includes(res.category)) {
	    this.indexResource(tree, res.data, { resource: res, provider: res.provider, category: res.category, date: res.itemDate, veryInteresting: false });
	 }
      }
      let terms = tree.next.reduce((accum, elt) => accum + elt.complete.length, 0) + ' terms';
      let totalRefs = tree.next.reduce((accum, elt) => accum + elt.refs.length, 0);
      this.setState({ searchTree: tree, searchTerms: terms, searchStatus: terms, totalSearchRefs: totalRefs });
   }

   // Index this resource
   indexResource(tree, res, dotRef) {
      switch (typeof res) {
         case 'object':
	    if (res instanceof Array) {
	       // An array
	       for (let elt of res) {
		  this.indexResource(tree, elt, dotRef);
	       }
	    } else if (res === null) {
	       // Ignore
	    } else {
	       // An object
	       for (let propName in res) {
		  if (notInterestingFields.includes(propName)) {
		     // Ignore
		  } else if (veryInterestingFields.includes(propName)) {
		     // Interesting
		     dotRef.veryInteresting = true
		     this.indexResource(tree, res[propName], dotRef);
		  } else {
		     this.indexResource(tree, res[propName], dotRef);
		  }
	       }
	    }
	    break;

         case 'string':
	    let resStr = res+'';
	    if (resStr === 'true' || resStr === 'false' || !isNaN(resStr)) {
	       break;
            }

	    if (resStr.length > 0) {
	       // Add each (space-delimited) word of the item (dropping commas, brackets) to the search tree
	       for (let word of resStr.split(' ')) {
		  let cleanWord = word.replace(',', '').replace('[', '').replace(']', '');
		  if (cleanWord.length <= config.searchMaxWordLength && !notInterestingWords.includes(cleanWord.toLowerCase())) {
		     this.addToTree(tree, 1, cleanWord, dotRef);
		  }
	       }
	    }
	    break;

         case 'symbol':
         case 'function':
         case 'number':
         case 'boolean':
         default:
	    // Ignore
	    break;
      }
   }

   //
   // Extend the search tree
   //
   addToTree(tree, level, value, dotRef) {
      let lcValue = value.toLowerCase();
      if (level > 1) {
	 if (!tree.complete.find(elt => elt.toLowerCase() === lcValue)) {
	    // Cache new completion value and (re)sort (could use binary insert instead)
	    tree.complete.push(value);
	    tree.complete.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	 }

	 // Final leaf & ref not already recorded?
	 if (!tree.refs.includes(dotRef)) {
	    tree.refs.push(dotRef);
	 }

	 if (tree.match === lcValue) {
	    return;
	 }
      }

      // Find matching sub-tree
      let match = lcValue.substring(0, level);
      for (let next of tree.next) {
	 if (next.match === match) {
	     this.addToTree(next, level+1, value, dotRef);
	     return;
	 }
      }

      // No match -- create a new branch
      let newBranch = { match: match, complete: [], next: [], refs: [] }; 
      tree.next.push(newBranch);
      this.addToTree(newBranch, level+1, value, dotRef);
   }

   //
   // Collect array of references to participant resources matching 'searchFor'
   //
   // Each ref consists of:
   //     .resource			the resource
   //     .provider (string)		resource's provider
   //     .category (string)		resource's category
   //     .date (string)		resource's date
   //     .veryInteresting (bool)	is the field that contains a word in 'searchFor' considered "interesting"? [currently unused]
   //     .position (number)		resource's timeline position [0..1]
   //
   collectRefs(searchFor) {
      let words = searchFor.split(' ');
      let refs = [];
      for (let word of words) {
	 if (word) {
	    refs = refs.concat(this.findInTree(this.state.searchTree, 1, word, true));
	 }
      }

      // TODO: may need better defn of dup?

      // Remove dups (unique category, date resource id only)
      //   and return latest-first
      return uniqueBy(refs, ref => `${ref.category}_${ref.resource.id}_${ref.date}`).sort((a, b) => new Date(b.date) - new Date(a.date));
   }

   //
   // Collect array of words present in participant resources and matching 'searchFor'
   //
   collectMatchWords(searchFor) {
      let words = searchFor.split(' ');
      let matchWords = [];
      for (let word of words) {
	 matchWords = matchWords.concat(this.getSearchOptions(word));
      }  

      // Remove dups
      return uniqueBy(matchWords, elt => elt);
   }

   toggleLaserSearch = () => {
      let refs = this.collectRefs(this.state.searchFor);
      let matchWords = this.collectMatchWords(this.state.searchFor);

      this.setState({ laserSearch: !this.state.laserSearch });

      // Report state to parent
      this.props.callback(refs, matchWords, !this.state.laserSearch);
   }

   //
   // Initiate/cancel search
   //
   doSearch = () => {
      if (this.state.searchFor === '') {
	 this.props.callback([], [], this.state.laserSearch);
	 // TODO: show/select from prior searches
	 return;
      } else if (this.state.searchResults) {
	 // Reset for next search
	 this.setState({searchResults: null, searchStatus: this.state.searchTerms, searchFor: ''});
	 this.props.callback([], [], this.state.laserSearch);
      } else if (this.state.totalSearchRefs > config.searchShowSearching) {
	 // Slow search
	 this.setState({searchStatus: 'Searching...'}, () => setTimeout(this.searchLookup, 10));
      } else {
	 // Regular/fast search
	 this.searchLookup();
      }
   }

   //
   // Perform search and color dots accordingly    
   //
   searchLookup = () => {
      let refs = this.collectRefs(this.state.searchFor);
      let matchWords = this.collectMatchWords(this.state.searchFor);

      this.setState({ searchResults: refs, searchStatus: refs.length + (refs.length === 1 ? ' match' : ' matches') });

      // Report search results to parent
      this.props.callback(refs, matchWords, this.state.laserSearch);
   }

   //
   // Walk the search terms index tree looking for the matching completion/ref array. Include counts per option if 'includeCounts' is true
   //
   findInTree(tree, level, searchFor, getRefs, includeCounts) {
      let match = searchFor.substring(0, level).toLowerCase();

      if (tree.match === match) {
	 return getRefs ? tree.ref
			: includeCounts ? tree.complete.map(word => `${word} (${this.collectRefs(word).length})`)
	  				: tree.complete;
      }

      for (let next of tree.next) {
	 if (next.match === match) {
	    if (next.match === searchFor.toLowerCase()) {
	       return getRefs ? next.refs
			      : includeCounts ? next.complete.map(word => `${word} (${this.collectRefs(word).length})`)
					      : next.complete;
	    } else {
	       return this.findInTree(next, level+1, searchFor, getRefs, includeCounts);
	    }
	 }
      }

      // Not found
      return [];
   }

   getCount(option) {
      return option.substring(option.indexOf('(')+1, option.indexOf(')'));
   }

   //
   // Return completion options matching 'searchFor'. Include counts per option if 'includeCounts' is true
   //
   getSearchOptions(searchFor, includeCounts) {
      if (searchFor.length === 0) {
	 // No 'searchFor' ==> no options
	 return [];
      } else {     
	 let opts = this.findInTree(this.state.searchTree, 1, searchFor, null, includeCounts);
	 if (includeCounts) {
	    // Sort on counts
	    return opts.sort((a,b) => this.getCount(b) - this.getCount(a));
	 } else {
	    return opts;
	 }
      }
   }
    
   //
   // Open/close the search input field
   //
   toggleSearch = () => {
      if (!this.state.searchIsOpen) {
	 this.setState({ searchIsOpen: true },
		       () => this.refs.textInput.focus() );
      } else {
	 // Cleanup
	 this.setState({ searchIsOpen: false, searchStatus: this.state.searchTerms, searchFor: '', searchResults: null });
	 this.props.callback([], [], this.state.laserSearch);
      }
   }

   //
   // Update search results on change in search input field
   //
   onInputChange = (event) => {
      this.setState({searchFor: event.target.value, searchStatus: this.state.searchTerms, searchResults: null}, this.doSearch);
   }

   //
   // Display completion options for the current search input field
   //
   renderSearchOptions() {
      let spaceLoc = this.state.searchFor.lastIndexOf(' ');
      let incrSearchFor = spaceLoc >= 0 ? this.state.searchFor.substring(spaceLoc+1) : this.state.searchFor;
      let options = this.getSearchOptions(incrSearchFor, true);

       if (incrSearchFor.length === 0 || (options.length === 1 && options[0].toLowerCase() === incrSearchFor.toLowerCase())) {
	 return null;
      } else if (options.length === 0) {
	 return <div className='search-results-empty'>no match</div>
      } else {
	 return (
	    <div className='search-results' onMouseLeave={() => this.setState({searchFor: this.state.searchFor+' '})} >
	       { options.map((option,index) =>
			     <div className='search-results-element' onClick={() => this.onClickOption(option, spaceLoc)} key={index}>{option}</div> )}
	    </div>
	 )
      }
   }

   //
   // An option was chosen...
   //
   onClickOption(option, spaceLoc) {
      let optionWord = option.substring(0, option.indexOf(' '));
      this.setState({ searchFor: this.state.searchFor.substring(0, spaceLoc+1) + optionWord, searchResults: null },
		    () => {
		       this.refs.textInput.focus();
		       this.doSearch();
		    });
   }

   render() {
      return (
	 <div className='search'>
	    { this.state.searchIsOpen && <input className='search-input' type='text' ref='textInput' maxLength={config.searchMaxLength}
						placeholder='search terms' value={this.state.searchFor}
						onChange={this.onInputChange} /> }
	    { this.state.searchIsOpen && <div className='search-status' onClick={() => this.setState({dataModalIsOpen: true})}>{this.state.searchStatus}</div> }
	    { this.renderSearchOptions() }
	    { this.state.searchIsOpen && <button className={this.state.laserSearch ? 'search-laser-button-on' : 'search-laser-button-off'}
						 onClick={this.toggleLaserSearch}>
					    {/* this.state.laserSearch ? 'laser on' : 'laser off' */}
					 </button> }
	    <button className={this.state.searchIsOpen ? 'search-button-cancel' : 'search-button'} onClick={this.toggleSearch} />
	    <Modal open={this.state.dataModalIsOpen} onClose={() => this.setState({dataModalIsOpen: false})}>
	       <pre className='search-data'>
		  { JSON.stringify(this.props.data, null, 3) }
	       </pre>
	    </Modal>
	 </div>
      )
   }
}

import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

import './Search.css';
import config from '../../config.js';
import { ignoreCategories } from '../../util.js';
import notInterestingFields from './notInterestingFields.js';
import notInterestingWords from './notInterestingWords.js';
import veryInterestingFields from './veryInterestingFields.js';

//
// Render the Search widget of ParticipantDetail page
//
export default class Search extends React.Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      callback: PropTypes.func.isRequired
   }
    
   state = {
      searchIsOpen: false,
      searchFor: '',
      searchStatus: '',
      searchTerms: '',
      searchTree: null,
      searchResults: null,
      totalSearchRefs: 0,
      dataModalIsOpen: false,
      laserSearch: false
   }

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

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
      this.setState({ searchStatus: 'Indexing...' }, () => setTimeout(this.indexData.bind(this), 10));
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
   }

   toggleSearch = this.toggleSearch.bind(this);
   toggleSearch() {
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
   // Walk/extend the search tree
   //
   walkTree(tree, level, value, dotRef) {
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
	     this.walkTree(next, level+1, value, dotRef);
	     return;
	 }
      }

      // No match -- create a new branch
      let newBranch = { match: match, complete: [], next: [], refs: [] }; 
      tree.next.push(newBranch);
      this.walkTree(newBranch, level+1, value, dotRef);
   }

   //
   // Add this item to the search tree
   //
   addToTree(tree, value, dotRef) {
//      console.log(value + ': ' + isVeryInteresting);

      // Add each (space-delimited) word of the item (dropping commas, brackets) to the search tree
      for (let word of value.split(' ')) {
	 let cleanWord = word.replace(',', '').replace('[', '').replace(']', '');
	 if (!notInterestingWords.includes(cleanWord.toLowerCase())) {
	    this.walkTree(tree, 1, cleanWord, dotRef);
	 }
      }
   }

   walkItem(tree, item, dotRef) {
      switch (typeof item) {
         case 'object':
	    if (item instanceof Array) {
	       // An array
	       for (let elt of item) {
		  this.walkItem(tree, elt, dotRef);
	       }
	    } else if (item === null) {
	       // Ignore
	    } else {
	       // An object
	       for (let propName in item) {
		  if (notInterestingFields.includes(propName)) {
		     // Ignore
		  } else if (veryInterestingFields.includes(propName)) {
		     // Interesting
		     dotRef.veryInteresting = true
		     this.walkItem(tree, item[propName], dotRef);
		  } else {
		     this.walkItem(tree, item[propName], dotRef);
		  }
	       }
	    }
	    break;

//         case 'number':
//         case 'boolean':
         case 'string':
	    let itemStr = item+'';
	    if (itemStr === 'true' || itemStr === 'false' || !isNaN(itemStr)) {
	       break;
            }

	    if (itemStr.length > 0) {
	       this.addToTree(tree, itemStr, dotRef);
	    }
	    break;

         case 'symbol':
         case 'function':
         default:
	    // Ignore
	    break;
      }
   }

   //
   // Index this participant's data when component loads
   //
   indexData() {
//      let tree = this.state.searchTree ? this.state.searchTree : { match: '', complete: [], next: [], refs: [] };
      let tree = { match: '', complete: [], next: [], refs: [] };

      // Index the resources for this participant
      for (let elt of this.props.data) {
	 if (!ignoreCategories().includes(elt.category)) {
	    this.walkItem(tree, elt.data, { provider: elt.provider, category: elt.category, date: elt.itemDate, veryInteresting: false });
	 }
      }
      let terms = tree.next.reduce((accum, elt) => accum + elt.complete.length, 0) + ' terms';
      let totalRefs = tree.next.reduce((accum, elt) => accum + elt.refs.length, 0);
      this.setState({ searchTree: tree, searchTerms: terms, searchStatus: terms, totalSearchRefs: totalRefs });
   }

   //
   // Collect array of references to participant resources matching 'searchFor'
   //
   // Each ref consists of:
   //     .provider (string)
   //     .category (string)
   //     .date (string)
   //     .veryInteresting (bool)
   //     .position (number)
   //
   collectRefs(searchFor) {
      let words = searchFor.split(' ');
      let refs = [];
      for (let word of words) {
	 refs = refs.concat(this.findInTree(this.state.searchTree, 1, word, true));
      }

      // Remove dups (unique category, date only)
      //   and return latest-first
      return this.uniqueBy(refs, elt => elt.category+elt.date).sort((a, b) => new Date(b.date) - new Date(a.date));
   }

   uniqueBy(arr, keyFn) {
      let seen = {};
      return arr.filter( elt => {
	  let key = keyFn(elt);
	  return seen.hasOwnProperty(key) ? false : seen[key] = true;
      });
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
      return this.uniqueBy(matchWords, elt => elt);
   }

   //
   // Perform search and color dots accordingly    
   //
   searchLookup() {
      let refs = this.collectRefs(this.state.searchFor);
      let matchWords = this.collectMatchWords(this.state.searchFor);

      this.setState({ searchResults: refs, searchStatus: refs.length + (refs.length === 1 ? ' match' : ' matches') });

      // Report search results to parent
      this.props.callback(refs, matchWords, this.state.laserSearch);
   }

   toggleLaserSearch = this.toggleLaserSearch.bind(this);
   toggleLaserSearch() {
      let refs = this.collectRefs(this.state.searchFor);
      let matchWords = this.collectMatchWords(this.state.searchFor);

      this.setState({ laserSearch: !this.state.laserSearch });

      // Report state to parent
      this.props.callback(refs, matchWords, !this.state.laserSearch);
   }

   //
   // Initiate/cancel search
   //
   doSearch = this.doSearch.bind(this);
   doSearch() {
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
	 this.setState({searchStatus: 'Searching...'}, () => setTimeout(this.searchLookup.bind(this), 10));
      } else {
	 // Regular/fast search
	 this.searchLookup();
      }
   }

   //
   // Walk the search terms index tree looking for the matching completion/ref array
   //
   findInTree(tree, level, searchFor, getRefs) {
      let match = searchFor.substring(0, level).toLowerCase();

      if (tree.match === match) {
	 return getRefs ? tree.refs : tree.complete;
      }

      for (let next of tree.next) {
	 if (next.match === match) {
	    if (next.match === searchFor.toLowerCase()) {
	       return getRefs ? next.refs : next.complete;
	    } else {
	       return this.findInTree(next, level+1, searchFor, getRefs);
	    }
	 }
      }

      // Not found
      return [];
   }

   //
   // Return completion options matching 'searchFor'
   //
   getSearchOptions(searchFor) {
      if (searchFor.length === 0) {
	 // No 'searchFor' ==> no options
	 return [];
      } else {     
	 return this.findInTree(this.state.searchTree, 1, searchFor);
      }
   }
    
   //
   // An option was chosen...
   //
   onClickOption(option, spaceLoc) {
       this.setState({ searchFor: this.state.searchFor.substring(0, spaceLoc+1) + option, searchResults: null },
		     () => {
			 this.refs.textInput.focus();
			 this.doSearch();
		     });
   }

   renderSearchOptions() {
      let spaceLoc = this.state.searchFor.lastIndexOf(' ');
      let incrSearchFor = spaceLoc >= 0 ? this.state.searchFor.substring(spaceLoc+1) : this.state.searchFor;
      let options = this.getSearchOptions(incrSearchFor);

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

   onInputChange = this.onInputChange.bind(this);
   onInputChange(event) {
       this.setState({searchFor: event.target.value, searchStatus: this.state.searchTerms, searchResults: null}, this.doSearch);
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

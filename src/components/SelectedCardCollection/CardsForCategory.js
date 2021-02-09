import React from 'react';
import { string } from 'prop-types';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import AccordionDetails from '@material-ui/core/AccordionDetails';

import { useRecoilValue } from 'recoil';
import RecordCard from '../cards/RecordCard';
import { filteredActiveCollectionState, resourcesState } from '../../recoil';

const CategorySubtypeAccordion = ({
  records, categoryLabel, subtypeLabel, categorySubtype,
}) => {
  const { hasLastAdded, uuids } = categorySubtype;
  const summaryLabel = `${categoryLabel} - ${subtypeLabel}`;
  return (
    <Accordion
      // defaultExpanded={hasLastAdded}
      disableGutters
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        {summaryLabel}
      </AccordionSummary>
      <AccordionDetails>
        {
          uuids.map((uuid) => (
            <RecordCard
              key={`record-card-${uuid}`}
              recentlyAdded={hasLastAdded}
              recordId={uuid}
              records={records}
            />
          ))
        }
      </AccordionDetails>
    </Accordion>
  );
};

const CardsForCategory = ({ categoryLabel }) => {
  const resources = useRecoilValue(resourcesState);
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);

  const { records } = resources;
  const category = filteredActiveCollection[categoryLabel];
  // console.info('category: ', JSON.stringify(category, null, '  '));
  if (!category || category.filteredCollectionCount === 0) {
    return null;
  }
  return (
    <div
      key={categoryLabel}
    >
      <Typography
        variant="card-list-category-header"
      >
        <Typography
          variant="card-list-category-label"
        >
          {categoryLabel}
        </Typography>
        <Typography
          variant="card-list-category-count"
        >
          [{`${category.filteredCollectionCount} of ${category.totalCount}`}] {/* eslint-disable-line react/jsx-one-expression-per-line */}
        </Typography>
      </Typography>
      {
        Object.entries(category.subtypes)
          .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
          .map(([displayCoding, categorySubtype]) => (
            <CategorySubtypeAccordion
              key={displayCoding}
              records={records}
              categoryLabel={categoryLabel}
              subtypeLabel={displayCoding}
              categorySubtype={categorySubtype}
            />
          ))
      }
    </div>
  );
};

CardsForCategory.propTypes = {
  categoryLabel: string.isRequired,
};

export default CardsForCategory;

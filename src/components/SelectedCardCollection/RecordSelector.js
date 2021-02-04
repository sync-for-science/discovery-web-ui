import React from 'react';
import { array, string } from 'prop-types';
import { useRecoilState } from 'recoil';
import { activeCollectionState } from '../../recoil';

const showCount = (count) => {
  if (count > 1) {
    return ` [${count}]`;
  }
  return null;
};

const RecordSelector = ({ label, uuids }) => {
  const [activeCollection, setActiveCollection] = useRecoilState(activeCollectionState);
  // console.info('activeCollection: ', JSON.stringify(activeCollection, null, '  '));
  const { uuids: activeUuids } = activeCollection;
  const hasActiveUuid = uuids.reduce((acc, uuid) => activeUuids[uuid] || acc, false);
  console.info('hasActiveUuid: ', hasActiveUuid);
  const cssClass = hasActiveUuid ? 'tile-standard-selected' : 'tile-standard';
  // tile-standard-selected tile-standard-last
  const handleClick = () => {
    const resetUuids = uuids.reduce((acc, uuid) => ({ ...acc, [uuid]: !hasActiveUuid }), {});
    setActiveCollection(resetUuids);
  };
  return (
    <button
      className={cssClass}
      onClick={handleClick}
    >
      {label}
      {showCount(uuids.length)}
    </button>
  );
};

RecordSelector.propTypes = {
  // displayCoding: shape({
  //   code: string.isRequired,
  //   display: string.isRequired,
  // }).isRequired,
  label: string.isRequired,
  uuids: array.isRequired,
};

export default React.memo(RecordSelector);

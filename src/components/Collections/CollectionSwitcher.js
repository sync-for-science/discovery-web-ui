import React from 'react';
import { useRecoilState } from 'recoil';
import { allCollectionsState } from '../../recoil';

const CollectionSwitcher = () => {
  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  const { activeCollectionId, collections } = allCollections;
  const activeCollectionLabel = collections[activeCollectionId].label;

  const setActiveCollection = (collectionId) => {
    setAllCollections((previousState) => {
      // console.error('handleAddNewCollection previousState: ', previousState);
      const { collections } = previousState;
      return {
        activeCollectionId: collectionId,
        collections,
      };
    });
  };

  return (
    <div>
      {activeCollectionLabel}
    </div>
  );
};

export default React.memo(CollectionSwitcher);

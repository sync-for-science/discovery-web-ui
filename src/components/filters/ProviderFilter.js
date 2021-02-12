import React from 'react';
import { useRecoilValue } from 'recoil';
import Providers from '../Providers';
import ProviderRollup from '../ProviderRollup';
import Provider from '../Provider';
import { activeProvidersState } from '../../recoil';

const ProviderFilter = () => {
  const [isExpanded, setExpanded] = React.useState(true);
  const activeProviders = useRecoilValue(activeProvidersState);

  return (
    <Providers>
      <ProviderRollup
        isExpanded={isExpanded}
        expansionFn={() => setExpanded(!isExpanded)}
      />
      { isExpanded && Object.keys(activeProviders)
        .sort()
        .map((prov) => (
          <Provider
            key={prov}
            providerName={prov}
          />
        ))}
    </Providers>
  );
};

export default ProviderFilter;

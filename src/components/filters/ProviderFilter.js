import React from 'react';
import Providers from '../Providers';
import ProviderRollup from '../ProviderRollup';
import Provider from '../Provider';

const ProviderFilter = () => (

  <Providers>
    <ProviderRollup
      isExpanded={this.state.provsExpanded}
      expansionFn={this.onExpandContract}
    />
    { this.state.provsExpanded ? [
      this.props.providers.map(
        (prov) => (
          <Provider
            key={prov}
            providerName={prov}
          />
        ),
      ),
      <div className="standard-filters-provider-nav-spacer-bottom" key="1" />,
    ] : null }
  </Providers>
);

export default ProviderFilter;

import React from 'react';
import { Page, Tabs } from '../../components';
import css from './EditListingPage.module.css';
import TopbarContainer from '../TopbarContainer/TopbarContainer';

export const UPLOAD = 'upload';
export const DETAILS = 'details';

const Tab = props => {
  const { tab } = props;

  return <>{tab === UPLOAD ? <div>Upload</div> : <div>Details</div>}</>;
};

export const ProductListingPageComponent = props => {
  const [tab, setTab] = React.useState(UPLOAD);
  return (
    <Page title="Title" scrollingDisabled={false} author="Author" description="Page Desc">
      <TopbarContainer
        mobileRootClassName={css.mobileTopbar}
        desktopClassName={css.desktopTopbar}
        mobileClassName={css.mobileTopbar}
      />
      <Tabs>
        <Tab tabId="upload" tabName="Upload" tabLinkProps={{ name: 'Tabs Product Listing' }}>
          Tab1
        </Tab>
      </Tabs>
    </Page>
  );
};

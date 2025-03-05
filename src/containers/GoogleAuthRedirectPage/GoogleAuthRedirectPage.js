import React from 'react';
import { IconSpinner, LayoutSingleColumn, Modal, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { createResourceLocatorString } from '../../util/routes';
import routeConfiguration from '../../routing/routeConfiguration';

import css from './GoogleAuthRedirectPage.module.css';

const GoogleAuthRedirectPage = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const scrollingDisabled = useSelector(isScrollingDisabled);

  const title = intl.formatMessage({
    id: 'GoogleAuthRedirectPage.title',
  });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.pageContent}>
          <Modal
            id="GoogleAuthPage.loadingGoogle"
            usePortal
            isOpen={true}
            onClose={() =>
              history.push(createResourceLocatorString('LandingPage', routeConfiguration(), {}, {}))
            }
            onManageDisableScrolling={(componentId, disableScrolling) => {
              dispatch(manageDisableScrolling(componentId, disableScrolling));
            }}
          >
            <div className={css.successModalsWrapper}>
              <>
                <div className={css.spinner}>
                  <IconSpinner />
                </div>
                <div className={css.formRow}>
                  {intl.formatMessage({
                    id: 'GoogleAuthPage.loadingGoogle',
                  })}
                </div>
              </>
            </div>
          </Modal>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default GoogleAuthRedirectPage;

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { parse } from '../../util/urlHelpers';
import { LayoutSingleColumn, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import css from './VideoMeetingPage.module.css';
import { useHistory } from 'react-router-dom';

/**
 * VideoMeetingPage – placeholder page for the video meeting feature.
 */
const VideoMeetingPage = () => {
  const scrollingDisabled = useSelector(isScrollingDisabled);
  const currentUser = useSelector(state => state.user.currentUser);
  const diplayName = currentUser?.attributes?.profile?.displayName;
  const location = useLocation();
  const history = useHistory();
  const { roomCode } = parse(location.search);

  if (!roomCode) {
    return (
      <Page title="Video Meeting" scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn topbar={<TopbarContainer />}>
          <div className={css.root}>
            <h1>Invalid room code</h1>
          </div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  return (
    <Page title="Video Meeting" scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={<TopbarContainer />}>
        <div className={css.root}>
          <HMSPrebuilt
            roomCode={roomCode}
            options={{
              userName: diplayName,
            }}
            onLeave={e => history?.goBack()}
          />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default VideoMeetingPage;

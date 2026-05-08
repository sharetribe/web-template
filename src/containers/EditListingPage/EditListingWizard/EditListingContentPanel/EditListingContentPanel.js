import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { deleteMuxAsset } from '../../../../util/api';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingContentForm from './EditListingContentForm';
import css from './EditListingContentPanel.module.css';

const getInitialValues = params => {
  const { publicData = {}, privateData = {} } = params.listing.attributes || {};
  const isVideoCourse = publicData.listingType === 'video-course';
  const { description = '' } = publicData;

  return isVideoCourse ? { courseModules: privateData.courseModules || [] } : { description };
};

const courseStructureInfo = courseModules => {
  const modules = courseModules || [];
  const lessons = modules.reduce((count, module) => count + (module.lessons || []).length, 0);
  const videoLessons = modules.reduce(
    (count, module) =>
      count + (module.lessons || []).filter(lesson => lesson.type === 'video').length,
    0
  );

  return {
    moduleCount: modules.length,
    lessonCount: lessons,
    videoLessonCount: videoLessons,
  };
};

const courseVideoAssetIds = courseModules =>
  (courseModules || []).reduce((assetIds, module) => {
    const lessonAssetIds = (module.lessons || [])
      .map(lesson => lesson.video?.asset_id)
      .filter(Boolean);
    return assetIds.concat(lessonAssetIds);
  }, []);

/**
 * The EditListingContentPanel component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
const EditListingContentPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const { listingType } = listing?.attributes?.publicData || {};
  const isVideoCourse = listingType === 'video-course';
  const uploadedVideoAssetIds = React.useRef([]);
  const initialVideoAssetIds = React.useMemo(
    () => courseVideoAssetIds(listing?.attributes?.privateData?.courseModules),
    [listing?.id?.uuid, listing?.attributes?.privateData?.courseModules]
  );

  const panelHeadingProps = isPublished
    ? {
        id: isVideoCourse
          ? 'EditListingContentPanel.videoClassTitle'
          : 'EditListingContentPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: isVideoCourse
          ? 'EditListingContentPanel.classStructureTitle'
          : 'EditListingContentPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      <p className={css.description}>
        <FormattedMessage
          id={
            isVideoCourse
              ? 'EditListingContentPanel.classStructureDescription'
              : 'EditListingContentPanel.description'
          }
        />
      </p>
      <EditListingContentForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        isVideoCourse={isVideoCourse}
        onManageDisableScrolling={props.onManageDisableScrolling}
        onSubmit={values => {
          const { description, courseModules = [] } = values;
          const finalVideoAssetIds = courseVideoAssetIds(courseModules);
          const removedVideoAssetIds = Array.from(
            new Set(initialVideoAssetIds.concat(uploadedVideoAssetIds.current))
          ).filter(assetId => !finalVideoAssetIds.includes(assetId));
          const updateValues = isVideoCourse
            ? {
                privateData: { courseModules },
                publicData: {
                  courseStructureInfo: courseStructureInfo(courseModules),
                },
              }
            : {
                publicData: { description },
              };
          return onSubmit(updateValues).then(response => {
            if (isVideoCourse) {
              uploadedVideoAssetIds.current = finalVideoAssetIds;
            }

            if (isVideoCourse && removedVideoAssetIds.length > 0) {
              return Promise.all(
                removedVideoAssetIds.map(assetId =>
                  deleteMuxAsset({ assetId }).catch(e => {
                    console.error('Failed to delete removed course Mux asset', e);
                  })
                )
              ).then(() => response);
            }

            return response;
          });
        }}
        onVideoUploaded={assetId => {
          uploadedVideoAssetIds.current = uploadedVideoAssetIds.current.concat(assetId);
        }}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
      />
    </main>
  );
};

export default EditListingContentPanel;

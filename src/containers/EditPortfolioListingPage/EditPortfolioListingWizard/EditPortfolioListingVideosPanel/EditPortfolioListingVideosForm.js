import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';
import { FormattedMessage, injectIntl } from '../../../../util/reactIntl';
import { AspectRatioWrapper, Button, Form } from '../../../../components';
import { RemoveImageButton } from '../EditPortfolioListingItemsPanel/ListingImage';
import css from './EditPortfolioListingVideosForm.module.css';
import { FieldAddMedia } from '../EditPortfolioListingItemsPanel/AddMediaField';
import { removeVideoFromListing, saveVideoToListing } from '../../EditPortfolioListingPage.duck';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import VideoPlayer from '../../../../components/VideoPlayer/VideoPlayer';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableVideo from '../EditPortfolioListingItemsPanel/SortableVideo';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import IconDotsVertical from '../../../../components/IconDotsVertical/IconDotsVertical';
import { VIDEOS } from '../EditPortfolioListingWizardTab';

const PublishListingError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;

const UpdateListingError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.updateFailed" />
    </p>
  ) : null;

const ShowListingsError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;

const FieldListingVideo = props => {
  const { name, aspectWidth, aspectHeight, onRemoveVideo } = props;

  return (
    <Field name={name}>
      {({ input }) =>
        input.value ? (
          <div className={css.thumbnail}>
            <div className={css.wrapper}>
              <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
                <VideoPlayer src={input.value.url} previewTime={input.value.thumbnailTime} />
              </AspectRatioWrapper>
              <RemoveImageButton
                onClick={onRemoveVideo}
                confirmTitle="Delete Video?"
                confirmMessage="This action cannot be undone."
              />
            </div>
          </div>
        ) : null
      }
    </Field>
  );
};

const EditPortfolioListingVideosFormComponent = props => {
  const { onSubmit } = props;
  const dispatch = useDispatch();

  const updating = useSelector(state => state.EditPortfolioListingPage.updating);
  const updateError = useSelector(state => state.EditPortfolioListingPage.updateError);
  const publishListingError = useSelector(state => state.EditPortfolioListingPage.saveError);
  const showListingsError = useSelector(state => state.EditPortfolioListingPage.error);
  const existingVideos = useSelector(state => state.EditPortfolioListingPage.videos);
  const existingImages = useSelector(state => state.EditPortfolioListingPage.images);
  const listing = useSelector(state => state.EditPortfolioListingPage.portfolioListing);
  const listingId = listing?.id;
  const listingState = listing?.attributes?.state;
  const isDraft = listingState === LISTING_STATE_DRAFT;

  const onPublishHandler = values => {
    const updateListingValues = {
      ...values,
      images: existingImages || [],
      id: listingId,
    };
    if (!listingId) return;
    onSubmit(updateListingValues, isDraft);
  };

  const onSaveVideo = video => {
    dispatch(saveVideoToListing(video));
  };

  const handleRemoveVideo = videoId => {
    dispatch(removeVideoFromListing(videoId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return (
    <FinalForm
      {...props}
      onSubmit={onPublishHandler}
      initialValues={{ videos: existingVideos || [] }}
      mutators={{ ...arrayMutators }}
      render={({ form, className, handleSubmit, invalid, disabled, listingImageConfig = {} }) => {
        const { aspectWidth = 1, aspectHeight = 1 } = listingImageConfig;
        const submitInProgress = updating;
        const submitDisabled = invalid || disabled || submitInProgress;
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <div className={css.videosFieldArray}>
              <FieldArray name={VIDEOS}>
                {({ fields }) => {
                  if (!fields.value || !Array.isArray(fields.value)) {
                    return null;
                  }
                  const videoIds = fields.value.map(video => video.id);
                  return (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={event => {
                        const { active, over } = event;
                        if (active.id !== over?.id) {
                          const oldIndex = fields.value.findIndex(video => video.id === active.id);
                          const newIndex = fields.value.findIndex(video => video.id === over.id);
                          fields.move(oldIndex, newIndex);
                        }
                      }}
                    >
                      <SortableContext items={videoIds} strategy={verticalListSortingStrategy}>
                        {videoIds.map((id, index) => {
                          const name = `videos[${index}]`;
                          const video = fields.value[index];
                          return (
                            <SortableVideo
                              key={id}
                              id={id}
                              dragHandle={({ listeners, attributes }) => (
                                <span {...listeners} {...attributes} className={css.dragHandle}>
                                  <IconDotsVertical />
                                </span>
                              )}
                            >
                              <FieldListingVideo
                                name={name}
                                video={video}
                                aspectWidth={aspectWidth}
                                aspectHeight={aspectHeight}
                                onRemoveVideo={() => {
                                  fields.remove(index);
                                  handleRemoveVideo(id);
                                }}
                              />
                            </SortableVideo>
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  );
                }}
              </FieldArray>

              <FieldAddMedia
                id="addMedia"
                name="addMedia"
                disabled={updating}
                formApi={form}
                onSaveVideo={onSaveVideo}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
                mediaType={VIDEOS}
              />
            </div>

            <PublishListingError error={publishListingError} />
            <UpdateListingError error={updateError} />
            <ShowListingsError error={showListingsError} />
            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              {isDraft ? 'Publish' : 'Save changes'}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default injectIntl(EditPortfolioListingVideosFormComponent);

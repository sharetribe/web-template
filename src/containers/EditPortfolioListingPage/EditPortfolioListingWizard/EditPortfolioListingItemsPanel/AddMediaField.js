import React, { useState } from 'react';
import { Field } from 'react-final-form';
import css from './AddMediaField.module.css';
import { AspectRatioWrapper } from '../../../../components';
import Spinner from '../../../../components/IconSpinner/IconSpinner';
import { Button, Space } from 'antd';

const ACCEPT_IMAGES = 'image/*';

function videoId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );
}

export const FieldAddMedia = props => {
  const {
    formApi,
    onImageUploadHandler,
    onSaveVideo,
    aspectWidth = 1,
    aspectHeight = 1,
    isUploading,
    ...rest
  } = props;
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbTime, setVideoThumbTime] = useState('00:00:00');
  const handleSaveVideo = () => {
    if (videoUrl) {
      onSaveVideo({
        url: videoUrl,
        thumbnailTime: videoThumbTime,
        id: videoId(),
      });
      setVideoUrl('');
      setVideoThumbTime('');
      setShowVideoInput(false);
    }
  };

  return (
    <Field form={null} {...rest}>
      {fieldProps => {
        const { input, disabled: fieldDisabled } = fieldProps;
        const { name } = input;

        const onChange = e => {
          const file = e.target.files[0];
          formApi.change(`addImage`, file);
          formApi.blur(`addImage`);
          onImageUploadHandler(file);
        };

        return (
          <div className={css.addMediaWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              <div className={css.addMediaContent}>
                {isUploading ? (
                  <div className={css.spinnerWrapper}>
                    <Spinner />
                  </div>
                ) : (
                  <>
                    {!showVideoInput && (
                      <div className={css.imageUploadSection}>
                        {!fieldDisabled && (
                          <input
                            accept={ACCEPT_IMAGES}
                            id={name}
                            name={name}
                            onChange={onChange}
                            type="file"
                            className={css.addImageInput}
                          />
                        )}
                        <label htmlFor={name}>
                          <span className={css.chooseImageText}>
                            <span className={css.chooseImage}>+ Add a photo</span>
                            <span className={css.imageTypes}>.JPG, .GIF or .PNG. Max. 20 MB</span>
                          </span>
                        </label>
                      </div>
                    )}

                    <div className={css.videoEmbedSection} onClick={() => setShowVideoInput(true)}>
                      <span className={css.embedVideoText}>+ Embed a video</span>
                    </div>

                    {showVideoInput && (
                      <div className={css.videoInputContainer}>
                        <div className={css.videoInputField}>
                          <label htmlFor="add-video-url">Video URL</label>
                          <input
                            id="add-video-url"
                            type="text"
                            placeholder="Enter video URL"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            className={css.videoInput}
                          />
                        </div>
                        <div className={css.videoInputField}>
                          <label htmlFor="add-video-url">Thumbnail time</label>
                          <input
                            id="add-video-thumb"
                            type="text"
                            placeholder="Thumbnail time (HH:mm:ss)"
                            value={videoThumbTime}
                            onChange={e => setVideoThumbTime(e.target.value)}
                            className={css.videoInput}
                          />
                        </div>
                        <Space className={css.addVideoButtons}>
                          <Button onClick={() => setShowVideoInput(false)}>Cancel</Button>
                          <Button type="primary" onClick={handleSaveVideo}>
                            Save
                          </Button>
                        </Space>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

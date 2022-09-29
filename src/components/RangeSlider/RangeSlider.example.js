import React, { useState } from 'react';
import RangeSlider from './RangeSlider';

const RangeSliderWrapper = props => {
  const [handles, setHandles] = useState(props.handles);
  return (
    <RangeSlider
      {...props}
      handles={handles}
      onChange={v => {
        setHandles(v);
      }}
    />
  );
};

export const RangeSliderOneHandle = {
  component: RangeSliderWrapper,
  props: {
    min: 0,
    max: 1000,
    step: 5,
    handles: [500],
  },
  group: 'inputs',
};

export const RangeSliderTwoHandles = {
  component: RangeSliderWrapper,
  props: {
    min: 0,
    max: 1000,
    step: 5,
    handles: [333, 666],
  },
  group: 'inputs',
};

export const RangeSliderThreeHandles = {
  component: RangeSliderWrapper,
  props: {
    min: 0,
    max: 1000,
    step: 5,
    handles: [150, 490, 850],
  },
  group: 'inputs',
};

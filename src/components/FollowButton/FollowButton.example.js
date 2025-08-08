import React from 'react';
import FollowButton from './FollowButton';

export const Default = {
  component: FollowButton,
  props: {
    isFollowing: false,
    onFollow: () => console.log('Follow clicked'),
    onUnfollow: () => console.log('Unfollow clicked'),
  },
  group: 'misc',
};

export const Following = {
  component: FollowButton,
  props: {
    isFollowing: true,
    onFollow: () => console.log('Follow clicked'),
    onUnfollow: () => console.log('Unfollow clicked'),
  },
  group: 'misc',
};

export const InProgress = {
  component: FollowButton,
  props: {
    isFollowing: false,
    followInProgress: true,
    onFollow: () => console.log('Follow clicked'),
    onUnfollow: () => console.log('Unfollow clicked'),
  },
  group: 'misc',
}; 
import TimeRange from './TimeRange';
import { fakeIntl } from '../../util/test-data';

export const DateAndTimeSingleDay = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 30, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 4, 0)),
    dateType: 'datetime',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

export const DateAndTimeMultipleDays = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 28, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 5, 0)),
    dateType: 'datetime',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

export const OnlyDateSingleDay = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 29, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 4, 0)),
    dateType: 'date',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

export const OnlyDateMultipleDays = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 28, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 5, 0)),
    dateType: 'date',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

export const OnlyDateSingleNight = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 29, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 4, 0)),
    dateType: 'date',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

export const OnlyDateMultipleNights = {
  component: TimeRange,
  props: {
    intl: fakeIntl,
    startDate: new Date(Date.UTC(2019, 8, 28, 3, 0)),
    endDate: new Date(Date.UTC(2019, 8, 30, 5, 0)),
    dateType: 'date',
    timeZone: 'Etc/UTC',
  },
  group: 'inbox',
};

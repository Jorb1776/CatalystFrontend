// src/types/react-big-calendar.d.ts
declare module 'react-big-calendar' {
  import { Component, CSSProperties } from 'react';
  import { Moment } from 'moment';

  export interface Event {
    title?: React.ReactNode;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    color?: string;  // ADD color
  }

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: CSSProperties;
    eventPropGetter?: (event: Event) => { style?: CSSProperties };
  }

  export const Calendar: React.FC<CalendarProps>;
  export function momentLocalizer(moment: typeof import('moment')): any;
}
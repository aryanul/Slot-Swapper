declare module 'ical.js' {
  export function parse(input: string): any[];
  export class Component {
    constructor(jCal: any[]);
    getAllProperties(name: string): any[];
    getFirstPropertyValue(name: string): any;
    getAllSubcomponents(name: string): Component[];
  }
  export class Event {
    constructor(component: Component);
    summary: string;
    startDate: any;
    endDate: any;
    description: string;
  }
}


import { Moment } from 'moment';

export interface DateManager {
    utc(): Moment
}
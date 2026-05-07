import { json } from '../_shared/http';
import { readCronState } from '../_shared/cron-state';

export const onRequestGet: PagesFunction = async () => {
  return json({ success: true, ...readCronState() });
};

import AbstractCommand from './AbstractCommand';

import StartStruct from '../struct/DataStructs/start';
import Messages from '../messages';

export default class StartCommand extends AbstractCommand {
    name = 'start';
    aliases = ['hi'];
    options = [];
    description = Messages.translation('command.start.description');

    execute(args, options): string {
      const start = new StartStruct();

      if (options !== undefined && options[0] !== undefined && options[0].includes(':')) {
        start.time.setHours(options[0].split(':')[0]);
        start.time.setMinutes(options[0].split(':')[1]);
      }

      this.dataHelper.writeData(start.getWriteData(), start.dataKey);

      return start.getPrintData()['key'] +' '+ start.getPrintData()['value'];
    }
}

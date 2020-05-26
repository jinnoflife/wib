import AbstractCommand from './AbstractCommand';
import StartStruct from '../struct/start';
import StopStruct from '../struct/stop';
import FormatHelper from '../lib/helper/FormatHelper';
import WorklogCollection from '../struct/collection/WorklogCollection';
import WorkDurationHelper from '../lib/helper/WorkDurationHelper';
import NoteCollection from '../struct/collection/NoteCollection';
import ConfigHelper from '../lib/helper/ConfigHelper';

export default class ListCommand extends AbstractCommand {
    name = 'list';
    aliases = ['l', 'status', 'report'];
    description = 'Show the report';
    options = [
      {
        flag: '-d, --day <day>',
        description: 'List a specific date'
      },
      {
        flag: '-m, --month <month>',
        description: 'Date from specific month'
      },
      {
        flag: '-y, --yesterday',
        description: 'List yesterday'
      },
    ];

    execute(args): string {
      let date = (new Date(Date.now())).getTime();

      if (undefined !== args.yesterday) {
        args.day = (new Date(date)).getDate() - 1;
      }

      if (undefined !== args.day) {
        date = (new Date(date)).setDate(args.day);
      }

      if (undefined !== args.month) {
        date = (new Date(date)).setMonth(args.month);
      }

      return (new ListCommand()).getTableData(date);
    }

    getTableData(date?: number): string {
      const start = (new StartStruct(null)),
        stop = (new StopStruct(null)),
        notes = (new NoteCollection()),
        worklogs = (new WorklogCollection()),
        tableData = {};

      if (date === undefined) {
        start.fromSavedData();
        stop.fromSavedData();
        notes.fromSavedData();
        worklogs.fromSavedData();
      } else {
        start.fromSavedData(date);
        stop.fromSavedData(date);
        notes.fromSavedData(date);
        worklogs.fromSavedData(date);
      }

      if (null !== start.time) {
        tableData['0_start'] = start.getPrintData();
      }

      if (null !== stop.time) {
        tableData['1_stop'] = stop.getPrintData();
      } else if (null !== start.time) {
        const estimatedStop = new StopStruct();
        estimatedStop.time = new Date(start.time);
        estimatedStop.time = new Date(estimatedStop.time.setHours(
            estimatedStop.time.getHours() + (new ConfigHelper()).getSpecifiedWorkDuration()
        ));
        tableData['1_stop'] = estimatedStop.getUnsetPrintData();
      }

      if (null !== notes.entries) {
        tableData['3_notes'] = notes.getPrintData();
      }

      if (null !== worklogs.entries) {
        tableData['4_worklogs'] = worklogs.getCalculatedPrintData(start);
      }

      if (null !== start.time && 0 < worklogs.getAmount()) {
        tableData['2_workDuration'] = (new WorkDurationHelper).getWorkDuration(start, worklogs);
      }

      return (new FormatHelper().toTable(
          Object.keys(tableData).sort().reduce((r, k) => (r[k] = tableData[k], r), {})
      ));
    }
}

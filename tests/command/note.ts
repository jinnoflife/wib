import 'mocha';
import * as chai from 'chai';
import NoteCommand from '../../src/command/NoteCommand';
import DataHelper from '../../src/helper/DataHelper';
import Messages from '../../src/messages';
import GlobalMock from '../mock/global';

describe('Note command', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const testData = require('../data.json'),
    argumentMock = {
      delete: undefined,
      edit: undefined
    };
  beforeEach(function() {
    GlobalMock.beforeEach();

    (new DataHelper()).writeData({});
    argumentMock.edit = undefined;
    argumentMock.delete = undefined;
  });

  afterEach(() => {
    GlobalMock.afterEach();
  });

  it('Create note', () => {
    chai.expect(Messages.translation('command.note.execution.create') + testData.note.createData.join(' '))
        .to.equal((new NoteCommand()).execute(argumentMock, testData.note.createData));
  });

  it('Edit note', () => {
    argumentMock.edit = 0;

    chai.expect(Messages.translation('command.note.execution.edit')+ '0').to.equal(
        (new NoteCommand()).execute(argumentMock, testData.note.editData)
    );
  });

  it('Delete note', () => {
    argumentMock.delete = 0;
    chai.expect(Messages.translation('command.note.execution.delete')+ '0')
        .to.equal((new NoteCommand()).execute(argumentMock, []));
  });
});

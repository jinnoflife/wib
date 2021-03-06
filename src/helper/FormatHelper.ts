import ConfigHelper from './ConfigHelper';
import OutputHelper from './OutputHelper';
import Messages from '../messages';

export default class FormatHelper {
  private _showFullOutput: boolean ;
  private configHelper: ConfigHelper;

  constructor(showFullOutput = false) {
    this._showFullOutput = showFullOutput;
    this.configHelper = new ConfigHelper();
  }

  public applyFormat(dataObject: object, formatName: string, type = 'value'): string {
    let specifiedFormat = this.configHelper.getSpecifiedFormat(formatName, type);

    if (specifiedFormat === undefined || dataObject === undefined) {
      OutputHelper.error(Messages.translation('format.invalid') + formatName);

      return '';
    }

    specifiedFormat = this.applyVariables(specifiedFormat, dataObject, formatName);
    return Messages.applyTranslationToString(specifiedFormat);
  }

  public toTable(data, colLength = this.getLongestElements(data), isSub = false, output = ''): string {
    const me = this;
    let loopAmount = Object.keys(data).length + 1, keyOutput, valOutput;

    if (isSub) {
      loopAmount--;
    }

    for (let a = 0; a < loopAmount; a++) {
      const curObject = Object.values(data)[a];
      if (!isSub && '-' !== output.charAt(output.length-2)) {
        for (let b = 0; b < colLength['key'] + colLength['value'] + 5; b++) {
          output += '-';
        }
      }

      if (curObject) {
        if (Array.isArray(curObject) && 0 < curObject.length) {
          output = me.toTable(curObject, colLength, true, output);
        } else if (curObject['key'] && curObject['value']) {
          const curKey = curObject['key'];
          const curVal = curObject['value'];

          if (curKey && curVal) {
            if (0 < output.length && '\n' !== output.charAt(output.length-1)) {
              output += '\n';
            }
            keyOutput = '| ' + curKey;
            keyOutput += ' '.repeat(colLength['key'] - curKey.toString().length);

            if (0 < colLength['value'] - curVal.toString().length) {
              valOutput = '| ' + curVal;
              valOutput += ' '.repeat(colLength['value'] - curVal.toString().length) + '|';
            } else {
              valOutput = '| ' + curVal.toString()
                  .slice(0, curVal.toString().length - (curVal.toString().length - colLength['value']) - 5);
              valOutput += ' ... |';
            }

            output += keyOutput + valOutput;
          }
        } else if ('object' === typeof curObject && 0 < Object.entries(curObject).length) {
          output = me.toTable(curObject, colLength, true, output);
        }
      }

      if (a + 1 !== loopAmount && !isSub && '\n' !== output.charAt(output.length-1) && 0 < output.length) {
        output += '\n';
      }
    }

    return output;
  }

  public formatTime(time: string, formatType?: string, round = true): string {
    const dateObject = new Date(time);

    if ('date' === formatType) {
      return dateObject.getFullYear() + '-' + dateObject.getMonth() + '-' + dateObject.getDate();
    }

    if ('duration' === formatType) {
      let formattedDuration = '';

      dateObject.setSeconds(0);

      if (0 < dateObject.getUTCHours()) {
        formattedDuration += dateObject.getUTCHours() + Messages.translation('format.time.hour');
      }
      if (0 < dateObject.getUTCHours() && 0 < dateObject.getUTCMinutes()) {
        formattedDuration += ' ';
      }
      if (0 < dateObject.getUTCMinutes()) {
        if (round) {
          formattedDuration += Math.ceil(
              dateObject.getUTCMinutes() / this.configHelper.getSpecifiedMinuteRounding()
          ) * this.configHelper.getSpecifiedMinuteRounding();
        } else {
          formattedDuration += dateObject.getUTCMinutes();
        }
        formattedDuration += Messages.translation('format.time.minute');
      }
      if (0 === dateObject.getUTCHours() && 0 === dateObject.getUTCMinutes()) {
        formattedDuration += Math.ceil(
            1 / this.configHelper.getSpecifiedMinuteRounding()
        ) * this.configHelper.getSpecifiedMinuteRounding();
        formattedDuration += Messages.translation('format.time.minute');
      }

      return formattedDuration;
    }

    return ('0' + dateObject.getHours()).slice(-2) + ':' + ('0' + dateObject.getMinutes()).slice(-2);
  }

  private applyVariables(specifiedFormat: string, dataObject: object, formatName: string): string {
    const me = this;

    for (const key in dataObject) {
      let replaceVal = dataObject[key];

      if (replaceVal !== undefined) {
        if (['time', 'date', 'duration'].includes(key)) {
          if ('rest' === formatName || 'workDuration' === formatName) {
            replaceVal = me.formatTime(replaceVal, key, false);
          } else {
            replaceVal = me.formatTime(replaceVal, key);
          }
        }

        specifiedFormat = specifiedFormat.split('{{' + key + '}}').join(replaceVal);
      }
    }

    return specifiedFormat;
  }

  /**
   * @param {{key: string, value: string}} data
   * @return {{key: number, value: number}}
   */
  private getLongestElements(data: object): object {
    const me = this;
    let longestKey = 0, longestValue = 0;

    Object.values(data).forEach((row) => {
      let curKeyLength = 0, curValLength = 0;

      if (Array.isArray(row) && 0 < row.length) {
        const tmp = me.getLongestElements(row);
        curKeyLength = tmp['key'];
        curValLength = tmp['value'];
      } else if (!(!row || !row.key || !row.value)) {
        curKeyLength = row.key.toString().length;
        curValLength = row.value.toString().length;
      } else if ('object' === typeof row && 0 < Object.entries(row).length) {
        const tmp = me.getLongestElements(row);
        curKeyLength = tmp['key'];
        curValLength = tmp['value'];
      }

      if (curKeyLength > longestKey) {
        longestKey = curKeyLength;
      }

      if (curValLength > longestValue) {
        longestValue = curValLength;
      }
    });

    longestKey++;
    longestValue++;

    if (!this._showFullOutput && longestKey + longestValue + 5 > process.stdout.columns) {
      longestValue -= (longestKey + longestValue + 5) - process.stdout.columns;
    }

    return {
      key: longestKey,
      value: longestValue
    };
  }

  get showFullOutput(): boolean {
    return this._showFullOutput;
  }

  set showFullOutput(value: boolean) {
    this._showFullOutput = value;
  }
}

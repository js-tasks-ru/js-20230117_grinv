const getClassPrefix = (prefix) => {
  return (className) => prefix + className;
};

export default class ColumnChart {
  chartHeight = 50;

  constructor (props) {
    this.data = props?.data || [];
    this.label = props?.label || '';
    this.value = props?.value || null;
    this.link = props?.link || null;
    this.formatHeading = props?.formatHeading || null;
    this.prefixedClass = getClassPrefix('column-chart');
    this.createElement();
  }

  createElement() {
    let div = document.createElement('div');
    div.className = `column-chart ${!this.data?.length ? this.prefixedClass('_loading') : ''}`;
    div.style = `--chart-height: ${this.chartHeight}`;

    div.innerHTML = [this.title, this.container].join('');
    this.element = div;
  }

  get title() {
    const url = !this.link ? '' : `
      <a href="${this.link}" class="${this.prefixedClass('__link')}">
        View all
      </a>
    `;

    return `
      <div class="${this.prefixedClass('__title')}">
        ${this.label ? `Total ${this.label}` : 'Loading...'}
        ${url}
      </div>
    `;
  }

  get header() {
    const formattedNumber = Intl.NumberFormat('en').format(this.value);
    return `
      <div data-element="header" class="${this.prefixedClass('__header')}">
        ${this.formatHeading ? this.formatHeading(formattedNumber) : formattedNumber}
      </div>
    `;
  }


  get chartRows () {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data
      .map(item => {
        return {
          percent: (item / maxValue * 100).toFixed(0) + '%',
          value: String(Math.floor(item * scale))
        };
      })
      .reduce((accamulator, nextValue) => {
        return accamulator + `<div style="--value: ${nextValue.value}" data-tooltip="${nextValue.percent}"></div>`;
      }, '');
  }

  get chart() {


    return `
      <div data-element="body" class="${this.prefixedClass('__chart')}">
        ${this.data ? this.chartRows : ''}
      </div>
    `;
  }

  get container() {
    return `
      <div class="${this.prefixedClass('__container')}">
        ${this.header}
        ${this.chart}
      </div>
    `;
  }

  update(data) {
    this.data = data;
    this.createElement();
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    // FYI так и не понял назначение этого метода.
    this.remove();
  }
}

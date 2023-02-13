import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

const getClassPrefix = (prefix) => {
  return (className) => prefix + className;
};
  
export default class ColumnChart {
  chartHeight = 50;
  prefixedClass = getClassPrefix('column-chart');
  data = [];
  subElements = {};
  constructor ({
    url = '',
    label,
    value,
    link,
    range = {},
    formatHeading = (value) => value,
  } = {}) {
    this.url = url;
    this.label = label;
    this.value = value;
    this.link = link;
    this.from = range.from || new Date();
    this.to = range.to || new Date();
    this.formatHeading = formatHeading;
    this.createElement();
  }

  createElement() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = 
    `
      <div class="column-chart" style="--chart-height: ${this.chartHeight}">
        ${this.title}
        ${this.container}
    `;
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.update();
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
  
  get container() {
    return `
      <div class="${this.prefixedClass('__container')}">
        <div data-element="header" class="${this.prefixedClass('__header')}"></div>
        <div data-element="body" class="${this.prefixedClass('__chart')}"></div>
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

  async update(from = this.from, to = this.to) {
    this.from = from;
    this.to = to;
    
    this.element.classList.add(this.prefixedClass('_loading'));
    
    try {
      const fetchUrl = new URL(this.url, BACKEND_URL);
      fetchUrl.searchParams.set('from', this.from.toISOString());
      fetchUrl.searchParams.set('to', this.to.toISOString());
      
      const data = await fetchJson(fetchUrl.toString());
      
      this.data = Object.values(data);
      
      const headerValue = this.data.reduce((accamulator, value) => {
        return accamulator += value;
      }, 0);
      
      const formattedNumber = Intl.NumberFormat('en').format(headerValue);
      this.subElements.header.innerHTML = this.formatHeading(formattedNumber);
      
      this.subElements.body.innerHTML = this.chartRows;
      this.element.classList.remove(this.prefixedClass('_loading'));
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
  
  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }
}

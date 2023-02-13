import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

const collator = new Intl.Collator(['ru', 'en'], {
  caseFirst: 'upper',
});

export default class SortableTable {
  isFetching = false;
  subElements = {};
  data = [];
  offset = 30;
  start = 0;
  end = this.start + this.offset; 
  
  constructor(headersConfig, {
    sorted = {},
    url = '',
    isSortLocally = false,
  } = {}) {
    this.headerConfig = [...headersConfig];
    this.sorted = {
      id: sorted.id || 'title',
      order: sorted.order || 'asc',
    };
    this.url = url;
    this.isSortLocally = isSortLocally;
    
    this.render();
  }
  
  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="sortable-table">
        ${this.renderHeader()}
        <div data-element="body" class="sortable-table__body"></div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          Empty
        </div>
      </div>`;
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    
    this.renderSortArrow();
    
    this.subElements.header.addEventListener('pointerdown', this.onSortHandler);
    this.insertHeaderSortArror();
    this.data = await this.fetchProducts();
    this.renderBodyRaws(this.data);  
    window.addEventListener('scroll', this.infinityScrollHandle);
  }
  
  infinityScrollHandle = () => {
    const endOfPage = window.innerHeight + window.pageYOffset >= document.body.offsetHeight;
    if (endOfPage && !this.isFetching) {
      this.start = this.start + this.offset;
      this.end = this.start + this.offset;
      this.fetchProducts().then(nextData => {
        this.data = [...this.data, ...nextData];
        this.renderBodyRaws(this.data);
      });
    }
  }
  
  renderHeader() {
    const headerItems = this.headerConfig.map(item => {
      return `
        <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}">
          <span>${item.title}</span>
        </div>`;
    }).join('');
    
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${headerItems}
      </div>`;
  }
  
  onSortHandler = (event) => {
    const {id, sortable, order} = event.target.closest('.sortable-table__cell').dataset;
    if (sortable === 'true') {
      this.sorted = {
        id,
        order: order == 'desc' ? 'asc' : 'desc'
      };
      
      this.insertHeaderSortArror();
      
      if (this.isSortLocally) {
        this.sortOnClient(this.sorted.id, this.sorted.order);
      } else {
        this.sortOnServer(this.sorted.id, this.sorted.order);
      }
    }
  }
  
  sortOnClient(id, order) {
    this.insertHeaderSortArror();
    this.renderBodyRaws(this.data);
  }
  
  sortOnServer(id, order) {
    this.start = 0;
    this.end = this.start + this.offset;
    this.fetchProducts().then(data => {
      this.data = data;
      this.renderBodyRaws(data);
    });
  }
  
  getBodyRow(rowData) {
    return this.headerConfig.map(({id, template}) => {
      return template
        ? template(rowData[id])
        : `<div class="sortable-table__cell">${rowData[id]}</div>`;
    }).join('');
  }
  
  renderBodyRaws(data) {
    if (data.length) {
      this.element.classList.remove('sortable-table_empty');
      
      const rows = data.map(rowData => {
        return `
          <a href="/products/${rowData.id}" class="sortable-table__row">
            ${this.getBodyRow(rowData)}
          </a>`;
      }).join('');
      
      return this.subElements.body.innerHTML = rows;
    }
    
    this.element.classList.add('sortable-table_empty');
  }
  
  renderSortArrow () {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
    this.sortArrow = wrapper.firstElementChild;
  }

  get sortedData() {
    const {id, order} = this.sorted;
    const {sortType} = this.headerConfig.find(item => item.id === id);
    
    return [...this.data].sort((a, b) => {
      const compareResult = sortType === 'number'
        ? a[id] - b[id]
        : collator.compare(a[id], b[id]);
      return order === 'asc' ? compareResult : (compareResult * -1);
    });
  }
  
  insertHeaderSortArror () {
    const currentSortCell = this.subElements.header.querySelector(`.sortable-table__cell[data-id='${this.sorted.id}']`);
    this.sortArrow.remove();
    currentSortCell.dataset.order = this.sorted.order;
    currentSortCell.append(this.sortArrow);
  }
  
  async fetchProducts() {
    this.isFetching = true;
    const fetchUrl = new URL(this.url, BACKEND_URL);
    fetchUrl.searchParams.set('_sort', this.sorted.id);
    fetchUrl.searchParams.set('_order', this.sorted.order);
    fetchUrl.searchParams.set('_start', this.start);
    fetchUrl.searchParams.set('_end', this.end);
    
    try {
      this.element.classList.add('sortable-table_loading');
      const data = await fetchJson(fetchUrl.toString());
      this.element.classList.remove('sortable-table_loading');
      return data;
    } catch (error) {
      console.error(error.message);
    } finally {
      this.isFetching = false;
    }
  }
  
  remove() {
    this.element.remove();
  }
  
  destroy () {
    this.remove();
    window.removeEventListener('scroll', this.infinityScrollHandle);
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

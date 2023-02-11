const collator = new Intl.Collator(['ru', 'en'], {
  caseFirst: 'upper',
});
export default class SortableTable {
  subElements = {};
  isSortLocally = true;
  
  constructor(headersConfig, {
    data = [],
    sorted = {}
  } = {}) {
    this.headerConfig = [...headersConfig];
    this.sorted = {...sorted};
    this.data = [...data];
    this.renderSortArrow();
    this.createTable();
  }
  
  onHeaderClickHandler = (event) => {
    const {id, sortable, order} = event.target.closest('.sortable-table__cell').dataset;
    if (sortable === 'true') {
      this.sorted = {
        id,
        order: order == 'desc' ? 'asc' : 'desc'
      };
      
      this.sort();
    }
  }
  
  createTable() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
          ${this.renderHeader()}${this.renderBody()}
        </div>
      </div>`;
    this.element = wrapper.firstElementChild;
    this.subElements.header = this.element.querySelector('.sortable-table__header');
    this.subElements.body = this.element.querySelector('.sortable-table__body');
    this.subElements.header.addEventListener('pointerdown', this.onHeaderClickHandler);
    this.insertHeaderSortArror();
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
  
  getBodyRow(rowData) {
    return this.headerConfig.map(({id, template}) => {
      return template
        ? template(rowData[id])
        : `<div class="sortable-table__cell">${rowData[id]}</div>`;
    }).join('');
  }
  
  get bodyRows() {
    return this.sortedData.map(rowData => {
      return `
        <a href="/products/${rowData.id}" class="sortable-table__row">
          ${this.getBodyRow(rowData)}
        </a>`;
    }).join('');
  }
  
  renderBody() {
    return `<div data-element="body" class="sortable-table__body">${this.bodyRows}</div>`;
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
  
  sortOnClient() {
    this.insertHeaderSortArror();
    this.subElements.body.innerHTML = this.bodyRows;
  }
  
  sortOnServer() {
    // TODO
  }
  
  sort() {
    if (this.isSortLocally) {
      this.sortOnClient();
    } else {
      this.sortOnServer();
    }
  }
  
  destroy () {
    if (this.element) {
      this.element.remove();
    }
  }
}

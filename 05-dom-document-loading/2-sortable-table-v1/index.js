const collator = new Intl.Collator(['ru', 'en'], {
  caseFirst: 'upper',
});

export default class SortableTable {
  subElements = {};
  
  constructor(headerConfig = [], data = []) {
    this.headerConfig = [...headerConfig];
    this.data = [...data];
    this.createTable();
    this.renderSortArrow();
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
    return this.data.map(rowData => {
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

  sortBody(field, direction) {
    const {sortType} = this.headerConfig.find(item => item.id === field);
    
    this.data.sort((a, b) => {
      const compareResult = sortType === 'number'
        ? a[field] - b[field]
        : collator.compare(a[field], b[field]);
      return direction === 'asc' ? compareResult : (compareResult * -1);
    });
    
    this.subElements.body.innerHTML = this.bodyRows;
  }
  
  sort(field, direction) {
    const currentSortCell = this.subElements.header.querySelector(`.sortable-table__cell[data-id='${field}']`);
    if (currentSortCell.dataset.sortable !== 'true') {
      return;
    }
    
    this.sortArrow.remove();
    currentSortCell.dataset.order = direction;
    currentSortCell.append(this.sortArrow);
    
    this.sortBody(field, direction);
  }
  
  destroy () {
    this.element.remove();
  }
}

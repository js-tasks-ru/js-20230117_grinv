import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  productData = {};
  categories = [];

  constructor (productId) {
    this.productId = productId;
  }

  async render () {
    const categoriesPromise = this.fetchCategories();
    const productsPromise = this.productId ? this.fetchProductData() : Promise.resolve();

    await Promise.all([
      productsPromise,
      categoriesPromise
    ]);

    const wrapper = document.createElement('div');
    wrapper.innerHTML =
    `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input value="${escapeHtml(this.productData.title || '')}" required="" type="text" name="title" class="form-control" placeholder="Название товара" id="title">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара" id="description">${escapeHtml(this.productData.description || '')}</textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
              <ul class="sortable-list" data-element="imageListContainerList">
                ${this.images}
              </ul>
            </div>
            <button data-element="imageButton" type="button" name="uploadImage" class="button-primary-outline">
              <span>Загрузить</span>
            </button>
          </div>
          <input hidden="" data-element="uploadImageInput" type="file" name="image-upload-input" accept="image/png, image/jpeg">
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
              ${this.сategoryOptions}
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input id="price" value="${this.productData.price}" required="" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input id="discount" value="${this.productData.discount}" required="" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input id="quantity" value="${this.productData.quantity}" required="" type="number" class="form-control" name="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              ${this.productId ? "Сохранить" : "Добавить"} товар
            </button>
          </div>
        </form>
      </div>
    `;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    const subcategoryElement = this.subElements.productForm.querySelector('#subcategory');
    subcategoryElement.value = this.productData.subcategory;
    const statusElement = this.subElements.productForm.querySelector('#status');
    statusElement.value = this.productData.status;

    this.initEvents();

    return this.element;
  }

  initEvents() {
    this.subElements.imageListContainerList.addEventListener('pointerup', this.onDeleteImage)
    this.subElements.productForm.addEventListener('submit', this.onSubmit)
    this.subElements.imageButton.addEventListener('pointerup', () => this.subElements.uploadImageInput.click())
    this.subElements.uploadImageInput.addEventListener('change', this.onUploadImage)
  }

  async fetchProductData() {
    const fetchUrl = new URL('api/rest/products', BACKEND_URL);
    fetchUrl.searchParams.append('id', this.productId);
    const productData = await fetchJson(fetchUrl);
    this.productData = productData[0];
  }

  async fetchCategories() {
    const fetchUrl = new URL('api/rest/categories', BACKEND_URL);
    fetchUrl.searchParams.append('_sort', 'weight');
    fetchUrl.searchParams.append('_refs', 'subcategory');
    const categories = await fetchJson(fetchUrl);
    this.categories = categories;
  }

  get сategoryOptions() {
    const getOption = (id, title) => {
      return `<option value="${id}">${title}</option>`;
    };

    if (this.categories) {
      return this.categories.map(category => {
        return category.subcategories.map(subcategory => {
          return getOption(subcategory.id, `${category.title} &gt; ${subcategory.title}`);
        }).join('');
      }).join('');
    }

    return null;
  }

  getImage(url = '', source = '', deletehash = '') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
        <input type="hidden" name="url" value="${url}">
        <input type="hidden" name="source" value="${source}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${url}">
          <span>${source}</span>
        </span>
        <button type="button" class="delete-button" data-source="${source}" data-deletehash="${deletehash}">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>`;

    return wrapper.firstElementChild;
  }

  get images() {
    if (this.productData?.images) {
      return this.productData.images.map(image => this.getImage(image.url, image.source).outerHTML).join('');
    }

    return '';
  }

  onDeleteImage = async (event) => {
    const deleteButton = event.target.closest('.delete-button');
    if (!deleteButton) {
      return;
    }

    deleteButton.closest('.products-edit__imagelist-item').remove();

    const deletehash = deleteButton.dataset.deletehash;
    if (deletehash) {
      try {
        await fetchJson(`https://api.imgur.com/3/image/${deletehash}`, {
          method: 'DELETE',
          headers: new Headers({
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          }),
          referrer: ''
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  onUploadImage = (event) => {
    const upload = async (imageFile) => {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        this.subElements.imageButton.classList.add('is-loading');
        this.subElements.imageButton.disabled = true;

        const {data} = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: new Headers({
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          }),
          body: formData,
          referrer: ''
        });

        this.subElements.imageListContainerList.append(this.getImage(data.link, imageFile.name, data.deletehash))
        this.subElements.imageButton.classList.remove('is-loading');
        this.subElements.imageButton.disabled = false;
      } catch (error) {
        console.error(error);
      }
    }

    const imageFile = event.target.files[0];
    if (!imageFile) {
      return;
    }

    upload(imageFile);
  }

  async save() {
    const formData = new FormData(this.subElements.productForm);
    const sources = formData.getAll('source');
    const images = formData.getAll('url').map((url, index) => ({
      url,
      source: sources[index]
    }));

    const data = {
      id: this.productId,
      title: escapeHtml(formData.get('title')),
      description: escapeHtml(formData.get('description')),
      subcategory: formData.get('subcategory'),
      price: Number(formData.get('price')),
      quantity: Number(formData.get('quantity')),
      discount: Number(formData.get('discount')),
      status: Number(formData.get('status')),
      images
    };

    try {
      const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      this.dispatchEvent(result.id);
    } catch (error) {
      console.error(error);
    }
  }

  dispatchEvent(id) {
    const event = this.productId
      ? new CustomEvent('product-updated', { detail: id })
      : new CustomEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.save();
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

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
  }
}

// Крутая задача. Полдня на неё убил))
// Причём из-за глупости сделал одну маленькуюошибку в одной строке
// и потратил 1,5 часа на деббаг. Уже отчаялся))
//
// А вообще появилась пара вопросов:
// Насколько затратно постоянно вызывать element.getBoundingClientRect()?
// 1) Есть ли смысл вынести в константу и записывать значения в константу
//   только при ресайзе элемента?
// 2) Есть ли смысл использовать document.body.querySelector / document.body.addEventListener
//   вместо document.querySelector / document.addEventListener
//   Кажется, что это на одну вложеность меньше и поэтому парсер по DOM дереву
//   будет проходить чутка быстрее. Или мне кажется?

function clamp(val, min, max) {
  if (val > max) {
    return max;
  }
  
  if (val < min) {
    return min;
  }
  
  return val;
}

export default class DoubleSlider {
  subElements = {};
  moveSide = null;
  
  constructor({
    min = 0,
    max = 100,
    formatValue = (value) => value,
    selected = {},
  }) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.from = selected.from || min;
    this.to = selected.to || max;
    this.render();
  }
  
  setInitialPosition() {
    const leftSlidePosition = this.from === this.min
      ? 0
      : (this.from - this.min) / (this.max - this.min) * 100;
    this.updateLeftData(leftSlidePosition);
    
    const rightSlidePosition = this.to === this.max
      ? 0
      : 100 - ((this.to - this.min) / (this.max - this.min) * 100);
    this.updateRightData(rightSlidePosition);
  }
  
  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML =
    `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(this.from)}</span>
        <div class="range-slider__inner" data-element="progressWrapper">
          <span class="range-slider__progress" data-element="progress"></span>
          <span class="range-slider__thumb-left" data-element="leftSlide"></span>
          <span class="range-slider__thumb-right" data-element="rightSlide"></span>
        </div>
        <span data-element="to">${this.formatValue(this.to)}</span>
      </div>
    `;
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.setInitialPosition();
    this.subElements.leftSlide.addEventListener('pointerdown', this.addMoveEvent);
    this.subElements.rightSlide.addEventListener('pointerdown', this.addMoveEvent);
  }
  
  addMoveEvent = (event) => {
    this.moveSlide = event.target;
    this.element.classList.add('range-slider_dragging');
    document.addEventListener('pointermove', this.onMoveSlide);
    document.addEventListener('pointerup', this.removeMoveEvents);
  }
  
  removeMoveEvents = () => {
    this.moveSide = null;
    this.element.classList.remove('range-slider_dragging');
    document.removeEventListener('pointermove', this.onMoveSlide);
    
    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: { from: this.from, to: this.to },
      bubbles: true
    }));
  }
  
  onMoveSlide = (event) => {
    const {left, right, width} = this.subElements.progressWrapper.getBoundingClientRect();
    if (this.moveSlide === this.subElements.leftSlide) {
      const leftPosition = event.clientX - left;
      const distanceOfRightSlideFromLeftSide = 100 - Number.parseFloat(this.subElements.rightSlide.style.right);
      const percent = (leftPosition / width * 100).toFixed(1);
      const position = clamp(percent, 0, distanceOfRightSlideFromLeftSide);
      this.updateLeftData(position);
    } else {
      const rightPosition = right - event.clientX;
      const distanceOfLeftSlideFromRightSide = 100 - Number.parseFloat(this.subElements.leftSlide.style.left);
      const percent = (rightPosition / width * 100).toFixed(1);
      const position = clamp(percent, 0, distanceOfLeftSlideFromRightSide);
      this.updateRightData(position);
    }
  }
  
  updateLeftData(position) {
    this.subElements.leftSlide.style.left = `${position}%`;
    this.subElements.progress.style.left = `${position}%`;
    
    const value = this.min + ((this.max - this.min) / 100 * position);
    this.from = Math.round(value);
    this.subElements.from.innerHTML = this.formatValue(this.from);
  }
  
  updateRightData(position) {
    this.subElements.rightSlide.style.right = `${position}%`;
    this.subElements.progress.style.right = `${position}%`;
    
    const value = this.min + ((this.max - this.min) / 100 * (100 - position));
    this.to = Math.round(value);
    this.subElements.to.innerHTML = this.formatValue(this.to);
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
  
  destroy() {
    this.element.remove();
    document.removeEventListener('pointermove', this.onMoveSlide);
    document.removeEventListener('pointerup', this.removeMoveEvents);
  }
}

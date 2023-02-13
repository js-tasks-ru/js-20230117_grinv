class Tooltip {
  static #instance = null;
  
  constructor() {
    if (Tooltip.#instance) {
      return Tooltip.#instance;
    }
    
    Tooltip.#instance = this;
  }
  
  initialize () {
    this.create();
    const allTooltipShowingElements = document.querySelectorAll('[data-tooltip]');
    allTooltipShowingElements.forEach(element => {
      element.addEventListener('pointerover', this.show);
      element.addEventListener('pointerout', this.hide);
    });
  }
  
  create() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="tooltip"></div>';
    this.element = wrapper.firstElementChild;
  }
  
  render(text) {
    this.element.innerHTML = text;
    document.body.append(this.element);
  }
  
  show = (event) => {
    this.render(event.target.dataset.tooltip);
    document.addEventListener('pointermove', this.observeMovement);
  }
  
  hide = () => {
    document.removeEventListener('pointermove', this.observeMovement);
    if (this.element) {
      this.element.remove();
    }
  }
  
  observeMovement = (event) => {
    this.element.style.cssText = `
    position: absolute;
    top: ${Math.ceil(event.clientY + 7)}px;
    left: ${Math.ceil(event.clientX + 7)}px;
  `;
  }
  
  destroy() {
    this.hide();
    const allTooltipShowingElements = document.querySelectorAll('[data-tooltip]');
    allTooltipShowingElements.forEach(element => {
      element.removeEventListener('pointerover', this.show);
      element.removeEventListener('pointerout', this.hide);
    });
  }
}

export default Tooltip;

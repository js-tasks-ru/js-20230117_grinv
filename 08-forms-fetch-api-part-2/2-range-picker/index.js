export default class RangePicker {
  tempSelection = [];
  locale = "ru";

  constructor({ from = new Date(), to = new Date() } = {}) {
    // очень жёсткую багу сделал
    // изначально написал `this.startDate = from;`
    // в итоге startDate и from ссылались на один объект
    // и когда в prevMonth() менял startDate, from менялась вместе с ним
    // пару часов отлавливал :)
    this.startDate = new Date(from);
    this.selected = { from, to };
    this.init();
  }

  init() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="rangepicker">
          <div class="rangepicker__input" data-element="input">
              <span data-element="from"></span> -
              <span data-element="to"></span>
          </div>
          <div class="rangepicker__selector" data-element="selector"></div>
      </div>`;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.insertPickedDates();

    this.subElements.input.addEventListener("click", this.toggle);
    this.subElements.selector.addEventListener("click", this.handleSelection);
    document.addEventListener("click", this.onDocumentClick, true);
  }

  handleSelection = (event) => {
    if (event.target.closest(".rangepicker__cell")) {
      this.tempSelection.push(event.target.dataset.value);
      if (this.tempSelection.length === 2) {
        this.executeRangeSelection();
      } else {
        this.renderHighlight();
      }
    }
  };

  executeRangeSelection() {
    this.tempSelection.sort((a, b) => Date.parse(a) - Date.parse(b));
    this.selected.from = new Date(this.tempSelection[0]);
    this.selected.to = new Date(this.tempSelection[1]);
    this.tempSelection = [];
    this.insertPickedDates();
    this.renderHighlight();
    this.toggle();
  }

  dispatchEvent() {
    this.element.dispatchEvent(
      new CustomEvent("date-select", {
        bubbles: true,
        detail: this.selected,
      })
    );
  }

  insertPickedDates() {
    this.subElements.from.innerHTML = this.getFormattedDate(this.selected.from);
    this.subElements.to.innerHTML = this.getFormattedDate(this.selected.to);
  }

  getFormattedDate(date) {
    return new Intl.DateTimeFormat(this.locale, { dateStyle: "short" }).format(
      new Date(date)
    );
  }

  toggle = () => {
    this.element.classList.toggle("rangepicker_open");
    if (this.element.classList.contains("rangepicker_open")) {
      this.renderRangePicker();
    }
  };

  onDocumentClick = (event) => {
    if (
      this.element.classList.contains("rangepicker_open") &&
      !this.element.contains(event.target)
    ) {
      this.toggle();
    }
  };

  prevMonth = () => {
    this.startDate.setMonth(this.startDate.getMonth() - 1);
    this.renderRangePicker();
  };

  nextMonth = () => {
    this.startDate.setMonth(this.startDate.getMonth() + 1);
    this.renderRangePicker();
  };

  getMonthName(date) {
    return new Intl.DateTimeFormat(this.locale, { month: "long" }).format(
      new Date(date)
    );
  }

  renderRangePicker() {
    const dateLeft = new Date(this.startDate);
    const dateRight = new Date(this.startDate);
    dateRight.setMonth(dateRight.getMonth() + 1);

    this.subElements.selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.getRangepickerCalendar(dateLeft)}
      ${this.getRangepickerCalendar(dateRight)}`;

    this.renderHighlight();

    const arrowLeft = this.subElements.selector.querySelector(
      ".rangepicker__selector-control-left"
    );
    arrowLeft.addEventListener("click", this.prevMonth);

    const arrowRight = this.subElements.selector.querySelector(
      ".rangepicker__selector-control-right"
    );
    arrowRight.addEventListener("click", this.nextMonth);
  }

  getFirstDayOffset(date) {
    const dayIndex = date.getDay();
    const index = dayIndex === 0 ? 6 : dayIndex - 1;
    return index + 1;
  }

  renderOneDay(date, index) {
    const currentDate = new Date(date);
    currentDate.setDate(index + 1);
    const isoValue = currentDate.toISOString();

    const style =
      index === 0
        ? `style="--start-from: ${this.getFirstDayOffset(currentDate)}"`
        : "";
    return `<button type="button" class="rangepicker__cell" data-value="${isoValue}" ${style}>${
      index + 1
    }</button>`;
  }

  getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  renderDays(date) {
    const monthDays = new Array(this.getDaysInMonth(date))
      .fill("_")
      .map((_, index) => {
        return this.renderOneDay(date, index);
      });
    return monthDays.join("");
  }

  getRangepickerCalendar(date) {
    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime=${this.getMonthName(
            date,
            this.locale
          )}>${this.getMonthName(date)}</time>
        </div>
        <div class="rangepicker__day-of-week">
          ${this.renderWeekDays()}
        </div>
        <div class="rangepicker__date-grid">
          ${this.renderDays(date)}
        </div>
      </div>`;
  }

  renderHighlight() {
    this.subElements.selector
      .querySelectorAll(".rangepicker__cell")
      .forEach((element) => {
        const isoValue = element.dataset.value;

        element.classList.value = "";
        const fromDate = this.tempSelection.length
          ? new Date(this.tempSelection[0])
          : this.selected.from;
        const toDate = this.tempSelection.length ? null : this.selected.to;

        const fromISO = fromDate.toISOString();
        let toISO = toDate?.toISOString();

        element.classList.add("rangepicker__cell");

        if (fromISO && isoValue === fromISO) {
          element.classList.add("rangepicker__selected-from");
        } else if (toISO && isoValue === toISO) {
          element.classList.add("rangepicker__selected-to");
        } else if (fromISO && isoValue > fromISO && toISO && isoValue < toISO) {
          element.classList.add("rangepicker__selected-between");
        }
      });
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll("[data-element]");

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }

  renderWeekDays() {
    const baseDate = new Date(Date.UTC(2017, 0, 2)); // just a Monday
    const format = new Intl.DateTimeFormat(this.locale, { weekday: "short" })
      .format;

    return new Array(7)
      .fill("_")
      .map(() => {
        const weekDay = format(baseDate);
        baseDate.setDate(baseDate.getDate() + 1);
        return `<div>${weekDay}</div>`;
      })
      .join("");
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    document.removeEventListener("click", this.onDocumentClick, true);
  }
}

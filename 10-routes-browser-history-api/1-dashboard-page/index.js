import RangePicker from "./components/range-picker/src/index.js";
import SortableTable from "./components/sortable-table/src/index.js";
import ColumnChart from "./components/column-chart/src/index.js";
import header from "./bestsellers-header.js";

export default class Page {
  components = {};
  subElements = {};

  constructor() {}

  render() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="dashboard">
        <div class="content__top-panel">
            <h2 class="page-title">Dashboard</h2>
            <!-- RangePicker component -->
            <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
            <!-- column-chart components -->
            <div data-element="ordersChart" class="dashboard__chart_orders"></div>
            <div data-element="salesChart" class="dashboard__chart_sales"></div>
            <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>

        <h3 class="block-title">Best sellers</h3>

        <div data-element="sortableTable">
            <!-- sortable-table component -->
        </div>
        </div>
    `;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.initComponents();
    this.renderComponents();
    this.components.rangePicker.element.addEventListener(
      "date-select",
      this.selectDate
    );
    document.querySelector(".main")?.classList.remove("is-loading");
    return this.element;
  }

  initComponents() {
    const from = new Date();
    const to = new Date(new Date().setMonth(from.getMonth() + 1));

    this.components.rangePicker = new RangePicker({ from, to });

    this.components.ordersChart = new ColumnChart({
      url: "/api/dashboard/orders",
      label: "Заказы",
      range: { from, to },
    });

    this.components.salesChart = new ColumnChart({
      url: "/api/dashboard/sales",
      label: "Продажи",
      link: "/sales",
      range: { from, to },
    });

    this.components.customersChart = new ColumnChart({
      url: "/api/dashboard/customers",
      label: "Клиенты",
      range: { from, to },
    });

    this.components.sortableTable = new SortableTable(header, {
      url: "api/dashboard/bestsellers",
    });
  }

  renderComponents() {
    Object.entries(this.components).forEach(([name, component]) =>
      this.subElements[name].append(component.element)
    );
  }

  async updateComponents(from, to) {
    const data = await this.components.sortableTable.loadData(
      this.components.sortableTable.sorted.id,
      this.components.sortableTable.sorted.order,
      null,
      null,
      from,
      to
    );

    this.components.sortableTable.data = [];
    this.components.sortableTable.update(data);

    [
      this.components.salesChart,
      this.components.customersChart,
      this.components.ordersChart,
    ].forEach((chart) => chart.update(from, to));
  }

  selectDate = (event) => {
    this.updateComponents(event.detail.from, event.detail.to);
  };

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll("[data-element]");

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
    Object.values(this.components).forEach((component) => component.destroy());
    this.components = {};
    this.element = null;
    this.remove();
  }
}

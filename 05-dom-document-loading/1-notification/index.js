export default class NotificationMessage {
  static notification = null;
  
  constructor(message = '', config = {}) {
    this.message = message;
    this.duration = config.duration;
    this.type = config.type;
    this.createNotification();
  }
  
  createNotification() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;
    this.element = wrapper.firstElementChild;
  }
  
  show(target = document.body) {
    if (NotificationMessage.notification) {
      clearTimeout(NotificationMessage.notification.timeout);
      NotificationMessage.notification.remove();
    }
    
    NotificationMessage.notification = this;
    this.timeout = setTimeout(this.remove.bind(this), this.duration);
    target.append(this.element);

  }
  remove() {
    this.element.remove();
  }
  
  destroy() {
    this.remove();
  }
}

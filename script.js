
class Dependent {

  static target = null;

  constructor() {
    this.subscribers = [];
  }

  // add subscriber
  depend() {
    if (Dependent.target && !this.subscribers.includes(Dependent.target)) {
      console.log("Dependent.target", Dependent.target)
      this.subscribers.push(Dependent.target);
    }
  }

  notify() {
    console.log('Dependent.notify');
    this.subscribers.forEach(sub => sub.update());
  }
}


function defineReactive(obj, key, val) {
  console.log('defineReactive', obj, key, val);
  const dep = new Dependent();

  Object.defineProperty(obj, key, {
    get() {
      console.log('defineReactive.get', val);
      if (Dependent.target) {
        dep.depend(Dependent.target);
      }
      return val;
    },
    set(newVal) {
      console.log('defineReactive.set', newVal);
      if (newVal !== val) {
        val = newVal;
        dep.notify();
      }
    }
  });
}

class Watcher {
  constructor(vm, renderFn) {
    console.log('Watcher.constructor');
    this.vm = vm;
    this.renderFn = renderFn;
    this.get();
  }

  get() {
    console.log('Watcher.get');
    Dependent.target = this;
    this.renderFn.call(this.vm);
    Dependent.target = null;
  }

  update() {
    console.log('Watcher.update');
    this.get();
  }
}

class SimpleVue {
  $data = {};
  $el = null;

  constructor(options) {
    console.log('SimpleVue.constructor')
    this.$data = options.data();
    this.$el = document.querySelector(options.el);

    this.initReactivity(this.$data);
    new Watcher(this, this.render.bind(this));
  }

  initReactivity(data) {
    console.log('SimpleVue.initReactivity')

    Object.keys(data).forEach(key => {
      defineReactive(this.$data, key, data[key]);
    });

    // find element with {{ }} and add "data-key" attr on element
    const nodes = this.$el.childNodes;
    nodes.forEach(node => {
      if (node.nodeType === 1) {
        const template = node.textContent;
        const reg = /\{\{(.*)\}\}/;
        if (reg.test(template)) {
          const key = template.match(reg)[1].trim();
          node.setAttribute('data-template', template);
        }
      }
    });

  }

  // render variables
  render() {
    console.log('SimpleVue.render')
    const nodes = this.$el.childNodes;
    nodes.forEach(node => {
      // find element with attr data-template and update text-content with data variable
      if (node.nodeType === 1) {
        const template = node.getAttribute('data-template');
        const reg = /\{\{(.*)\}\}/;
        if (reg.test(template)) {
          const key = template.match(reg)[1].trim();
          node.textContent = template.replace(reg, this.$data[key]);
        }
      }
    });

    // bind model
    const inputs = this.$el.querySelectorAll('input[model]');
    inputs.forEach(input => {
      const model = input.getAttribute('model');
      input.value = this.$data[model];
      input.addEventListener('input', (event) => {
        this.$data[model] = event.target.value;
      });
    });

  }
}

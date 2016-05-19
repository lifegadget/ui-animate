import Ember from 'ember';
import layout from '../templates/components/ui-animate';
import ddau from '../mixins/ddau';
const { keys, create } = Object; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observe, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line
const ANIMATION_EVENTS = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

const animate = Ember.Component.extend(ddau,{
  layout,
  tagName: '',
  event: 'load',
  delay: 0,
  iterations: 1,
  duration: 1,
  exit: false,
  enter: false,
  repeat: false,
  _repeat: computed('repeat', {
    set(_, value) {
      return value;
    },
    get() {
      return this.get('repeat');
    }
  }),
  init() {
    this._super(...arguments);
    run.schedule('afterRender', () => {
      const {enter, event, _domElement} = this.getProperties('enter', 'event', '_domElement');
      if(enter) {
        if(_domElement.className) {
          _domElement.className += ' animation-ready';
        } else {
          _domElement.className = 'animation-ready';
        }
      }
      if(this.get('event') === 'load') {
        this.start();
      } else {
        this.registerTargetEvent({
          target: _domElement,
          type: event,
          callback: this.start.bind(this)
        });
      }
    });
  },
  willDestroyElement() {
    this.get('_listeners').forEach(listener => {
      this.unregisterListener(listener.target, listener.type, listener.callback);
    });
    this.removeAnimationEvents();
  },
  domClass: undefined,
  domElement: undefined,
  hasBlockJs: computed(function() {
    this.set('blockAnimation', true);
  }),
  blockAnimation: false,
  /**
   * Will attempt to identify the domElement from the various sources (in order):
   * 1. if "domElement" set then look for that ID in DOM
   * 2. if "domClass" set then look for array of dom elements that have class and take first
   * 3. look at the parentView and resolve using its "elementId" (if tagless you must ensure id exists in template)
   */
  _domElement: computed('parentView', 'domElement', 'elementId', 'event', function() {
    const {parentView, domElement, domClass, elementId, blockAnimation} = this.getProperties('parentView', 'domElement', 'domClass', 'elementId', 'blockAnimation');
    const animator = window.document.getElementById(`${elementId}`);

    let el;
    if(animator && blockAnimation) { el = animator; }
    else if (domElement) {
      el = window.document.getElementById(domElement);
    } else if (domClass) {
      el = window.document.getElementsByClassName(domClass)[0];
    } else {
      el = window.document.getElementById(parentView.elementId);
    }

    return el;
  }),
  registerTargetEvent(evt) {
    this.get('_listeners').push(evt);
    this.registerListener(evt.target, evt.type, evt.callback);
  },
  removeTargetEvents() {
    this.get('_listeners').forEach(evt => {
      this.unregisterListener(evt.target, evt.type, evt.callback);
    });
  },
  registerAnimationEvents() {
    const _domElement = get(this, '_domElement');
    ANIMATION_EVENTS.split(' ').forEach(evt => {
      this.registerListener(_domElement, evt, this.stop.bind(this));
    });
  },
  removeAnimationEvents() {
    const _domElement = get(this, '_domElement');
    ANIMATION_EVENTS.split(' ').forEach(evt => {
      this.unregisterListener(_domElement, evt, this.stop.bind(this));
    });
  },
  registerListener(target, type, callback) {
    if (!target) {
      debug(`No target for event for ${type} event. Check your targetted DOM element exists.`);
    } else {
      const fn = target.addEventListener ? 'addEventListener' : 'attachEvent';
      const eventName = target.addEventListener ? type : 'on' + type;

      target[fn](eventName, callback);
    }
  },
  unregisterListener(target, type, callback) {
    const fn = target.removeEventListener ? 'removeEventListener' : 'detachEvent';
    const eventName = target.addEventListener ? type : 'on' + type;

    target[fn](eventName, callback);
  },
  _listeners: computed(() => []),

  start() {
    this.registerAnimationEvents();
    if(this.get('enter')) {
      const className = this.get('_domElement').className.replace(/ *animation-ready/, '');
      this.get('_domElement').className = className;
    }
    if(this.animate) {
      this.animate();
    }
  },
  loop() {
    let _repeat = this.get('_repeat');
    if (!isNaN(Number(_repeat))) {
      this.set('_repeat', --_repeat);
    }

    if(_repeat) { this.animate(); }
  },
  stop() {
    const {_domElement, repeat, exit} = this.getProperties('_domElement', 'repeat', 'exit');
    _domElement.className = _domElement.className.replace(`animated ${this.get('animation')}`, '');

    if(repeat) {
      run.next(() => {
        this.ddau('onLoopCompletion', this, this);
        this.loop();
      });
    } else {
      this.ddau('onCompletion', this, this);
      this.removeAnimationEvents();
    }

    if(exit) {
      if (_domElement.className) {
        _domElement.className += ' animation-done';
      } else {
        _domElement.className = 'animation-done';
      }
    }
  },
  animate() {
    let {animation, _domElement, duration, delay, iterations, infinite} = this.getProperties('animation', '_domElement', 'duration', 'delay', 'iterations', 'infinite');
    if(!_domElement) {
      debug('no DOM element was detected!');
      return;
    }

    run.next(() => {
      if (duration) { _domElement.style.animationDuration = duration + 's'; }
      if (delay) { _domElement.style.animationDelay = delay + 's'; }
      if (iterations) { _domElement.style.animationIterationCount = iterations; }

      const toInfinity = infinite ? ' infinite' : '';
      _domElement.className += ` animated${toInfinity} ${animation}`;
    });
  },
});
animate.reopenClass({
  positionalParams: ['animation']
});
animate[Ember.NAME_KEY] = 'ui-animate';
export default animate;

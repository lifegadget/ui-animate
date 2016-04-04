import Ember from 'ember';
import layout from '../templates/components/ui-animate';
const { keys, create } = Object; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observe, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line
const ANIMATION_EVENTS = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

const animate = Ember.Component.extend({
  layout,
  tagName: '',
  event: 'load',
  delay: 0,
  iterations: 1,
  duration: 1,
  repeat: false,
  init() {
    this._super(...arguments);
    run.schedule('afterRender', () => {
      const {event, _domElement} = this.getProperties('event', '_domElement');
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
  domElement: undefined,
  _domElement: computed('parentView', 'domElement', 'elementId', 'event', function() {
    const {parentView, domElement, elementId} = this.getProperties('parentView', 'domElement', 'elementId');
    const animator = document.getElementById(`animator-${elementId}`);

    let el;
    if(animator) { el = animator; }
    else if (domElement) {
      el = document.getElementById(domElement);
      console.log('ID: ', el);
    } else {
      el = document.getElementById(parentView.elementId);
    }

    return el;
  }),
  registerTargetEvent(evt) {
    console.log('registering target event: ', evt);
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
      this.removeEventListener(_domElement, evt, this.stop.bind(this));
    });
  },
    registerListener(target, type, callback) {
      const fn = target.addEventListener ? 'addEventListener' : 'attachEvent';
      const eventName = target.addEventListener ? type : 'on' + type;

      target[fn](eventName, callback);
    },
  unregisterListener(target, type, callback) {
    const fn = target.removeEventListener ? 'removeEventListener' : 'detachEvent';
    const eventName = target.addEventListener ? type : 'on' + type;

    target[fn](eventName, callback);
  },
  _listeners: computed(() => []),

  start(evt) {
    console.log('start', evt);
    this.registerAnimationEvents();
    if(this.animate) {
      this.animate();
      if(this.get('repeat')) {
        this.loop();
      }
    }
  },
  stop() {
    let _domElement = this.get('_domElement');
    ANIMATION_EVENTS.split(' ').forEach(evt => {
      this.unregisterListener(_domElement, evt, this.stop.bind(this));
    });
    const removeClasses = _domElement.className.replace(`animated ${this.get('animation')}`, '');
    _domElement.className = removeClasses ? removeClasses : '';
    this.set('_domElement', _domElement);
  },
  loop() {

  },
  animate() {
    let {animation, _domElement, duration, delay, iterations} = this.getProperties('animation', '_domElement', 'duration', 'delay', 'iterations');
    if(!_domElement) {
      debug('no DOM element was detected!');
      return;
    }

    run.later(() => {
      if (duration) {
        _domElement.style.animationDuration = duration;
      }
      if (iterations) {
        _domElement.style.animationIterationCount = iterations;
      }
      _domElement.className += ` animated ${animation}`;
    }, delay);
  },
});
animate.reopenClass({
  positionalParams: ['animation']
});
animate[Ember.NAME_KEY] = 'ui-animate';
export default animate;

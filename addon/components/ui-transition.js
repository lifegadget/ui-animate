import Ember from 'ember';
import layout from '../templates/components/ui-transition';
import _ from 'lodash/lodash';
const { computed, observer, typeOf, debug, run, get } = Ember;
const a = Ember.A;
const arrayOf = function(thingy) {
  return typeOf(thingy) === 'string' ? thingy.split(/,\s*/g) : thingy;
};
const dasherize = thingy => {
  return thingy ? Ember.String.dasherize(thingy) : thingy;
};

const transition = Ember.Component.extend({
  layout,
  tagName: 'transition',
  classNameBindings: ['initialized'],
  attributeBindings: ['name'],

  init() {
    this._super(...arguments);
    this._domElements = {};
    this.get('yieldedProps'); // populates _domElements
    this.showed = arrayOf(this.get('show'));
    run.scheduleOnce('afterRender', () => {
      this.get('hidden').map(name => {
        const el = window.document.getElementById(this._domElements[name]);
        el.className += ' animation-ready';
      });
      Object.keys(this._domElements).map(name => {
        window.document.getElementById(this._domElements[name]).className += ' transition-target';
      });
      this.set('initialized', true);
    });
  },

  yieldedProps: computed('names', 'ids', function() {
    const names = this.get('names');
    const ids = this.get('ids');
    const yielded = {
      id: {}
    };
    if(names) {
      arrayOf(names).map(name => {
        const randomId = dasherize(get(this, 'name')) + '-' + Math.random().toString(36).substr(2, 10);
        this._domElements[name] = yielded.id[name] = randomId;
      });
    } else if (ids) {
      yielded.id = ids;
    } else {
      debug('"ui-transition" needs either the "names" or "ids" property to be set');
    }

    return yielded;
  }),

  name: 'unnamed-transition',

  animate: null,
  _animate: computed('animate', function() {
    return this._getAnimations('animate');
  }),
  reverse: null,
  _reverse: computed('reverse', function() {
    return this._getAnimations('reverse');
  }),
  /**
   * Internal API to allow properties to take a CSV or array
   * based input and convert it to an animation pairing that has
   * an "in" and "out" property. If array is of length 1 then
   * both properties are the same.
   *
   * @param   {String} prop
   * @returns {Object}
   */
  _getAnimations(prop) {
    const arrayOfProp = arrayOf(this.get(prop));
    return {
      in: arrayOfProp[0],
      out: arrayOfProp.length > 1 ? arrayOfProp[1] : arrayOfProp[0]
    };
  },

  show: null,
  _show: computed('show', function() {
    return arrayOf(this.get('show'));
  }),
  showed: null, // the last known state of "show"
  onShowChange: observer('show', function() {
    const { _show, showed, inParallel } = this.getProperties('_show', 'showed', 'inParallel');
    const unchanged = _.intersection(_show, showed);
    const entered = _.difference(_show, showed).map(name => this._domElements[name]);
    const exited = _.difference(showed, _show).map(name => this._domElements[name]);
    this.set('showed', _show);
    console.log({unchanged, entered, exited});
    if (entered) {
      this._addReadiness(entered);
      this._removeHidden(entered);
      this.set('entering', entered);
    }
    if (exited) {
      this.set('exiting', exited);
    }
    // START the transitions
    this.set('transitioningOut', true);
    if(inParallel) {
      this.set('transitioningIn', true);
    }
  }),

  animating: null,
  hidden: computed('show','animating', function() {
    const { _show, animating } = this.getProperties('_show', 'animating');
    return Object.keys(this._domElements).filter(name => {
      const isAnimating = a(animating || []).includes(name);
      const isShowing = a(_show || []).includes(name);
      return !(isAnimating || isShowing);
    });
  }),
  _hide(elements) {
    elements = arrayOf(elements);
    elements.map(el => {
      window.document.getElementById(el).classList.add('hidden');
    });
  },
  _removeHidden(elements) {
    elements = arrayOf(elements);
    elements.map(el => {
      window.document.getElementById(el).classList.remove('hidden');
    });
  },
  _addReadiness(elements) {
    elements = arrayOf(elements);
    elements.map(el => {
      window.document.getElementById(el).classList.add('animation-ready');
    });
    // run.later(() => {
    //   elements.map(el => {
    //     window.document.getElementById(el).classList.remove('animation-ready');
    //   });
    // }, 100);
  },
  _getExtents(element) {
    return {
      width: window.document.getElementById(element).width,
      height: window.document.getElementById(element).height,
    }
  },

  duration: 1,

  // ANIMATION EVENT STATES
  transitioningIn: false,
  transitioningOut: false,
  reversingIn: false,
  reversingOut: false,
  // ANIMATION TARGETs
  entering: null,
  exiting: null,

  actions: {
    completed(item, direction, isReversed) {
      const { inParallel } = this.getProperties('inParallel');
      console.log({item, direction, isReversed});
      if (direction === 'out') {
        this.set('transitioningOut', false);
        // this._hide(item);
        if(!inParallel) {
          this.set('transitioningIn', true);
        }
      } else {
        this.set('transitioningIn', false);
      }
    }
  }

});

transition.reopenClass({
  positionalParams: ['name']
});
transition[Ember.NAME_KEY] = 'ui-transition';
export default transition;

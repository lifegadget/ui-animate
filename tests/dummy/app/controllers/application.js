import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observe, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line


export default Ember.Controller.extend({
  actions: {
    nextButtonPlease() {
      const target = window.document.getElementById('hello-button');
      const event = new window.CustomEvent('bespoke');
      console.log('firing custom event on ', target);
      target.dispatchEvent(event);
    },
    allGone() {
      console.log('All buttons are gone! What will we do?');
    }
  }
});

/* jshint node: true */
'use strict';
const merge = require('merge');
const path = require('path');

module.exports = {
  name: 'ui-animate',
  included(app, parentAddon) {
      const target = (parentAddon || app);
      this._super.included(target);
      const addonConfig = this.addonConfig = app.project.config(app.env)['uiAnimate'] || {};
      const addonBuildConfig = app.options['uiAnimate'];
      let o = merge({ useSASS: false }, addonConfig, addonBuildConfig);

      if (o.useSASS) {
         // TODO: need to split effects into different files
      } else {
        target.import(path.join(app.bowerDirectory, 'animate.css/animate.css'));
      }
    },};

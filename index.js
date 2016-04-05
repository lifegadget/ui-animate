/* jshint node: true */
'use strict';
const merge = require('merge');
const fs = require('fs');
const path = require('path');
const Funnel = require('broccoli-funnel');

module.exports = {
  name: 'ui-animate',
  included(app, parentAddon) {
      const target = (parentAddon || app);
      this._super.included(target);
      const addonConfig = this.addonConfig = app.project.config(app.env)['uiAnimate'] || {};
      const addonBuildConfig = app.options['uiAnimate'];
      let o = merge({ include: false }, addonConfig, addonBuildConfig);

      if (o.include) {
        target.import('ui-animate/source/_base.css');
        if(typeof o.include === 'string') {
          o.include = o.include.split(',');
        }
        if(o.includeType) {
          if(typeof o.includeType === 'string') {
            o.includeType = o.includeType.split(',');
          }
          o.includeType.forEach(type => {
            const files = fs.readdirSync(type);
            files.forEach(f => o.include.push(`${type}/${f}`));
          });
        }

        o.include.forEach(file => {
          target.import(`ui-animate/source/${file}`);
        });

      } else {
        target.import('ui-animate/animate.css');
      }
    },

    treeForVendor: function() {
      var pathToAnimateEntryScript = require.resolve('animate.css');
      var pathToAnimatePackageRoot = path.dirname(pathToAnimateEntryScript);
      var tree = this.treeGenerator(pathToAnimatePackageRoot);

      return new Funnel(tree, { destDir: 'ui-animate' });
    },
  };

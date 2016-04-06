/* jshint node: true */
'use strict';
const merge = require('merge');
const fs = require('fs');
const path = require('path');
const Funnel = require('broccoli-funnel');
const log = require('broccoli-stew').log; /* jshint ignore:line */
const treeMap = require('broccoli-stew').map; /* jshint ignore:line */
const findInTree = require('broccoli-stew').find; /* jshint ignore:line */
const recursiveReadSync = require('recursive-readdir-sync');
const chalk = require('chalk');

Array.prototype.contains = function (element) {
  for (var i = 0; i < this.length; i++) {
      if (this[i] == element) {
          return true;
      }
  }

  return false;
};


module.exports = {
  name: 'ui-animate',
  treeForVendor: function(tree) {
    var trees = [];
    if(tree) {
      trees.push(tree);
    }
    var pathToAnimateEntryScript = require.resolve('animate.css');
    var pathToAnimatePackageRoot = path.dirname(pathToAnimateEntryScript);
    var cssTree = this.treeGenerator(pathToAnimatePackageRoot);
    var cssFunnel = new Funnel(cssTree, {
      include: [new RegExp(/\.css$/)],
      destDir: 'ui-animate'
    });
    // var cssFunnel = log(new Funnel(cssTree, {
    //   include: [new RegExp(/\.css$/)],
    //   destDir: 'ui-animate'
    // }), { output: 'tree', label: 'funnel'});

    return cssFunnel;
  },
  getFiles() {
    const localCssSourcePath = path.join(path.dirname(require.resolve('animate.css'), 'source'));
    let files;
    try {
      files = recursiveReadSync(localCssSourcePath);
    } catch(err) {
      console.log(chalk.red.bold('Error: ') + chalk.white(' problems with loading animate.css animation files'));
      console.error(err);
    }
    return files.map(f=>f.split('/').splice(-2).join('/')).filter(f => f.indexOf(/\.css$/) === -1);
  },
  findFile(fileRef, files) {
    if(!files) { files = []; }
    if(files.contains(fileRef)) {
      return fileRef;
    } else if (files.filter(f => f.indexOf(fileRef) !== -1).length > 0) {
      return files.filter(f => f.indexOf(fileRef) !== -1)[0];
    } else {
      return false;
    }
  },
  included(app, parentAddon) {
      const target = (parentAddon || app);
      this._super.included(target);
      const addonConfig = this.addonConfig = app.project.config(app.env)['uiAnimate'] || {};
      const addonBuildConfig = app.options['uiAnimate'];
      const notFound = [];
      let o = merge({ include: false }, addonConfig, addonBuildConfig);

      if (o.include || o.includeGroup) {
        const sourceDir = 'vendor/ui-animate/source';
        const cssFiles = this.getFiles();

        // add basic animation support
        target.import(`${sourceDir}/_base.css`);

        // safety: ensure include is an array
        if(typeof o.include === 'string') {
          o.include = o.include.split(',');
        }
        if (!o.include) { o.include = []; }

        // build up list of files
        o.include = o.include.map(f => {
          const file = this.findFile(f, cssFiles);
          if (file) {
            return file;
          } else {
            notFound.push(f);
            return false;
          }
        }).filter(f => f !== false);

        // process file groups
        if(o.includeGroup) {
          if (typeof o.includeGroup === 'string') {
            o.includeGroup = o.includeGroup.split(',');
          }

          o.includeGroup.forEach(group => {
            const groupFiles = cssFiles.filter(f => f.indexOf(group) !== -1);
            o.include = o.include.concat(groupFiles);
          });
        }

        // add specific CSS files to app.import
        o.include.forEach(file => {
          const baseName = file.replace(/\.css$/, '');
          target.import(`${sourceDir}/${baseName}.css`);
        });
        const templates = o.include.map(f => f.split('/').pop().replace('.css', ''));
        this.ui.writeLine(`ui-animate: included ${chalk.grey(templates.join(', '))} templates`);
        if(notFound.length > 0) {
          this.ui.writeLine(`${chalk.red('ui-animate: ')} missing ${chalk.grey(notFound.join(', '))} templates`);
        }
      } else {
        // Include ALL animations
        target.import('vendor/ui-animate/animate.css');
        this.ui.writeLine(`ui-animate: included ${chalk.bold('all')} animate.css templates`);
      }


    },

  };

'use strict';
const Gulp = require('gulp');
const JsDoc = require('gulp-jsdoc3');

Gulp.task('documentation', (cb) => {

  const config = require('./jsdoc.json');

  Gulp.src([
    'README.md',
    './server/*'
  ], { read: false })
    .pipe(JsDoc(config, cb));

});


Gulp.task('css', () => {

  Gulp.src([
    './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './node_modules/select2/dist/css/select2.min.css'
  ]).pipe(Gulp.dest('./server/web/public/css/lib/'));
});


Gulp.task('cssDatatables', () => {

  Gulp.src([
    './node_modules/datatables.net-bs4/css/dataTables.bootstrap4.min.css',
    './node_modules/datatables.net-buttons-bs4/css/buttons.bootstrap4.min.css'
  ]).pipe(Gulp.dest('./server/web/public/css/lib/datatables/'));
});


Gulp.task('js', () => {

  Gulp.src([
    './node_modules/bootstrap/dist/js/bootstrap.min.js',
    './node_modules/chart.js/dist/Chart.min.js',
    './node_modules/joi-browser/dist/joi-browser.js',
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/moment/moment.js',
    './node_modules/mustache/mustache.min.js',
    './node_modules/popper.js/dist/popper.min.js',
    './node_modules/select2/dist/js/select2.full.min.js'
  ]).pipe(Gulp.dest('./server/web/public/js/lib/'));
});

Gulp.task('jsDatatables', () => {

  Gulp.src([
    './node_modules/datatables.net-buttons-bs4/js/buttons.bootstrap4.min.js',
    './node_modules/datatables.net-buttons/js/buttons.colVis.min.js',
    './node_modules/datatables.net-buttons/js/buttons.html5.min.js',
    './node_modules/datatables.net-buttons/js/buttons.print.min.js',
    './node_modules/datatables.net-bs4/js/dataTables.bootstrap4.min.js',
    './node_modules/datatables.net-buttons/js/dataTables.buttons.min.js',
    './node_modules/datatables.net/js/jquery.dataTables.min.js',
    './node_modules/jszip/dist/jszip.min.js',
    './node_modules/pdfmake/build/pdfmake.min.js',
    './node_modules/pdfmake/build/vfs_fonts.js'
  ]).pipe(Gulp.dest('./server/web/public/js/lib/datatables/'));
});

const tasks = ['css', 'cssDatatables','js', 'jsDatatables'];

Gulp.task('default', tasks);

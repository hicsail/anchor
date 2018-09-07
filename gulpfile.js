'use strict';
const Gulp = require('gulp');
const JsDoc = require('gulp-jsdoc3');
const Nodemon = require('gulp-nodemon');

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
    './node_modules/bulma/css/bulma.min.css',
    './node_modules/select2/dist/css/select2.min.css'
  ]).pipe(Gulp.dest('./server/web/public/css/lib/'));
});


Gulp.task('ag-grid', () => {

  Gulp.src([
    './node_modules/ag-grid/dist/styles/ag-grid.css',
    './node_modules/ag-grid/dist/styles/ag-theme-balham.css'
  ]).pipe(Gulp.dest('./server/web/public/css/lib/'));

  Gulp.src([
    './node_modules/ag-grid/dist/ag-grid.min.noStyle.js'
  ]).pipe(Gulp.dest('./server/web/public/js/lib/'));
});


Gulp.task('js', () => {

  Gulp.src([
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/moment/moment.js',
    './node_modules/select2/dist/js/select2.full.min.js'
  ]).pipe(Gulp.dest('./server/web/public/js/lib/'));
});

Gulp.task('clientSideJs', () => {

  Gulp.src('./server/web/views/**/*.js').pipe(Gulp.dest('./server/web/public/js/'));
});

Gulp.task('watch', (done) => {

  Nodemon({
    script: 'server.js',
    ext: 'js html jsx css',
    watch: 'src/',
    delay: 1,
    done
  }).on('restart', () => {

    Gulp.run('clientSideJs');
  });
});

const tasks = ['css', 'ag-grid','js','clientSideJs'];

Gulp.task('default', tasks);

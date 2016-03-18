// Define plugins
var gulp = require('gulp'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    bs = require('browser-sync').create(),
    $ = require('gulp-load-plugins')();

// Process the app JavaScript (own and required)
gulp.task('scripts', function() {
  var b = browserify({
    entries: './src/js/app.js',
    debug: true,
  });
  return b.bundle()
    .pipe(source('./app.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.babel())
    .pipe($.uglify())
    .on('error', $.util.log)
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./app/js'));
  });

// Process SASS files
gulp.task('styles', function () {
  return gulp.src('./src/sass/*.scss')
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass({outputStyle: 'compressed'}))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe($.cleanCss({compatibility: 'ie8'}))
    .on('error', $.util.log)
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./app/css'));
  });

// Process HTML files
gulp.task('htmlmin', function() {
  return gulp.src('./src/*.html')
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.htmlmin({
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeTagWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .on('error', $.util.log)
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
});

// Serve and watch for changes in files
gulp.task('serve', function() {
    bs.init({
      server: './'
    });
    var appFiles = ['./app/*', './app/js/*', './app/css/*'];
    gulp.watch('./src/js/*.js', ['scripts']);
    gulp.watch('./src/sass/*.scss', ['styles']);
    gulp.watch('./src/*.html', ['htmlmin']);
    gulp.watch(appFiles).on('change',bs.reload);
});

gulp.task('default', ['scripts', 'styles', 'htmlmin', 'serve']);